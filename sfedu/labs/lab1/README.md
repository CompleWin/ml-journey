## Окружение

### Запуск

Нужен установленный [uv](https://docs.astral.sh/uv/getting-started/installation/).

На Windows:
```bash
winget install astral-sh.uv
```
На MacOs:
```bash
brew install uv
```


Дальше из папки лабораторной:

```bash
uv sync
```

```bash
uv run marimo edit lab1.py
```

`uv sync` сам скачает нужный Python, если его нет, и создаст `.venv` с точными версиями из `uv.lock`.

Прогнать ноутбук целиком без интерфейса:

```bash
uv run python lab1.py
```

### Добавить библиотеку

```bash
uv add <пакет>
```

Команда обновит `pyproject.toml` и `uv.lock`. Коммитить нужно оба файла.
