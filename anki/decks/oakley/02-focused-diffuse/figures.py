"""Картинки к главе 2 «Думай как математик»: сфокусированный и рассеянный режимы."""

import sys
from pathlib import Path

import numpy as np
from matplotlib.patches import Circle, Rectangle

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "tools"))
from figstyle import C, new, save  # noqa: E402


# ---------- пинбол ----------

def board(ax, title):
    """Рамка автомата с закруглённым верхом и пружиной справа."""
    t = np.linspace(0, np.pi, 60)
    top_x = 3 + 3 * np.cos(t)
    top_y = 7 + 1.4 * np.sin(t)
    xs = np.concatenate([[6], top_x, [0, 6]])
    ys = np.concatenate([[0], top_y, [0, 0]])
    ax.plot(xs, ys, color=C.ink, lw=2)
    ax.plot([5.4, 5.4], [0, 6.6], color=C.ink, lw=1.2)        # стенка жёлоба
    ax.plot([5.7] * 2, [0.0, 0.5], color=C.gray, lw=4)          # пружина
    ax.set_xlim(-0.4, 6.4)
    ax.set_ylim(-0.6, 8.8)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(title, fontsize=15)


def bumpers(ax, xs, ys, r):
    for x in xs:
        for y in ys:
            ax.add_patch(Circle((x, y), r, color=C.gray, zorder=3))


def thought_path(ax, pts, color=C.blue, trodden=0):
    pts = np.array(pts)
    if trodden:
        seg = pts[: trodden + 1]
        ax.plot(seg[:, 0], seg[:, 1], color=color, lw=11, alpha=0.18,
                solid_capstyle="round", zorder=2)
    ax.plot(pts[:, 0], pts[:, 1], color=color, lw=2, zorder=4)
    ax.annotate("", xy=pts[-1], xytext=pts[-2],
                arrowprops=dict(arrowstyle="-|>", color=color, lw=2), zorder=5)
    ax.add_patch(Circle(pts[0], 0.17, color=color, zorder=5))


LAUNCH = [(5.7, 0.7), (5.7, 6.9), (5.0, 7.9)]

FOCUSED_PATH = LAUNCH + [(4.0, 6.8), (3.2, 7.4), (2.4, 6.8), (3.2, 6.0),
                         (2.4, 5.2), (1.6, 6.0)]
DIFFUSE_PATH = LAUNCH + [(1.0, 1.4), (4.2, 3.6), (1.0, 5.6), (2.6, 1.4),
                         (4.2, 7.2), (1.0, 3.6)]


def focused_board(ax, title):
    board(ax, title)
    bumpers(ax, np.arange(0.8, 5.0, 0.8), np.arange(1.2, 7.6, 0.8), 0.17)


def diffuse_board(ax, title):
    board(ax, title)
    bumpers(ax, [1.0, 2.6, 4.2], [1.4, 3.6, 5.6, 7.2], 0.22)


fig, (a1, a2) = new(ncols=2, size=(8.4, 5.4))
focused_board(a1, "сфокусированный")
thought_path(a1, FOCUSED_PATH, trodden=6)
diffuse_board(a2, "рассеянный")
thought_path(a2, DIFFUSE_PATH)
save(fig, "pinball-two-modes")


# Эффект установки: мысль крутится наверху, решение внизу недосягаемо.
fig, ax = new(size=(4.8, 5.6))
focused_board(ax, "")
ax.add_patch(Rectangle((0.45, 0.85), 1.95, 1.4, color=C.green, alpha=0.18, zorder=1))
ax.text(1.42, 0.35, "решение", ha="center", color=C.green, fontsize=13)
stuck = LAUNCH + [(4.0, 6.8), (3.2, 7.4), (2.4, 6.8), (3.2, 6.0), (4.0, 6.8),
                  (3.2, 7.4), (2.4, 6.8), (1.6, 6.0), (2.4, 5.2), (3.2, 6.0)]
thought_path(ax, stuck, color=C.red, trodden=6)
ax.text(3.0, 4.35, "старый путь", ha="center", color=C.red, fontsize=13, zorder=6,
        bbox=dict(facecolor="white", edgecolor="none", pad=2))
save(fig, "einstellung-pinball")


# ---------- чередование режимов ----------

fig, ax = new(size=(7.4, 2.4))
blocks = [("фокус", 2.2, C.blue), ("рассеянный", 2.0, C.green), ("фокус", 1.6, C.blue),
          ("рассеянный", 2.0, C.green), ("фокус", 1.4, C.blue)]
x = 0
for label, w, col in blocks:
    ax.add_patch(Rectangle((x, 0), w - 0.08, 1, color=col, alpha=0.85))
    ax.text(x + w / 2, 0.5, label, ha="center", va="center", color="white", fontsize=12)
    x += w
ax.text(x + 0.25, 0.5, "★", ha="left", va="center", color=C.orange, fontsize=24)
ax.text(x + 0.25, -0.35, "решение", ha="left", color=C.orange, fontsize=12)
ax.annotate("", xy=(x, -0.6), xytext=(0, -0.6),
            arrowprops=dict(arrowstyle="-|>", color=C.gray, lw=1.5))
ax.text(0, -0.95, "время", color=C.gray, fontsize=11)
ax.set_xlim(-0.2, x + 1.4)
ax.set_ylim(-1.2, 1.3)
ax.axis("off")
save(fig, "modes-alternation")
