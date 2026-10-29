import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell
def _():
    from transformers.utils import logging
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt
    import pandas as pd
    import scipy
    import warnings

    logging.set_verbosity_error()
    logging.disable_progress_bar()
    warnings.filterwarnings("ignore", category=RuntimeWarning)

    rng = np.random.default_rng()
    return mo, np, pd, plt, rng, scipy


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 1. Предел концентрации меры и «Паразитное направление» LLM
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
    for axes, _d in zip(_ax, D):
        s_d = vectorize(_d)
        S[_d] = s_d

        _x = np.linspace(-1, 1, 500)
        _density = scipy.stats.norm.pdf(_x, scale=1/np.sqrt(_d))

        axes.hist(s_d, bins=50, density=True)
        axes.plot(_x, _density)
        axes.set_title(f'd={_d}')

    _fig.tight_layout()
    plt.show()

    rows = []
    for _d, s in S.items():
        rows.append({
            'd': _d,
            r'$\sigma^2_{\text{теор}}$': f'{1 / _d:.4f}',
            r'$\hat{\sigma}^2$': f'{s.var():.4f}',
            r'$\hat{\mu}$': f'{s.mean():.4f}',
            r'kurtosis': f'{scipy.stats.kurtosis(s):.4f}'
        })

    _df = pd.DataFrame(rows).set_index('d')
    mo.md(_df.to_markdown())
    return


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

    W_in = model.get_input_embeddings().weight.detach().float().cpu().numpy()[:50277]

    check_cone(W_in)
    return (model,)


@app.cell
def _(check_cone, model):
    W_out = model.get_output_embeddings().weight.detach().cpu().numpy()[:50277]

    check_cone(W_out, xlim=[-0.25, 1])
    return (W_out,)


@app.cell
def _(W_out, check_cone):
    W_centred = W_out - W_out.mean(axis=0)
    check_cone(W_centred, xlim=[-1,1])
    return (W_centred,)


@app.cell
def _(W_centred, check_cone, np):
    W_svd, _S, Vt = np.linalg.svd(W_centred.astype(np.float32), full_matrices=False)

    check_cone(W_svd, xlim=[-1, 1])
    return


if __name__ == "__main__":
    app.run()
