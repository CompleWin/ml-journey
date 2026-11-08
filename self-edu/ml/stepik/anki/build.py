"""Собирает колоду Anki из cards.txt.

Запуск из корня репозитория:
    uv run --no-project --with genanki python self-edu/ml/stepik/anki/build.py

GUID заметки строится из поля ID, поэтому после правки cards.txt и повторного
импорта Anki обновит карточки и сохранит прогресс повторения.
"""

import html
import re
import sys
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEPIK = HERE.parent
CARDS = HERE / "cards.txt"
OUTPUT = HERE / "ml-balakirev.apkg"

ROOT_DECK = "ML Балакирев"
MODEL_ID = 1742605311
DECK_ID_BASE = 1742605400
GUID_SALT = "ml-balakirev"
ALLOWED_TAGS = {"понятие", "формула", "задача"}

KEY_RE = re.compile(r"^(ID|Q|A|E|IMG|TAG):\s?(.*)$")
DECK_RE = re.compile(r"^@deck\s+(\d+)\s*\|\s*(.+)$")
MATH_RE = re.compile(r"\$\$(.+?)\$\$|\$(.+?)\$")

CSS = """
.card {
  font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif;
  font-size: 19px;
  line-height: 1.5;
  text-align: left;
  color: #1f2328;
  background: #ffffff;
  max-width: 680px;
  margin: 0 auto;
  padding: 8px 14px;
}
.lesson { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.question { font-weight: 600; }
hr#answer { border: 0; border-top: 1px solid #d0d7de; margin: 14px 0; }
.note {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 16px;
  color: #4b5563;
  background: #f4f5f7;
  border-radius: 6px;
}
.picture { margin-top: 12px; }
.picture img { max-width: 100%; height: auto; background: #ffffff; border-radius: 6px; }
code {
  font-family: Consolas, Menlo, monospace;
  font-size: 0.9em;
  padding: 1px 5px;
  background: #eef0f3;
  border-radius: 4px;
}
ul, ol { margin: 4px 0; padding-left: 24px; }
.nightMode.card, .night_mode .card { color: #e6e8eb; background: #1e1f22; }
.nightMode .lesson { color: #9ca3af; }
.nightMode hr#answer { border-top-color: #3f4247; }
.nightMode .note { color: #c9ccd1; background: #2b2d31; }
.nightMode code { background: #33363b; }
"""

FRONT = """<div class="lesson">{{Урок}}</div>
<div class="question">{{Вопрос}}</div>"""

BACK = """{{FrontSide}}
<hr id="answer">
<div class="answer">{{Ответ}}</div>
{{#Картинка}}<div class="picture">{{Картинка}}</div>{{/Картинка}}
{{#Пояснение}}<div class="note">{{Пояснение}}</div>{{/Пояснение}}"""


@dataclass
class Card:
    id: str
    deck_no: str
    deck_title: str
    q: str = ""
    a: str = ""
    e: str = ""
    img: str = ""
    tag: str = "понятие"


def parse(path=CARDS):
    cards, current, key = [], None, None
    deck_no = deck_title = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if line.startswith("#") or (not line and key is None):
            continue
        deck = DECK_RE.match(line)
        if deck:
            deck_no, deck_title = deck.groups()
            current = key = None
            continue
        match = KEY_RE.match(line)
        if match:
            key, value = match.groups()
            if key == "ID":
                current = Card(value.strip(), deck_no, deck_title)
                cards.append(current)
            elif key == "TAG":
                current.tag = value.strip()
            else:
                setattr(current, key.lower(), value)
            continue
        if line and current is not None and key in ("Q", "A", "E"):
            attr = key.lower()
            joined = getattr(current, attr)
            setattr(current, attr, f"{joined}\n{line}" if joined else line)
    return cards


def inline_text(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    return re.sub(r"`(.+?)`", r"<code>\1</code>", text)


def inline(line):
    """Переводит $...$ в MathJax Anki, экранируя HTML и внутри формул."""
    parts, pos = [], 0
    for match in MATH_RE.finditer(line):
        parts.append(inline_text(line[pos:match.start()]))
        block, span = match.groups()
        if block is not None:
            parts.append(rf"\[{html.escape(block, quote=False)}\]")
        else:
            parts.append(rf"\({html.escape(span, quote=False)}\)")
        pos = match.end()
    parts.append(inline_text(line[pos:]))
    return "".join(parts)


def render(text):
    """Строки, списки "- " и "1. " превращает в HTML."""
    out, open_list = [], None
    for line in text.strip().splitlines():
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
        else:
            out.append(inline(line) + "<br>")
    if open_list:
        out.append(f"</{open_list}>")
    return re.sub(r"(<br>)+$", "", "".join(out))


def validate(cards):
    errors, seen = [], set()
    for card in cards:
        if card.id in seen:
            errors.append(f"{card.id}: повторяющийся ID")
        seen.add(card.id)
        if not card.q.strip() or not card.a.strip():
            errors.append(f"{card.id}: нет вопроса или ответа")
        if card.tag not in ALLOWED_TAGS:
            errors.append(f"{card.id}: неизвестный тег {card.tag}")
        if card.img and not (STEPIK / card.img).is_file():
            errors.append(f"{card.id}: нет файла {card.img}")
        for name in ("q", "a", "e"):
            if getattr(card, name).replace("$$", "").count("$") % 2:
                errors.append(f"{card.id}: непарный $ в поле {name}")
    return errors


def build(cards, output=OUTPUT):
    import genanki

    model = genanki.Model(
        MODEL_ID,
        "ML Балакирев: вопрос и ответ",
        fields=[{"name": name} for name in
                ("Вопрос", "Ответ", "Пояснение", "Картинка", "Урок", "ID")],
        templates=[{"name": "Карточка", "qfmt": FRONT, "afmt": BACK}],
        css=CSS,
    )

    decks, media = {}, []
    for card in cards:
        if card.deck_no not in decks:
            decks[card.deck_no] = genanki.Deck(
                DECK_ID_BASE + int(card.deck_no),
                f"{ROOT_DECK}::{card.deck_no} {card.deck_title}",
            )
        picture = ""
        if card.img:
            path = STEPIK / card.img
            media.append(str(path))
            picture = f'<img src="{path.name}">'
        decks[card.deck_no].add_note(genanki.Note(
            model=model,
            fields=[render(card.q), render(card.a), render(card.e), picture,
                    card.deck_title, card.id],
            tags=["ml-balakirev", f"урок-{card.deck_no}", card.tag],
            guid=genanki.guid_for(GUID_SALT, card.id),
        ))

    package = genanki.Package(list(decks.values()))
    package.media_files = sorted(set(media))
    package.write_to_file(str(output))


def main():
    cards = parse()
    errors = validate(cards)
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    build(cards)
    counts = {}
    for card in cards:
        counts[card.deck_no] = counts.get(card.deck_no, 0) + 1
    print(f"Карточек: {len(cards)}; по урокам: {counts}")
    print(f"Файл: {OUTPUT}")


if __name__ == "__main__":
    main()
