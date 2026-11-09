"""Картинки к конспекту 14-eigenvectors-eigenvalues.md.

Запуск из любой папки:  python make_14.py
Картинки появятся в img/14/ рядом со скриптом.
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).parent / "14"
OUT.mkdir(exist_ok=True)

C_EIG1 = "#1f77b4"   # первая собственная прямая
C_EIG2 = "#ff7f0e"   # вторая собственная прямая
C_OTHER = "#9467bd"  # обычный вектор
C_GRID = "#c8c8c8"
C_GRID_T = "#7fb3d5"
C_KILL = "#d62728"

plt.rcParams.update({"font.size": 11, "axes.titlesize": 12})


def setup(ax, xlim, ylim, title=None):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal")
    ax.axhline(0, color="black", lw=0.8)
    ax.axvline(0, color="black", lw=0.8)
    ax.set_xticks(range(int(np.ceil(xlim[0])), int(xlim[1]) + 1))
    ax.set_yticks(range(int(np.ceil(ylim[0])), int(ylim[1]) + 1))
    ax.tick_params(labelsize=8)
    for s in ax.spines.values():
        s.set_visible(False)
    if title:
        ax.set_title(title)


def grid(ax, M=np.eye(2), n=8, color=C_GRID, lw=0.6, alpha=1.0):
    """Сетка целых координат после преобразования M."""
    M = np.asarray(M, float)
    for k in range(-n, n + 1):
        for a, b in (((k, -n), (k, n)), ((-n, k), (n, k))):
            p, q = M @ a, M @ b
            ax.plot([p[0], q[0]], [p[1], q[1]], color=color, lw=lw, alpha=alpha, zorder=0)


def arrow(ax, v, color, start=(0, 0), lw=2.2, alpha=1.0, label=None, offset=(0.15, 0.15), **kw):
    ax.annotate("", xy=(start[0] + v[0], start[1] + v[1]), xytext=start,
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, alpha=alpha,
                                shrinkA=0, shrinkB=0, mutation_scale=14), zorder=5)
    if label:
        ax.text(start[0] + v[0] + offset[0], start[1] + v[1] + offset[1], label,
                color=color, fontsize=kw.get("fs", 11), zorder=6,
                bbox=dict(facecolor="white", edgecolor="none", alpha=0.75, pad=1))


def span(ax, v, color, ls="-", lw=1.6, alpha=0.9, L=30):
    v = np.asarray(v, float)
    v = v / np.linalg.norm(v)
    ax.plot([-L * v[0], L * v[0]], [-L * v[1], L * v[1]], color=color, ls=ls, lw=lw,
            alpha=alpha, zorder=1)


def save(fig, name):
    fig.tight_layout()
    fig.savefig(OUT / name, dpi=150, facecolor="white")
    plt.close(fig)


# 1. Пример A = [[3, 1], [0, 2]]: кто остаётся на своей прямой
A = np.array([
    [3, 1],
    [0, 2],
])
i_hat, d, v = np.array([1, 0]), np.array([1, -1]), np.array([1, 1])
fig, axes = plt.subplots(1, 2, figsize=(11, 4.6))
for ax, M, color, title in ((axes[0], np.eye(2), C_GRID, "До преобразования"),
                            (axes[1], A, C_GRID_T, "После A = [[3, 1], [0, 2]]")):
    setup(ax, (-3, 5), (-3, 3), title)
    grid(ax, M, color=color, alpha=0.6)
    span(ax, (1, 0), C_EIG1, alpha=0.35, lw=5)
    span(ax, (1, -1), C_EIG2, alpha=0.35, lw=5)
    span(ax, (1, 1), C_OTHER, ls="--", lw=1.2)
arrow(axes[0], i_hat, C_EIG1, label=r"$\hat{\imath}$")
arrow(axes[0], d, C_EIG2, label="(1, −1)", offset=(0.15, -0.45))
arrow(axes[0], v, C_OTHER, label="v = (1, 1)")
arrow(axes[1], A @ i_hat, C_EIG1, label=r"$3\hat{\imath}$ (×3)")
arrow(axes[1], A @ d, C_EIG2, label="(2, −2) (×2)", offset=(0.15, -0.45))
arrow(axes[1], A @ v, C_OTHER, label="Av = (4, 2)", offset=(-1.2, 0.25))
axes[1].text(1.6, 2.55, "пунктир — прямая вектора v:\nAv с неё сошёл",
             color=C_OTHER, fontsize=9, ha="left",
             bbox=dict(facecolor="white", edgecolor="none", alpha=0.85))
save(fig, "01-example.png")


# 2. Отрицательное собственное значение
fig, ax = plt.subplots(figsize=(5.5, 3.6))
setup(ax, (-3, 4), (-2, 2.5))
span(ax, (2, 1), C_EIG1, alpha=0.35, lw=5)
vv = np.array([2, 1])
arrow(ax, vv, C_EIG1, label="v", offset=(-0.45, 0.25))
arrow(ax, -0.5 * vv, C_KILL, label=r"$-\frac{1}{2}v$", offset=(-0.35, 0.3))
ax.set_title(r"$\lambda=-\frac{1}{2}$: развернули и сжали, но прямая та же")
save(fig, "02-negative.png")


# 3. Поворот в 3D: ось вращения
fig = plt.figure(figsize=(6, 5.4))
ax = fig.add_subplot(projection="3d")
t = np.linspace(0, 2 * np.pi, 200)
h = 0.6
ax.plot(np.cos(t), np.sin(t), np.full_like(t, h), color=C_GRID_T, lw=1.2)
ax.plot([0, 0], [0, 0], [-1.6, 1.8], color=C_EIG1, lw=3)
ax.quiver(0, 0, 0, 0, 0, 1.5, color=C_EIG1, lw=2.5, arrow_length_ratio=0.12)
ax.text(0.1, 0.1, 1.65, "ось вращения\nAw = 1·w", color=C_EIG1)
u = np.array([1, 0, h])
Ru = np.array([0, 1, h])
ax.quiver(0, 0, 0, *u, color=C_OTHER, lw=2, arrow_length_ratio=0.12)
ax.quiver(0, 0, 0, *Ru, color=C_KILL, lw=2, arrow_length_ratio=0.12)
ax.text(*(u * 1.12), "u", color=C_OTHER)
ax.text(*(Ru * 1.12), "Au", color=C_KILL)
ta = np.linspace(0.15, np.pi / 2 - 0.15, 50)
ax.plot(np.cos(ta), np.sin(ta), np.full_like(ta, h), color=C_KILL, lw=2.2)
ax.set_xlim(-1.3, 1.3); ax.set_ylim(-1.3, 1.3); ax.set_zlim(-1, 1.8)
ax.set_box_aspect((1, 1, 1.1))
ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([])
ax.view_init(elev=22, azim=-55)
ax.set_title("Поворот на 90° вокруг оси: u сходит со своей прямой,\nось остаётся на месте")
save(fig, "03-rotation-axis.png")


# 4. «Ручка» λ: det(A − λI) для A = [[2, 2], [1, 3]]
fig, axes = plt.subplots(1, 2, figsize=(11, 4.4), gridspec_kw={"width_ratios": [1.15, 1]})
ax = axes[0]
lam = np.linspace(-0.5, 5.5, 300)
ax.plot(lam, lam ** 2 - 5 * lam + 4, color=C_EIG1, lw=2.2)
ax.axhline(0, color="black", lw=0.8)
for r in (1, 4):
    ax.plot(r, 0, "o", color=C_KILL, ms=8, zorder=5)
    ax.annotate(f"λ = {r}", (r, 0), (r - 0.2, 2.2), color=C_KILL,
                arrowprops=dict(arrowstyle="->", color=C_KILL))
ax.set_xlabel("λ (крутим ручку)")
ax.set_ylabel(r"$\det(A-\lambda I)$")
ax.set_title(r"$\det(A-\lambda I)=\lambda^2-5\lambda+4$")
ax.grid(alpha=0.3)
ax = axes[1]
setup(ax, (-3, 3), (-3, 3), r"$A-I$ = [[1, 2], [1, 2]] сплющивает плоскость")
grid(ax, alpha=0.6)
span(ax, (1, 1), C_EIG1, lw=4, alpha=0.6)
span(ax, (2, -1), C_KILL, ls="--", lw=1.5)
arrow(ax, (2, -1), C_KILL, label="v = (2, −1)", offset=(-0.6, -0.55))
ax.text(-2.8, 2.3, "вся плоскость → синяя прямая", color=C_EIG1, fontsize=9,
        bbox=dict(facecolor="white", edgecolor="none", alpha=0.85))
ax.text(-2.8, -2.7, "пунктир → 0, значит Av = 1·v", color=C_KILL, fontsize=9,
        bbox=dict(facecolor="white", edgecolor="none", alpha=0.85))
save(fig, "04-det-knob.png")


# 5. Особые случаи: поворот, сдвиг, растяжение
cases = [
    ("Поворот на 90°: собственных нет", np.array([
        [0, -1],
        [1, 0],
    ])),
    ("Сдвиг: только ось x", np.array([
        [1, 1],
        [0, 1],
    ])),
    ("Растяжение ×2: все векторы", np.array([
        [2, 0],
        [0, 2],
    ])),
]
vecs = [(np.array([1.0, 0.0]), C_OTHER), (np.array([0.5, 1.0]), "#2ca02c")]
fig, axes = plt.subplots(1, 3, figsize=(13, 4.6))
for ax, (title, M) in zip(axes, cases):
    setup(ax, (-2.5, 2.5), (-1.5, 2.5), title)
    grid(ax, M, color=C_GRID_T, alpha=0.5)
    for u, c in vecs:
        Mu = M @ u
        if abs(u[0] * Mu[1] - u[1] * Mu[0]) < 1e-9:   # остался на своей прямой
            c = C_EIG1
            span(ax, u, c, lw=5, alpha=0.3)
        else:
            span(ax, u, c, ls="--", lw=1.2, alpha=0.8)
        arrow(ax, u, c, lw=1.5, alpha=0.35)
        arrow(ax, Mu, c, lw=2.2)
notes = ("бледные — до, яркие — после;\nпунктир — прямая исходного вектора",
         "синий остался на своей прямой,\nзелёный с неё сошёл",
         "любой вектор просто ×2:\nвсе прямые сохраняются")
for ax, note in zip(axes, notes):
    ax.text(-2.4, -1.35, note, fontsize=8.5,
            bbox=dict(facecolor="white", edgecolor="none", alpha=0.85))
save(fig, "05-special-cases.png")


# 6. Собственный базис для A = [[3, 1], [0, 2]]
S = np.array([
    [1, -1],
    [0, 1],
])
fig, axes = plt.subplots(1, 2, figsize=(11, 4.6))
for ax, M, title in ((axes[0], S, "Сетка собственного базиса: b₁ = (1, 0), b₂ = (−1, 1)"),
                     (axes[1], A @ S, "После A: b₁ → 3b₁, b₂ → 2b₂")):
    setup(ax, (-4, 4), (-3, 3), title)
    grid(ax, S, color=C_GRID, alpha=0.6)
    if ax is axes[1]:
        grid(ax, A @ S, color=C_GRID_T, alpha=0.7)
    span(ax, (1, 0), C_EIG1, alpha=0.3, lw=5)
    span(ax, (-1, 1), C_EIG2, alpha=0.3, lw=5)
arrow(axes[0], (1, 0), C_EIG1, label="b₁", offset=(0.1, -0.5))
arrow(axes[0], (-1, 1), C_EIG2, label="b₂", offset=(-0.4, 0.15))
arrow(axes[1], (3, 0), C_EIG1, label="3b₁", offset=(0.1, -0.5))
arrow(axes[1], (-2, 2), C_EIG2, label="2b₂", offset=(-0.4, 0.15))
axes[1].text(0.4, 2.3, "в координатах (b₁, b₂):\nD = [[3, 0], [0, 2]]", fontsize=9,
             bbox=dict(facecolor="white", edgecolor="none", alpha=0.85))
save(fig, "06-eigenbasis.png")


# 7. Фибоначчи: векторы (Fₙ, Fₙ₊₁) прижимаются к собственной прямой с λ₁ = φ
phi = (1 + np.sqrt(5)) / 2
fib = [(1, 1), (1, 2), (2, 3), (3, 5), (5, 8), (8, 13)]
fig, ax = plt.subplots(figsize=(6.2, 7.4))
setup(ax, (-3, 10), (-2, 14))
ax.set_xticks(range(-2, 11, 2)); ax.set_yticks(range(-2, 15, 2))
span(ax, (1 / phi, 1), C_EIG1, lw=4, alpha=0.35)
span(ax, ((-1 - np.sqrt(5)) / 2, 1), C_EIG2, lw=4, alpha=0.35)
for k, (a, b) in enumerate(fib):
    alpha = 0.35 + 0.65 * k / (len(fib) - 1)
    arrow(ax, (a, b), C_OTHER, lw=1.8, alpha=alpha,
          label=f"({a}, {b})" if k >= 2 else None, offset=(0.25, -0.3), fs=9)
ax.text(2.2, 11.5, "λ₁ = φ ≈ 1.618\nрастёт", color=C_EIG1, fontsize=10)
ax.text(-2.9, 2.6, "λ₂ ≈ −0.618\nзатухает", color=C_EIG2, fontsize=10)
ax.set_title("Каждое применение A: (a, b) → (b, a + b).\n"
             "Векторы прижимаются к прямой с большим λ,\nпоэтому Fₙ₊₁ / Fₙ → φ", fontsize=10.5)
save(fig, "07-fibonacci.png")

print("saved:", len(list(OUT.glob("*.png"))), "png")
