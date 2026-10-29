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
    return mo, np, pd, plt, rng, scipy


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
        _gamma = _p / _n
        _lam_minus, _lam_plus = mp_bounds(_gamma)
        lam = spectrum(_p, _n)
        lam = drop_zeros(lam)

        x, rho = mp_density(_gamma)
        _ax.hist(lam, bins=50, density=True, label='эксперимент')
        _ax.plot(x, rho * max(_gamma, 1), label='теория МП')
        _ax.axvline(_lam_minus, ls='dashed', c='k')
        _ax.axvline(_lam_plus, ls='dashed', c='k')
        _ax.set_title(f'p = {_p}, n = {_n}, γ = {_gamma}')
        _ax.set_xlabel(r'$\lambda$')
        _ax.legend()

        _rows.append({
            r'$\gamma$': _gamma,
            r'$\lambda_{\text{теория}}$': _lam_minus,
            r'$\lambda_{\text{min эксперимент}}$': lam.min(),
            r'$\lambda_{\text{+ теория}}$': _lam_plus,
            r'$\lambda_{\text{max эксперимент}}$': lam.max(),
        })

    _fig.tight_layout()
    plt.show()
    _df = pd.DataFrame(_rows).set_index(r'$\gamma$').round(4)
    mo.md(_df.to_markdown())
    return (mp_bounds,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 2. Фазовый переход ВВР: Слепота РСА и калибровка искажений.
    ![alt](public/task2_1.png)
    ![alt](public/task2_2.png)
    """)
    return


@app.cell
def _(mp_bounds, np, plt, rng, scipy):
    def top_component(theta):
        X = rng.standard_normal((p, n))
        X[0] *= np.sqrt(1 + theta)
        u, s, _ = scipy.sparse.linalg.svds(X, k=1)
        return s[0] ** 2 / n, u[0, 0] ** 2

    p, n = 1500, 3000
    gamma = p / n
    theta_c = np.sqrt(gamma)
    lam_plus = mp_bounds(gamma)[1]

    thetas = np.linspace(0.1, 2.5, 25)
    M = 5
    res = np.array([[top_component(t) for _ in range(M)] for t in thetas]).mean(axis=1)
    lam1, overlap = res[:, 0], res[:, 1]

    def bbp_lambda(theta):
        return np.where(
            theta > theta_c, 
            (1 + theta) * (1 + gamma / theta),
            lam_plus
        )

    def bbp_overlap(theta):
        return np.where(
            theta > theta_c,
            (1 - gamma / theta**2) / (1 + gamma / theta),
            0
        )

    t = np.linspace(0.1, 2.5, 500)
    _fig, _axes = plt.subplots(1, 2, figsize=(12, 4))
    _axes[0].plot(thetas, lam1, 'o', label='эксперимент')
    _axes[0].plot(t, bbp_lambda(t), label='теория BBP')
    _axes[0].set_title(r'$\hat\lambda_1$')
    _axes[1].plot(thetas, overlap, 'o', label='эксперимент')
    _axes[1].plot(t, bbp_overlap(t), label='теория')
    _axes[1].set_title(r'$|\langle\hat v_1, v_1\rangle|^2$')
    for _ax in _axes:
        _ax.axvline(theta_c, ls='--', c='k', label=r'$\theta_c$')
        _ax.set_xlabel('θ')
        _ax.legend()
    _fig.tight_layout()
    plt.show()
    return gamma, lam1, lam_plus, theta_c, thetas


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task2_3.png)
    """)
    return


@app.cell
def _(gamma, lam1, lam_plus, mo, np, plt, theta_c, thetas):
    def calibrate(lam):
        if lam <= lam_plus:
            return 'Сигнал отсутствует или находится ниже предела детектирования'
        return (lam + 1 - gamma + np.sqrt((lam + 1 - gamma) ** 2 - 4 * lam)) / 2 - 1


    theta_hat = [
        c if isinstance(c, float) else np.nan 
        for c in map(calibrate, lam1)
    ]

    _fig, _ax = plt.subplots()
    _ax.plot(thetas, thetas, label='истинное θ')
    _ax.plot(thetas, lam1 - 1, 'o', label=r'наивная $\hat\lambda_1 - 1$')
    _ax.plot(thetas, theta_hat, 'o', label=r'калиброванная $\hat\theta$')
    _ax.axvline(theta_c, ls='--', c='k', label=r'$\theta_c$')
    _ax.set_xlabel('θ')
    _ax.legend()
    plt.show()

    _rows = [r'| $\theta$ | $\hat\lambda_1$ | $\hat\theta$ |', '|---|---|---|']
    for _t, _lam in zip(thetas[::6], lam1[::6]):
        _c = calibrate(_lam)
        _c = f'{_c:.3f}' if isinstance(_c, float) else _c
        _rows.append(f'| {_t:.1f} | {_lam:.3f} | {_c} |')
    mo.md('\n'.join(_rows))
    return


if __name__ == "__main__":
    app.run()
