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

`uv sync` сам скачает нужный Python, если его нет, и создаст `.venv` с точными версиями из `uv.lock`. В задании 3 torchvision при первом запуске скачает веса ResNet-18 (~45 МБ).

```bash
uv run marimo edit lab2.py
```

### Добавить библиотеку

```bash
uv add <пакет>
```

Команда обновит `pyproject.toml` и `uv.lock`. Коммитить нужно оба файла.
