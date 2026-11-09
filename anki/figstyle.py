"""Общий стиль картинок для карточек.

В figures.py темы:
    import sys; from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from figstyle import new, save, C

    fig, ax = new()
    ax.plot(x, y, color=C.blue)
    save(fig, "loss-parabola")      # -> media/loss-parabola.png рядом с figures.py
"""

import inspect
from pathlib import Path
from types import SimpleNamespace

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

# Палитра в тон карточкам: синий акцент колоды, красный для ошибок.
C = SimpleNamespace(
    blue="#1565c0",
    red="#c62828",
    green="#2e7d32",
    orange="#ef6c00",
    purple="#6a1b9a",
    gray="#9a9a9a",
    ink="#1a1a1a",
    light="#e3e3e3",
)

plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.edgecolor": "#555555",
    "axes.labelcolor": C.ink,
    "axes.titlesize": 14,
    "axes.labelsize": 13,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.color": "#ececec",
    "grid.linewidth": 0.8,
    "xtick.color": "#555555",
    "ytick.color": "#555555",
    "xtick.labelsize": 11,
    "ytick.labelsize": 11,
    "legend.fontsize": 11,
    "legend.frameon": False,
    "lines.linewidth": 2.2,
    "font.size": 12,
    "font.family": "DejaVu Sans",
    "mathtext.fontset": "dejavusans",
})


def new(ncols=1, nrows=1, size=(6.4, 4.0), **kwargs):
    """Фигура стандартного размера: на карточке выглядит одинаково."""
    width, height = size
    return plt.subplots(nrows, ncols, figsize=(width, height), **kwargs)


def save(fig, name):
    """Сохраняет в media/<name>.png рядом с вызывающим figures.py."""
    caller = Path(inspect.stack()[1].filename).resolve().parent
    out = caller / "media" / f"{name}.png"
    out.parent.mkdir(exist_ok=True)
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"  {out.relative_to(caller)}")
    return out
