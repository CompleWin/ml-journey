import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt
    import pandas as pd
    import scipy

    rng = np.random.default_rng()
    return mo, np, pd, plt, rng


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 1. Синтетический тест: Шумовой балк Марченко–Пастура
    ![alt](public/task1.png)
    ![alt](public/task1_2.png)
    """)
    return


@app.cell
def _(mo, np, pd, plt, rng):
    def spectrum(p, n, sigma2=1.0):
        X = rng.normal(0, np.sqrt(sigma2), (p, n))
        return np.linalg.eigvalsh(X @ X.T / n)

    def mp_bounds(gamma, sigma2=1.0):
        return sigma2 * (1 - np.sqrt(gamma)) ** 2, sigma2 * (1 + np.sqrt(gamma)) ** 2

    def mp_density(gamma, sigma2=1.0):
        lam_minus, lam_plus = mp_bounds(gamma, sigma2)
        lam = np.linspace(lam_minus, lam_plus, 500)
        return lam, np.sqrt((lam_plus - lam) * (lam - lam_minus)) / (2 * np.pi * sigma2 * gamma * lam)

    def drop_zeros(lam):
        return lam[lam > lam.max() * len(lam) * np.finfo(float).eps]

    _n = 1000
    _rows = []
    _fig, _axes = plt.subplots(1, 2, figsize=(12, 4))
    for _ax, _p in zip(_axes, [500, 2000]):
        gamma = _p / _n
        lam_minus, lam_plus = mp_bounds(gamma)
        lam = spectrum(_p, _n)
        lam = drop_zeros(lam)

        x, rho = mp_density(gamma)
        _ax.hist(lam, bins=50, density=True, label='эксперимент')
        _ax.plot(x, rho * max(gamma, 1), label='теория МП')
        _ax.axvline(lam_minus, ls='dashed', c='k')
        _ax.axvline(lam_plus, ls='dashed', c='k')
        _ax.set_title(f'p = {_p}, n = {_n}, γ = {gamma}')
        _ax.set_xlabel(r'$\lambda$')
        _ax.legend()

        _rows.append({
            r'$\gamma$': gamma,
            r'$\lambda_{\text{теория}}$': lam_minus,
            r'$\lambda_{\text{min эксперимент}}$': lam.min(),
            r'$\lambda_{\text{+ теория}}$': lam_plus,
            r'$\lambda_{\text{max эксперимент}}$': lam.max(),
        })

    _fig.tight_layout()
    plt.show()
    _df = pd.DataFrame(_rows).set_index(r'$\gamma$').round(4)
    mo.md(_df.to_markdown())
    return


if __name__ == "__main__":
    app.run()
