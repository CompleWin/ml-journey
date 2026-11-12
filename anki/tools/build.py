"""Собирает колоды Anki из папок тем в anki/decks/.

Каждая тема лежит в своей папке: anki/decks/<источник>/<тема>/
    cards.txt     карточки (формат описан в docs/ANKI.md)
    figures.py    скрипт картинок (необязательно)
    media/        картинки
На выходе в той же папке появляется <тема>.apkg: его и импортируют в Anki.
Картинки, тип заметки и стили едут внутри .apkg.

Запуск из корня репозитория:
    uv run --no-project --with genanki python anki/tools/build.py anki/decks/stepik/10-sgd
    uv run --no-project --with genanki python anki/tools/build.py            # все темы
    ... build.py <папка темы> --preview   # ещё и preview.html для проверки в браузере

GUID заметки = соль + путь папки темы + ID карточки. Поэтому папку темы
не переименовывают, а ID не меняют: иначе Anki сочтёт карточку новой
и прогресс повторения потеряется.
"""

import hashlib
import html
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DECKS = HERE.parent / "decks"

# DECK в cards.txt и есть полное имя колоды в Anki, общего корня нет.
MODEL_ID = 1763000000
MODEL_NAME = "Вопрос и ответ (конспекты)"
# Соль GUID не менять: по ней Anki узнаёт уже импортированные карточки.
GUID_SALT = "ml-journey"

HEADER_RE = re.compile(r"^(DECK|SOURCE|TAGS):\s*(.*)$")
KEY_RE = re.compile(r"^(ID|Q|QIMG|A|IMG|SRC):\s?(.*)$")
OLD_KEY_RE = re.compile(r"^(TYPE|E):")
MATH_RE = re.compile(r"\$\$(.+?)\$\$|\$(.+?)\$")
TEXT_KEYS = ("Q", "A")

FIELDS = ["Вопрос", "КартинкаВопрос", "Ответ", "Картинка", "Раздел", "ID"]

# Одна сторона вопрос, другая ответ. Типографика и ночная тема
# из английской колоды (Cloze EN Helper), синий акцент на главном.
CSS = """.card { text-align: left; }

.mc {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 21px;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 16px;
}
.mc .question { font-size: 23px; font-weight: 600; }
.mc hr { border: none; border-top: 1px solid #e3e3e3; margin: 18px 0; }
.mc .answer { font-size: 21px; }
.mc .answer b { color: #1565c0; }

.mc .section { margin-top: 16px; font-size: 13px; color: #b5b5b5; }

.mc .image { margin-top: 14px; }
.mc .image img { max-width: 100%; max-height: 380px; border-radius: 8px; display: block; background: #fff; }

.mc ul, .mc ol { margin: 4px 0; padding-left: 24px; }
.mc code {
  font-family: ui-monospace, "SF Mono", Consolas, Menlo, monospace;
  font-size: 0.88em;
  padding: 1px 5px;
  background: #f0f0ee;
  border-radius: 4px;
}
.mc pre {
  margin: 8px 0;
  padding: 10px 12px;
  background: #f6f6f4;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 16px;
  line-height: 1.45;
}
.mc pre code { padding: 0; background: none; font-size: 1em; }

b { font-weight: 600; }

/* Тёмная тема Anki */
.nightMode .mc, .night_mode .mc { color: #e0e0e0; }
.nightMode .mc .answer b, .night_mode .mc .answer b { color: #6db3f2; }
.nightMode .mc .section, .night_mode .mc .section { color: #6a6a6a; }
.nightMode .mc hr, .night_mode .mc hr { border-color: #4a4a4a; }
.nightMode .mc code, .night_mode .mc code { background: #33363b; }
.nightMode .mc pre, .night_mode .mc pre { background: #2b2d31; }
"""

FRONT = """<div class="mc">
  <div class="question">{{Вопрос}}</div>
  {{#КартинкаВопрос}}<div class="image">{{КартинкаВопрос}}</div>{{/КартинкаВопрос}}
</div>"""

BACK = """{{FrontSide}}
<div class="mc">
  <hr id="answer">
  <div class="answer">{{Ответ}}</div>
  {{#Картинка}}<div class="image">{{Картинка}}</div>{{/Картинка}}
  {{#Раздел}}<div class="section">{{Раздел}}</div>{{/Раздел}}
</div>"""


@dataclass
class Card:
    id: str
    q: str = ""
    qimg: str = ""
    a: str = ""
    img: str = ""
    src: str = ""


@dataclass
class Topic:
    folder: Path
    deck: str = ""
    source: str = ""
    tags: list = field(default_factory=list)
    cards: list = field(default_factory=list)

    @property
    def key(self):
        return self.folder.relative_to(DECKS).as_posix()

    @property
    def media_prefix(self):
        return "mlj_" + re.sub(r"[^0-9A-Za-z]+", "_", self.key).strip("_") + "__"


def parse(folder):
    topic = Topic(folder)
    current = key = None
    in_fence = False

    def append(text):
        attr = key.lower()
        joined = getattr(current, attr)
        setattr(current, attr, f"{joined}\n{text}" if joined else text)

    for raw in (folder / "cards.txt").read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if in_fence:  # внутри ```блока кода``` строки берутся как есть
            append(line)
            in_fence = not line.strip().startswith("```")
            continue
        if not line or line.startswith("#"):
            continue
        if current is None:
            header = HEADER_RE.match(line)
            if header:
                name, value = header.groups()
                if name == "TAGS":
                    topic.tags = value.split()
                else:
                    setattr(topic, name.lower(), value.strip())
                continue
        if OLD_KEY_RE.match(line):
            raise SystemExit(f"{folder}: поля TYPE и E больше нет, "
                             f"пояснение пиши в ответ A: {line[:40]}")
        match = KEY_RE.match(line)
        if match:
            key, value = match.groups()
            if key == "ID":
                current = Card(value.strip())
                topic.cards.append(current)
            elif current is None:
                raise SystemExit(f"{folder}: поле {key} до первого ID")
            elif key in TEXT_KEYS:
                setattr(current, key.lower(), value)
                in_fence = value.strip().startswith("```")
            else:
                setattr(current, key.lower(), value.strip())
            continue
        if current is not None and key in TEXT_KEYS:
            append(line)
            in_fence = line.strip().startswith("```")
    return topic


def inline(line):
    """`код` -> <code>, $...$ / $$...$$ -> MathJax Anki, **жирный**, *курсив*.

    Код и формулы сначала прячутся за метками, чтобы ** внутри них не стал
    жирным, а **$формула$** целиком стал."""
    saved = []

    def stash(html_text):
        saved.append(html_text)
        return f"\x00{len(saved) - 1}\x00"

    text = re.sub(r"`([^`]+)`",
                  lambda m: stash(f"<code>{html.escape(m.group(1), quote=False)}</code>"), line)

    def math(m):
        block, span = m.groups()
        if block is not None:
            return stash(rf"\[{html.escape(block, quote=False)}\]")
        return stash(rf"\({html.escape(span, quote=False)}\)")

    text = MATH_RE.sub(math, text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", text)
    return re.sub("\x00(\\d+)\x00", lambda m: saved[int(m.group(1))], text)


def render(text):
    """Строки, списки "- " / "1. " и блоки ```код``` -> HTML."""
    out, open_list, fence = [], None, None
    for line in text.strip("\n").splitlines():
        if fence is not None:
            if line.strip().startswith("```"):
                out.append("<pre><code>" + html.escape("\n".join(fence), quote=False) + "</code></pre>")
                fence = None
            else:
                fence.append(line)
            continue
        if line.strip().startswith("```"):
            if open_list:
                out.append(f"</{open_list}>")
                open_list = None
            fence = []
            continue
        line = line.strip()
        bullet = re.match(r"^- (.*)$", line)
        number = re.match(r"^\d+\. (.*)$", line)
        wanted = "ul" if bullet else "ol" if number else None
        if open_list and open_list != wanted:
            out.append(f"</{open_list}>")
            open_list = None
        if wanted:
            if not open_list:
                out.append(f"<{wanted}>")
                open_list = wanted
            out.append(f"<li>{inline((bullet or number).group(1))}</li>")
        elif line:
            out.append(inline(line) + "<br>")
    if open_list:
        out.append(f"</{open_list}>")
    if fence is not None:
        out.append("<pre><code>" + html.escape("\n".join(fence), quote=False) + "</code></pre>")
    html_text = "".join(out)
    html_text = re.sub(r"<br>(<(?:ul|ol|pre)>)", r"\1", html_text)
    return re.sub(r"(<br>)+$", "", html_text)


def validate(topic):
    errors, seen = [], set()
    if not topic.deck:
        errors.append("нет строки DECK:")
    if not topic.cards:
        errors.append("нет карточек")
    for card in topic.cards:
        where = f"{topic.key}/{card.id}"
        if card.id in seen:
            errors.append(f"{where}: повторяющийся ID")
        seen.add(card.id)
        if not card.q.strip() or not card.a.strip():
            errors.append(f"{where}: нет вопроса или ответа")
        for name in ("qimg", "img"):
            path = getattr(card, name)
            if path and not (topic.folder / path).is_file():
                errors.append(f"{where}: нет файла {path}")
        for name in TEXT_KEYS:
            body = getattr(card, name.lower())
            body = re.sub(r"```.*?```", "", body, flags=re.S)
            body = re.sub(r"`[^`]*`", "", body)
            if body.replace("$$", "").count("$") % 2:
                errors.append(f"{where}: непарный $ в поле {name}")
    return errors


def deck_id(name):
    return int(hashlib.sha1(name.encode("utf-8")).hexdigest()[:8], 16) + (1 << 30)


def notes(topic, media_dir):
    """Готовит поля заметок; картинки копирует в media_dir с уникальными именами."""
    media, rows = [], []

    def picture(rel):
        if not rel:
            return ""
        src = topic.folder / rel
        name = topic.media_prefix + src.name
        dst = media_dir / name
        shutil.copyfile(src, dst)
        media.append(str(dst))
        return f'<img src="{name}">'

    for card in topic.cards:
        rows.append(dict(
            fields=[render(card.q), picture(card.qimg), render(card.a),
                    picture(card.img), html.escape(card.src), card.id],
            tags=topic.tags,
            guid_parts=(GUID_SALT, topic.key, card.id),
        ))
    return rows, media


def build(topic):
    import genanki

    model = genanki.Model(
        MODEL_ID, MODEL_NAME,
        fields=[{"name": name} for name in FIELDS],
        templates=[{"name": "Карточка", "qfmt": FRONT, "afmt": BACK}],
        css=CSS,
        sort_field_index=0,
    )
    deck = genanki.Deck(deck_id(topic.deck), topic.deck)
    output = topic.folder / f"{topic.folder.name}.apkg"
    with tempfile.TemporaryDirectory() as tmp:
        rows, media = notes(topic, Path(tmp))
        for row in rows:
            deck.add_note(genanki.Note(
                model=model, fields=row["fields"], tags=row["tags"],
                guid=genanki.guid_for(*row["guid_parts"]),
            ))
        package = genanki.Package(deck)
        package.media_files = sorted(set(media))
        package.write_to_file(str(output))
    return output


PREVIEW = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script>window.MathJax = {{ tex: {{ inlineMath: [['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]']] }} }};</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js"></script>
<style>
body {{ background: #ececea; margin: 0; padding: 24px 12px; }}
body.night_mode {{ background: #1e1f22; }}
.pv {{ max-width: 900px; margin: 0 auto 22px; background: #fff; border-radius: 12px; padding: 14px 0; }}
.night_mode .pv {{ background: #2c2c2c; }}
.pv-id {{ font: 12px monospace; color: #9a9a9a; padding: 0 16px; }}
.toggle {{ position: fixed; top: 10px; right: 10px; }}
{css}
</style></head>
<body class="card">
<button class="toggle" onclick="document.body.classList.toggle('night_mode')">ночная тема</button>
{cards}
</body></html>"""


def preview(topic):
    """HTML со всеми карточками (вопрос + ответ) для проверки вёрстки без Anki."""
    import base64

    with tempfile.TemporaryDirectory() as tmp:
        rows, media = notes(topic, Path(tmp))
        inline_media = {Path(m).name: base64.b64encode(Path(m).read_bytes()).decode() for m in media}
    blocks = []
    for row in rows:
        values = dict(zip(FIELDS, row["fields"]))
        text = BACK.replace("{{FrontSide}}", FRONT)
        for name, value in values.items():
            if not value:
                text = re.sub(r"\{\{#%s\}\}.*?\{\{/%s\}\}" % (name, name), "", text, flags=re.S)
            text = text.replace("{{#%s}}" % name, "").replace("{{/%s}}" % name, "")
            text = text.replace("{{%s}}" % name, value)
        for name, data in inline_media.items():
            text = text.replace(f'src="{name}"', f'src="data:image/png;base64,{data}"')
        blocks.append(f'<div class="pv"><div class="pv-id">{values["ID"]}</div>{text}</div>')
    out = topic.folder / "preview.html"
    out.write_text(PREVIEW.format(title=html.escape(topic.deck), css=CSS, cards="\n".join(blocks)),
                   encoding="utf-8")
    return out


def topic_folders(args):
    if args:
        return [Path(a).resolve() for a in args]
    return sorted(p.parent for p in DECKS.rglob("cards.txt"))


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    want_preview = "--preview" in sys.argv
    failed = False
    for folder in topic_folders(args):
        topic = parse(folder)
        errors = validate(topic)
        if errors:
            failed = True
            print(f"[{topic.key}] ошибки:\n  " + "\n  ".join(errors))
            continue
        output = build(topic)
        print(f"[{topic.key}] {topic.deck}: карточек {len(topic.cards)}")
        print(f"  -> {output.relative_to(ROOT)}")
        if want_preview:
            print(f"  -> {preview(topic).relative_to(ROOT)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
