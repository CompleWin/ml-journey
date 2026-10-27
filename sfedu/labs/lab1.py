import marimo

__generated_with = "0.25.2"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt
    import pandas as pd
    import scipy

    rng = np.random.default_rng(seed=69)
    return mo, np, pd, plt, rng, scipy


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Задание 1.

    ### Задание 1. Синтетический тест
    ![alt](public/image_1.png)
    """)
    return


@app.cell
def _(np, rng):
    def normalize(arr):
        return arr / np.linalg.norm(arr, axis=1, keepdims=True)

    def cos(x, y):
        return np.sum(x * y, axis=1)

    def vectorize(d, M=20_000):
        X = rng.standard_normal((M, d))
        Y = rng.standard_normal((M, d))

        X_norm = normalize(X)
        Y_norm = normalize(Y)

        S = cos(X_norm, Y_norm)
        return S

    return (vectorize,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![](public/image_3.png)
    """)
    return


@app.cell
def _(mo, np, pd, plt, scipy, vectorize):
    D = [16, 64, 256, 512, 4096]
    S = {}
    fig, ax = plt.subplots(1, len(D), figsize=(12, 3))
    for axes, d in zip(ax, D):
        s_d = vectorize(d)
        S[d] = s_d

        x = np.linspace(-1, 1, 500)
        density = scipy.stats.norm.pdf(x, scale=1/np.sqrt(d))

        axes.hist(s_d, bins=50, density=True)
        axes.plot(x, density)
        axes.set_title(f'd={d}')

    fig.tight_layout()
    plt.show()

    rows = []
    for d, s in S.items():
        rows.append({
            'd': d,
            r'$\sigma^2_{\text{теор}}$': f'{1 / d:.4f}',
            r'$\hat{\sigma}^2$': f'{s.var():.4f}',
            r'$\hat{\mu}$': f'{s.mean():.4f}',
            r'kurtosis': f'{scipy.stats.kurtosis(s):.4f}'
        })

    df = pd.DataFrame(rows).set_index('d')
    mo.md(df.to_markdown())
    return


if __name__ == "__main__":
    app.run()
