import marimo

__generated_with = "0.25.2"
app = marimo.App(auto_download=["ipynb"])


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
    ![alt](public/task1.png)
    """)
    return


@app.cell
def _(np, rng):
    def normalize(arr, axis=1):
        return arr / np.linalg.norm(arr, axis=axis, keepdims=True)

    def cos(x, y):
        return np.sum(x * y, axis=1)

    def vectorize(d, M=20_000):
        X = rng.standard_normal((M, d))
        Y = rng.standard_normal((M, d))

        X_norm = normalize(X)
        Y_norm = normalize(Y)

        S = cos(X_norm, Y_norm)
        return S

    return cos, normalize, vectorize


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![](public/task1_1.png)
    """)
    return


@app.cell
def _(mo, np, pd, plt, scipy, vectorize):
    D = [16, 64, 256, 512, 4096]
    S = {}
    _fig, _ax = plt.subplots(1, len(D), figsize=(12, 3))
    for axes, d in zip(_ax, D):
        s_d = vectorize(d)
        S[d] = s_d

        _x = np.linspace(-1, 1, 500)
        _density = scipy.stats.norm.pdf(_x, scale=1/np.sqrt(d))

        axes.hist(s_d, bins=50, density=True)
        axes.plot(_x, _density)
        axes.set_title(f'd={d}')

    _fig.tight_layout()
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
    return (d,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task1_2.png)
    """)
    return


@app.cell
def _(cos, mo, normalize, np, plt, rng, scipy):
    def check_cone(weights, xlim=[-0.25, 0.25]):
        W = normalize(weights)
        print(f'W shape = {W.shape}')
        i, j = rng.integers(0, len(W), size=10_000), rng.integers(0, len(W), size=10_000)

        Sw = cos(W[i], W[j])[i != j]
        print(f'Sw shape = {Sw.shape}')

        fig, ax = plt.subplots()

        x = np.linspace(-1, 1, 512)
        density = scipy.stats.norm.pdf(x, scale=1 / np.sqrt(512))

        ax.hist(Sw, bins=50, density=True)
        ax.plot(x, density)

        ax.set_xlim(xlim)
        plt.show()

        return mo.md(rf'Sw mean = {Sw.mean():.4f}, Sw var = {Sw.var():.4f}, $\sigma^2$ = {1 / 512:.5f}, kurtosis: {scipy.stats.kurtosis(Sw):.4f}')


    return (check_cone,)


@app.cell
def _(check_cone):
    from transformers import AutoModelForCausalLM

    name = "EleutherAI/pythia-70m"

    model = AutoModelForCausalLM.from_pretrained(name)

    W_in = model.gpt_neox.embed_in.weight.detach().numpy()[:50277]

    check_cone(W_in)
    return (model,)


@app.cell
def _(check_cone, model):
    W_out = model.embed_out.weight.detach().numpy()[:50277]
    check_cone(W_out, xlim=[-0.25, 1])
    return (W_out,)


@app.cell
def _(W_out, check_cone):
    W_centred = W_out - W_out.mean(axis=0)
    check_cone(W_centred, xlim=[-1,1])
    return (W_centred,)


@app.cell
def _(W_centred, check_cone, np):
    W_svd, _S, Vt = np.linalg.svd(W_centred, full_matrices=False)

    check_cone(W_svd, xlim=[-1, 1])
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 2
    ![alt](public/task2_1_1.png)
    """)
    return


@app.cell
def _(mo, normalize, np, pd, plt, rng, scipy):
    def features(p, N=20_000):
        B = rng.random((N, M)) < p
        R = rng.random((N, M))
        return R * B 


    def reconstruct(W, F, b):
        return np.maximum(F @ W.T @ W - b, 0)


    def mse(W, F, b):
        return ((F - reconstruct(W, F, b)) ** 2).sum(axis=1).mean()


    d = 10
    M = 40
    cnt = 16
    P = np.linspace(0.01, 0.5, cnt)

    W_rand = normalize(rng.standard_normal((d, M)), axis=0)

    F = {p: features(p) for p in P}

    B_opt = []
    for p in P:
        res = scipy.optimize.minimize_scalar(lambda b: mse(W_rand, F[p], b), bounds=(0, 1), method='bounded')
        B_opt.append(res.x)

    B_opt = np.array(B_opt)

    _fig, _ax = plt.subplots()
    _ax.plot(P, B_opt, marker='o')
    _ax.set_xlabel('p')
    _ax.set_ylabel('$b^*$')
    plt.show()

    _rows = []
    for p, b in zip(P, B_opt):
        _rows.append({
            "p": f'{p:.4f}',
            r"$b^*$": f'{b:.4f}',
            r"$MSE(b=0)$": f'{mse(W_rand, F[p], 0):.4f}',
            r"$MSE(b^*)$": f'{mse(W_rand, F[p], b):.4f}'
        })
    
    _df = pd.DataFrame(_rows).set_index('p')
    mo.md(_df.to_markdown())


    return B_opt, F, M, P, W_rand, d, features, mse


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task2_3.png)
    """)
    return


@app.cell
def _(B_opt, F, M, P, W_rand, mo, mse, np, plt):
    def nmse(W, F, b):
        return mse(W, F, b) / (F ** 2).sum(axis=1).mean()

    MSE = np.array([mse(W_rand, F[p], b) for p, b in zip(P, B_opt)])
    NMSE = np.array([nmse(W_rand, F[p], b) for p, b in zip(P, B_opt)])

    _fig, _axes = plt.subplots(1, 2, figsize=(12, 4))

    _axes[0].plot(P, MSE, marker='o', label='mse')
    _axes[0].plot(P, M * P / 3, marker='d', linestyle='dashed', label=r"$\mathbb{E}\|f\|^2 = Mp/3$")
    _axes[0].set_xlabel('$p$')
    _axes[0].set_ylabel('MSE')
    _axes[0].legend()

    _axes[1].plot(P, NMSE, marker="o", label="nmse")
    _axes[1].axhline(1, color="gray", linestyle="--", label=r"$\hat f = 0$")
    _axes[1].axhline(0.95, color="red", linestyle=":", label="0.95")
    _axes[1].set_xlabel("$p$")
    _axes[1].set_ylabel("NMSE")
    _axes[1].legend()

    plt.show()

    mo.md(
        f'Точка коллапса $p^*$ = {P[NMSE >= 0.95]}\n\n'
        f'max в NMSE = {NMSE.max()}'
    )
    return NMSE, nmse


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task2_4_1.png)
    ![alt](public/task2_4_2_1.png)
    """)
    return


@app.cell
def _(
    M,
    NMSE,
    P,
    W_rand,
    d,
    features,
    mo,
    mse,
    nmse,
    normalize,
    pd,
    plt,
    rng,
    scipy,
):
    import torch

    def train_model(p, steps=3000, batch_size=1024, lr=1e-2):
        Wrand = normalize(rng.standard_normal((d, M)), axis=0)
        W = torch.tensor(Wrand, dtype=torch.float32, requires_grad=True)
        b = torch.zeros(M, requires_grad=True)
        optimizer = torch.optim.Adam([W, b], lr=lr)

        for step in range(steps):
            f = torch.tensor(features(p, batch_size), dtype=torch.float32)
            f_hat = torch.relu(f @ W.T @ W - b)
            loss = ((f - f_hat) ** 2).sum(dim=1).mean()

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            with torch.no_grad():
                W /= W.norm(dim=0).clamp(min=1)

        return W.detach().numpy(), b.detach().numpy()

    P_train = (0.01, 0.05, 0.1, 0.2)
    trained = {p: train_model(p) for p in P_train}


    _rows = []
    for _p, (W, _b) in trained.items():
        F_test = features(_p)
        b_rand = scipy.optimize.minimize_scalar(
            lambda b: mse(W_rand, F_test, b), 
            bounds=(0, 1), 
            method='bounded'
        ).x
        _rows.append({
            'p': _p,
            'NMSE случайная': nmse(W_rand, F_test, b_rand),
            'NMSE обученная': nmse(W, F_test, _b)
        })

    NMSE_trained = pd.DataFrame(_rows).set_index('p')


    _fig, _ax = plt.subplots()

    _ax.plot(P, NMSE, marker='o', label='случайная W')
    _ax.plot(P_train, NMSE_trained['NMSE обученная'], marker='s', label='обученная W, b')
    _ax.axhline(1, color='gray', linestyle='dashed', label=r'$\hat f = 0$')
    _ax.set_xlabel('$p$')
    _ax.set_ylabel('NMSE')
    _ax.legend()

    plt.show()

    mo.ui.table(
        NMSE_trained,
        format_mapping={
            'p': '{:.4f}',
            'NMSE случайная': '{:.4f}',
            'NMSE обученная': '{:.4f}'
        }
    )
    return (trained,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task2_4_3.png)
    """)
    return


@app.cell
def _(W_rand, plt, trained):
    _fig, _axes = plt.subplots(
        2, 3,
        figsize=(15, 9),
        constrained_layout=True
    )

    _axes = _axes.flatten()

    plots = [('Случайная W', W_rand)] + [(f'p = {p:.2f}', W) for p, (W, b) in trained.items()]

    for ax, (title, _W) in zip(_axes, plots):
        G = _W.T @ _W

        im = ax.imshow(G, cmap='RdBu_r', vmin=-1, vmax=1, interpolation='nearest')

        ax.set_title(title, fontsize=13, pad=10)
        ax.set_xticks([0, 10, 20, 30, 39])
        ax.set_yticks([0, 10, 20, 30, 39])
        ax.tick_params(labelsize=9)

    _axes[-1].axis('off')

    _fig.colorbar(im, ax=_axes[:5].tolist(), shrink=0.8, pad=0.02, label=r'$w_i^T w_j$')

    plt.show()
    return


if __name__ == "__main__":
    app.run()
