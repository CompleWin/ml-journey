import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


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
        _lam = drop_zeros(spectrum(_p, _n))

        _x, _rho = mp_density(_gamma)
        _ax.hist(_lam, bins=50, density=True, label='эксперимент')
        _ax.plot(_x, _rho * max(_gamma, 1), label='теория МП')
        _ax.axvline(_lam_minus, ls='dashed', c='k')
        _ax.axvline(_lam_plus, ls='dashed', c='k')
        _ax.set_title(rf'$p = {_p},\ n = {_n},\ \gamma = {_gamma}$')
        _ax.set_xlabel(r'$\lambda$')
        _ax.legend()

        _rows.append({
            r'$\gamma$': _gamma,
            r'$\lambda_{\text{теория}}$': _lam_minus,
            r'$\lambda_{\text{min эксперимент}}$': _lam.min(),
            r'$\lambda_{\text{+ теория}}$': _lam_plus,
            r'$\lambda_{\text{max эксперимент}}$': _lam.max(),
        })

    _fig.tight_layout()
    plt.show()
    _df = pd.DataFrame(_rows).set_index(r'$\gamma$').round(4)
    mo.md(_df.to_markdown())
    return drop_zeros, mp_bounds


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
        _ax.set_xlabel(r'$\theta$')
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
    _ax.plot(thetas, thetas, label=r'истинное $\theta$')
    _ax.plot(thetas, lam1 - 1, 'o', label=r'наивная $\hat\lambda_1 - 1$')
    _ax.plot(thetas, theta_hat, 'o', label=r'калиброванная $\hat\theta$')
    _ax.axvline(theta_c, ls='--', c='k', label=r'$\theta_c$')
    _ax.set_xlabel(r'$\theta$')
    _ax.legend()
    plt.show()

    _rows = [r'| $\theta$ | $\hat\lambda_1$ | $\hat\theta$ |', '|---|---|---|']
    for _t, _lam in zip(thetas[::6], lam1[::6]):
        _c = calibrate(_lam)
        _c = f'{_c:.3f}' if isinstance(_c, float) else _c
        _rows.append(f'| {_t:.1f} | {_lam:.3f} | {_c} |')
    mo.md('\n'.join(_rows))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 3. Спектральная диагностика слоев ResNet-18 (Теория Мартина-Махони)
    ![alt](public/task3_1.png)
    """)
    return


@app.cell
def _(np):
    import torchvision.models as models

    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

    def get_weight(name):
        return model.get_submodule(name).weight.detach().numpy()

    def esd(W):
        W = W.reshape(len(W), -1)
        s = np.linalg.svd(W, compute_uv=False)
        return s ** 2 / max(W.shape)

    return esd, get_weight


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3_2.png)
    """)
    return


@app.cell
def _(esd, get_weight, mo, np, plt):
    _W = get_weight('layer4.1.conv2')
    lam = esd(_W)
    _m, _k = _W.reshape(len(_W), -1).shape

    def ols_fit(lam, bins):
        rho, edges = np.histogram(lam, bins=bins, density=True)
        centers = (edges[:-1] + edges[1:]) / 2
        x, y = np.log(centers[rho > 0]), np.log(rho[rho > 0])
        slope, intercept = np.polyfit(x, y, 1)
        return x, y, slope, intercept

    _rows = [
        rf'Веса `{_W.shape}` $\to$ матрица ${_m} \times {_k}$, собственных чисел: {len(lam)}',
        '',
        r'| bins | $\alpha$ |',
        '|---|---|',
    ]
    for _bins in [10, 20, 50, 100, 200]:
        _rows.append(f'| {_bins} | {-ols_fit(lam, _bins)[2]:.2f} |')

    _fig, _axes = plt.subplots(1, 2, figsize=(12, 4))
    for _ax, _bins in zip(_axes, [20, 200]):
        _x, _y, _slope, _intercept = ols_fit(lam, _bins)
        _ax.plot(_x, _y, 'o')
        _ax.plot(_x, _slope * _x + _intercept)
        _ax.set_title(rf'bins = {_bins}: $\alpha = {-_slope:.2f}$')
        _ax.set_xlabel(r'$\ln \lambda$')
        _ax.set_ylabel(r'$\ln \rho(\lambda)$')
    _fig.tight_layout()
    plt.show()
    mo.md('\n'.join(_rows))
    return (lam,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3_3.png)
    """)
    return


@app.cell
def _(lam, mo, np, plt):
    def fit_alpha(lam):
        lam = np.sort(lam)
        best = (np.inf, np.nan, np.nan)
        for lam_min in lam[:-2]:
            tail = lam[lam >= lam_min]
            alpha = 1 + len(tail) / np.sum(np.log(tail / lam_min))
            cdf = 1 - (tail / lam_min)**(1 - alpha)
            D = np.max(np.abs(np.arange(len(tail)) / len(tail) - cdf))
            best = min(best, (D, alpha, lam_min))
        return best

    _D, _alpha, _lam_min = fit_alpha(lam)

    _lam_sorted = np.sort(lam)
    _tail = _lam_sorted[_lam_sorted >= _lam_min]
    _fig, _ax = plt.subplots()
    _ax.loglog(_lam_sorted, 1 - np.arange(len(lam)) / len(lam), '.', label='эмпирическая CCDF')
    _ax.loglog(_tail, len(_tail) / len(lam) * (_tail / _lam_min)**(1 - _alpha), label=rf'MLE, $\alpha = {_alpha:.2f}$')
    _ax.axvline(_lam_min, ls='--', c='k', label=r'$\lambda_{min}$')
    _ax.set_xlabel(r'$\lambda$')
    _ax.set_ylabel(r'$P(X \geq \lambda)$')
    _ax.legend()
    plt.show()
    mo.md(
        rf'$\alpha = {_alpha:.2f}$, $\lambda_{{\min}} = {_lam_min:.2e}$, $D_{{KS}} = {_D:.3f}$, '
        f'точек в хвосте: {(lam >= _lam_min).sum()} из {len(lam)}'
    )
    return (fit_alpha,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3_4.png)
    """)
    return


@app.cell
def _(drop_zeros, esd, fit_alpha, get_weight, mo, mp_bounds, np, pd, plt, rng):
    _W1 = get_weight('layer1.0.conv1')
    _W3 = get_weight('layer3.0.conv1')
    _U, _S, _Vt = np.linalg.svd(_W3.reshape(len(_W3), -1), full_matrices=False)
    _S[2:] = 0

    _layers = {
        'layer1.0.conv1 (случайный)': rng.normal(0, _W1.std(), _W1.shape),
        'layer2.0.conv1 (штатный)': get_weight('layer2.0.conv1'),
        'layer3.0.conv1 (коллапс)': _U @ np.diag(_S) @ _Vt,
        'fc (выходной)': get_weight('fc'),
    }

    _rows = []
    _fig, _axes = plt.subplots(2, 2, figsize=(11, 7))
    for _ax, (_name, _W) in zip(_axes.flat, _layers.items()):
        _lam = esd(_W)
        _shape = _W.reshape(len(_W), -1).shape
        _noise_edge = mp_bounds(min(_shape) / max(_shape), _W.var())[1]
        _D, _alpha, _lam_min = fit_alpha(drop_zeros(_lam))

        _ax.hist(_lam, bins=30, density=True, log=True)
        _ax.axvline(_noise_edge, ls='--', c='r', label=r'$\lambda_+$ шума')
        _ax.set_title(_name)
        _ax.set_xlabel(r'$\lambda$')
        _ax.legend()

        _rows.append({
            'слой': _name,
            'srank': _lam.sum() / _lam.max(),
            r'$\alpha$': _alpha,
            'точек в хвосте': (_lam >= _lam_min).sum(),
            r'$\lambda > \lambda_+$': f'{(_lam > _noise_edge).sum()} из {len(_lam)}',
            r'$\lambda_{\max} / \lambda_+$': _lam.max() / _noise_edge,
        })

    _fig.tight_layout()
    plt.show()
    _df = pd.DataFrame(_rows).set_index('слой').round(2)
    mo.md(_df.to_markdown())
    return


if __name__ == "__main__":
    app.run()
