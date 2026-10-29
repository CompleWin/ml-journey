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
uv run jupyter lab lab2.ipynb
```

`uv sync` сам скачает нужный Python, если его нет, и создаст `.venv` с точными версиями из `uv.lock`. В задании 3 torchvision при первом запуске скачает веса ResNet-18 (~45 МБ).

Прогнать ноутбук целиком без интерфейса (около 2 минут):

```bash
uv run jupyter nbconvert --to notebook --execute --inplace lab2.ipynb
```

### Добавить библиотеку

```bash
uv add <пакет>
```

Команда обновит `pyproject.toml` и `uv.lock`. Коммитить нужно оба файла.

## Объяснение

Разбор всей лабораторной с графиками и выводами: [explanation/lab2_explanation.md](explanation/lab2_explanation.md).
