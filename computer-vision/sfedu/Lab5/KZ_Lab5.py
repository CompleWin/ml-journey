import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    **Часть 1**

    Загрузка изображения и перевод в оттенки серого
    """)
    return


@app.cell
def _():
    import marimo as mo
    import matplotlib.pyplot as plt
    import numpy as np
    import cv2

    return cv2, mo, np, plt


@app.cell
def _(np, plt):
    def show(img, title=""):
        fig, ax = plt.subplots(figsize=(5, 7))
        ax.imshow(img, cmap="gray", vmin=0, vmax=255)
        ax.set_title(title)
        plt.show()


    def show_row(images, titles):
        fig, axes = plt.subplots(1, len(images), figsize=(5 * len(images), 5))
        for ax, img, title in zip(axes, images, titles):
            if img.dtype == np.uint8:
                ax.imshow(img, cmap="gray", vmin=0, vmax=255)
            else:
                ax.imshow(img, cmap="gray")
            ax.set_title(title)
            ax.axis("off")
        plt.show()

    return show, show_row


@app.cell
def _(cv2, show):
    image = cv2.imread("image.jpg", cv2.IMREAD_COLOR_RGB)
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    show(gray)
    return (gray,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    1. Построить фильтр Гаусса для сглаживания изображений
    """)
    return


@app.cell
def _(np):
    def gaussian_kernel(sigma):
        r = int(np.ceil(3 * sigma))
        x = np.arange(-r, r + 1)
        X, Y = np.meshgrid(x, x)
        G = np.exp(-(X**2 + Y**2) / (2 * sigma**2))
        return G / G.sum()

    return (gaussian_kernel,)


@app.cell
def _(cv2, gaussian_kernel, np):
    G1 = gaussian_kernel(1)
    g_cv = cv2.getGaussianKernel(7, 1)

    print(np.round(G1, 4))
    print(G1.shape, G1.sum(), np.allclose(G1, g_cv @ g_cv.T))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    2. Применить построенное ядро к изображению с помощью функции cv2.filter2D
    """)
    return


@app.cell
def _(cv2, gaussian_kernel, gray, show_row):
    blurred = {s: cv2.filter2D(gray, -1, gaussian_kernel(s)) for s in [1, 3, 7]}

    show_row(
        [gray] + list(blurred.values()),
        ["original"] + [f"sigma = {s}" for s in blurred],
    )
    return (blurred,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    3. Построить сверточное ядро для повышения резкости изображения и применить его к изображению
    """)
    return


@app.cell
def _(cv2, gray, np, show_row):
    sharpen = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ])
    sharpened = cv2.filter2D(gray, -1, sharpen)

    show_row([gray, sharpened], ["original", "sharpened"])
    show_row(
        [gray[250:550, 250:550], sharpened[250:550, 250:550]],
        ["original (crop)", "sharpened (crop)"],
    )
    return (sharpened,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    4. Построить частотный спектр Фурье и привести его к централизованному виду (np.fft.fftshift), визуализировать логарифмический амплитудный спектр
    """)
    return


@app.cell
def _(np):
    def log_spectrum(F):
        return 20 * np.log10(1 + np.abs(F))


    def freq_grid(shape):
        u = np.fft.fftshift(np.fft.fftfreq(shape[0]))
        v = np.fft.fftshift(np.fft.fftfreq(shape[1]))
        return np.meshgrid(u, v, indexing="ij")


    def apply_filter(F_shift, H):
        G_shift = F_shift * H
        g = np.fft.ifft2(np.fft.ifftshift(G_shift)).real
        return G_shift, np.clip(np.round(g), 0, 255).astype(np.uint8)

    return apply_filter, freq_grid, log_spectrum


@app.cell
def _(gray, log_spectrum, np, show_row):
    F = np.fft.fft2(gray)
    F_shift = np.fft.fftshift(F)

    show_row(
        [log_spectrum(F), log_spectrum(F_shift)],
        ["spectrum", "spectrum after fftshift"],
    )
    return (F_shift,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    5. Построить и применить низкочастотный фильтр Гаусса (Low-Pass Filter) к частотному спектру изображения
    """)
    return


@app.cell
def _(F_shift, apply_filter, freq_grid, gray, log_spectrum, np, show_row):
    U, V = freq_grid(gray.shape)

    for _sigma in [1, 3, 7]:
        _D0 = 1 / (2 * np.pi * _sigma)
        _H = np.exp(-(U**2 + V**2) / (2 * _D0**2))
        _G_shift, _g = apply_filter(F_shift, _H)
        show_row(
            [log_spectrum(_G_shift), _H, _g],
            [f"spectrum after LPF, D0 = {_D0:.3f}", "LPF mask", "result"],
        )
    return U, V


@app.cell
def _(F_shift, apply_filter, blurred, np, U, V):
    _D0 = 1 / (2 * np.pi * 3)
    _, _g = apply_filter(F_shift, np.exp(-(U**2 + V**2) / (2 * _D0**2)))
    _diff = np.abs(_g.astype(int) - blurred[3].astype(int))[30:-30, 30:-30]
    print(_diff.mean(), _diff.max())
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    6. Построить и применить фильтр усиления высоких частот (High-Frequency Emphasis Filter) по формуле H(u, v) = 5 – 2 * cos(2 * Pi * u) – 2 * cos(2 * Pi * v)
    """)
    return


@app.cell
def _(F_shift, U, V, apply_filter, log_spectrum, np, show_row):
    H_hfe = 5 - 2 * np.cos(2 * np.pi * U) - 2 * np.cos(2 * np.pi * V)
    G_hfe, sharpened_freq = apply_filter(F_shift, H_hfe)

    print(H_hfe.min(), H_hfe.max())
    show_row(
        [log_spectrum(G_hfe), H_hfe, sharpened_freq],
        ["spectrum after HFE", "HFE mask", "result"],
    )
    return (sharpened_freq,)


@app.cell
def _(np, sharpened, sharpened_freq, show_row):
    _diff = np.abs(sharpened_freq.astype(int) - sharpened.astype(int))[1:-1, 1:-1]
    print(_diff.mean(), _diff.max())

    show_row(
        [sharpened[250:550, 250:550], sharpened_freq[250:550, 250:550]],
        ["sharpen kernel, cv2.filter2D (crop)", "HFE, spectrum (crop)"],
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    **Часть 2**

    Улучшение изображения скелета (Гонсалес, п. 3.8)
    """)
    return


@app.cell
def _(np):
    def to_uint8(img):
        return np.clip(np.round(img), 0, 255).astype(np.uint8)


    def scale(img):
        return to_uint8(255 * (img - img.min()) / (img.max() - img.min()))

    return scale, to_uint8


@app.cell
def _(cv2, np, show):
    skeleton = cv2.imread("Fig0343(a)(skeleton_orig).jpg", cv2.IMREAD_GRAYSCALE)
    f = skeleton.astype(np.float64)

    show(skeleton, "(a) original")
    return f, skeleton


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (b) Лапласиан исходного изображения
    """)
    return


@app.cell
def _(cv2, f, np, scale, show):
    laplacian_kernel = np.array([
        [1, 1, 1],
        [1, -8, 1],
        [1, 1, 1],
    ])
    lap = cv2.filter2D(f, -1, laplacian_kernel)

    show(scale(lap), "(b) Laplacian (scaled)")
    return (lap,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (c) Повышение резкости: сложение (a) и (b)
    """)
    return


@app.cell
def _(f, lap, np, show, to_uint8):
    c = np.clip(f - lap, 0, 255)

    show(to_uint8(c), "(c) a + b")
    return (c,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (d) Градиент Собела исходного изображения
    """)
    return


@app.cell
def _(cv2, f, np, show, to_uint8):
    gx = cv2.Sobel(f, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(f, cv2.CV_64F, 0, 1, ksize=3)
    grad = np.abs(gx) + np.abs(gy)

    show(to_uint8(grad), "(d) Sobel gradient")
    return (grad,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (e) Сглаживание градиента усредняющим фильтром 5×5
    """)
    return


@app.cell
def _(cv2, grad, show, to_uint8):
    grad_smooth = cv2.blur(grad, (5, 5))

    show(to_uint8(grad_smooth), "(e) Sobel smoothed 5x5")
    return (grad_smooth,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (f) Маска: произведение (c) и (e)
    """)
    return


@app.cell
def _(c, grad_smooth, show, to_uint8):
    mask = c * grad_smooth / grad_smooth.max()

    show(to_uint8(mask), "(f) mask = c * e")
    return (mask,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (g) Повышение резкости: сложение (a) и (f)
    """)
    return


@app.cell
def _(f, mask, np, show, to_uint8):
    g = np.clip(f + mask, 0, 255)

    show(to_uint8(g), "(g) a + f")
    return (g,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    (h) Степенное (гамма) преобразование (g): γ = 0.5, c = 1
    """)
    return


@app.cell
def _(g, show, to_uint8):
    h = 255 * (g / 255) ** 0.5

    show(to_uint8(h), "(h) gamma = 0.5")
    return (h,)


@app.cell
def _(h, show_row, skeleton, to_uint8):
    show_row([skeleton, to_uint8(h)], ["before", "after"])
    return


if __name__ == "__main__":
    app.run()
