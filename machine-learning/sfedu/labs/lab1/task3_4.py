import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 3. Взлом и починка Top-K Sparse Autoencoder на активациях Pythia-70m
    """)
    return


@app.cell
def _():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from datasets import load_dataset
    import marimo as mo
    import torch.nn as nn
    import pandas as pd
    import matplotlib.pyplot as plt
    import torch

    return (
        AutoModelForCausalLM,
        AutoTokenizer,
        load_dataset,
        mo,
        nn,
        pd,
        plt,
        torch,
    )


@app.cell
def _(nn, torch):
    class BrokenTopKSAE(nn.Module):
        def __init__(self, d_model=512, d_sae=2048, k=32):
            super().__init__()

            self.k = k
            self.W_enc = nn.Parameter(torch.randn(d_model, d_sae) * 0.02)
            self.b_enc = nn.Parameter(torch.zeros(d_sae))

            self.W_dec = nn.Parameter(torch.randn(d_sae, d_model) * 0.02)
            self.b_dec = nn.Parameter(torch.zeros(d_model))

        def encode(self, x):
            pre_acts = x @ self.W_enc + self.b_enc
            val, idx = torch.topk(pre_acts, self.k, dim=-1)
            acts = torch.zeros_like(pre_acts).scatter_(-1, idx, val)
            return acts

        def decode(self, acts):
            return acts @ self.W_dec + self.b_dec

        def forward(self, x):
            acts = self.encode(x)
            x_hat = self.decode(acts)
            return x_hat, acts


    return (BrokenTopKSAE,)


@app.cell
def _(AutoModelForCausalLM, AutoTokenizer, load_dataset, torch):
    torch.set_num_threads(4)

    name = 'EleutherAI/pythia-70m'
    model = AutoModelForCausalLM.from_pretrained(name).eval()
    tokenizer = AutoTokenizer.from_pretrained(name)

    texts = load_dataset('NeelNanda/pile-10k', split='train')['text'][:10000]
    tokens = tokenizer(texts, truncation=True, max_length=128)['input_ids']
    sequences = [t for t in tokens if len(t) == 128][:512]
    ids = torch.tensor(sequences)

    saved = []
    def hook(module, inputs, outputs):
        if isinstance(outputs, (tuple, list)):
            outputs = outputs[0]

        saved.append(outputs.detach().cpu())

    layer = 3

    handle = model.gpt_neox.layers[layer].register_forward_hook(hook)
    try:
        with torch.inference_mode():
            for batch in ids.split(16):
                model.gpt_neox(batch, use_cache=False)
    finally:
        handle.remove()

    X = torch.cat(saved)[:, 1:].reshape(-1, 512)
    print(f'Активации: {X.shape}')
    return X, layer, model, tokenizer


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3.png)
    """)
    return


@app.cell
def _(BrokenTopKSAE, X, torch):
    def train_sae(net, X):
        optimizer = torch.optim.Adam(net.parameters(), lr=1e-3)
        ev_history = []
        seen = torch.zeros(2048, dtype=torch.bool)

        for step in range(1000):
            x = X[torch.randint(len(X), (64,))]
            x_hat, acts = net(x)
            loss = (x - x_hat).square().mean()
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            if step >= 500:
                with torch.no_grad():
                    ev = 1 - (x - x_hat).var(dim=-1, unbiased=False).mean() / x.var(dim=-1, unbiased=False).mean().clamp_min(1e-12)
                    ev_history.append(ev.item())
                    seen |= (acts != 0).any(dim=0)

        return sum(ev_history) / 500, (~seen).float().mean().item()


    broken = BrokenTopKSAE()
    ev_bad, dead_bad = train_sae(broken, X.float())
    print(f'Broken: Explained Variance = {ev_bad:.1%}, Dead Latents = {dead_bad:.1%}')
    return (train_sae,)


@app.cell
def _(nn, torch):
    class FixedTopKSAE(nn.Module):
        def __init__(self, x_mean, d_model=512, d_sae=2048, k=32):
            super().__init__()
            self.k = k

            W = torch.randn(d_sae, d_model)
            W = W / W.norm(dim=1, keepdim=True)

            self.W_enc = nn.Parameter(W.T.clone())
            self.b_enc = nn.Parameter(torch.zeros(d_sae))

            self.W_dec = nn.Parameter(W.clone())
            self.b_dec = nn.Parameter(x_mean.clone())

        def encode(self, x):
            pre_acts = (x - self.b_dec) @ self.W_enc + self.b_enc
            val, idx = torch.topk(pre_acts, self.k, dim=-1)
            acts = torch.zeros_like(pre_acts).scatter_(-1, idx, torch.relu(val))
            return acts

        def decode(self, acts):
            return acts @ (self.W_dec / self.W_dec.norm(dim=1, keepdim=True)) + self.b_dec

        def forward(self, x):
            acts = self.encode(x)
            x_hat = self.decode(acts)
            return x_hat, acts

    return (FixedTopKSAE,)


@app.cell
def _(FixedTopKSAE, X, train_sae):
    fixed = FixedTopKSAE(X.float().mean(dim=0))
    ev_good, dead_good = train_sae(fixed, X.float())
    print(f'Fixed: Explained Variance = {ev_good:.1%}, Dead Latents = {dead_good:.1%}')
    return (fixed,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Задание 4. Механистическая интерпретируемость: FeatureSteering против Neuron Steering
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_1.png)
    ![alt](public/task4_2.png)
    """)
    return


@app.cell
def _(layer, model, tokenizer, torch):
    tokenizer.pad_token = tokenizer.eos_token

    neutral_texts = [
        "The cat slept near the window.",
        "The train arrived at the station in the morning.",
        "She opened a book and started reading.",
        "It was a warm day in the quiet village.",
        "They went to the market to buy vegetables.",
        "He put the keys on the kitchen table.",
        "The children played outside after school.",
        "A small boat sailed slowly across the lake.",
        "The teacher explained the lesson to the class.",
        "We walked through the park before dinner.",
        "The old house stood at the end of the road.",
        "They finished their work and went home.",
        "The weather changed during the afternoon.",
        "She received a letter from her friend.",
        "The shop was closed on Sunday.",
        "A gentle breeze moved the leaves on the trees.",
    ]
    neutral = tokenizer(
        neutral_texts, 
        padding=True, 
        return_tensors='pt'
    )

    layer_module = model.gpt_neox.layers[layer]

    captured = []
    def capture(module, inputs, output):
        x = output[0] if isinstance(output, (tuple, list)) else output
        captured.append(x.detach())

    handle_capture = layer_module.register_forward_hook(capture)
    try:
        with torch.inference_mode():
            model(**neutral, use_cache=False)
    finally:
        handle_capture.remove()

    mask = neutral['attention_mask'].bool()
    mean_norm = captured[0][mask].norm(dim=-1).mean().item()

    levels = [0.1, 0.3, 0.5, 0.8, 1.0, 1.2, 1.5]
    report_levels = [0.1, 0.8, 1.5]

    print(f'Средняя L2-норма: {mean_norm:.4f}')
    print(f'alpha: {[round(k * mean_norm, 3) for k in levels]}')
    return (
        layer_module,
        levels,
        mean_norm,
        neutral,
        neutral_texts,
        report_levels,
    )


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_3.png)
    """)
    return


@app.cell
def _(layer_module, levels, mean_norm, mo, model, pd, tokenizer, torch):
    def make_steering_hook(direction, alpha):
        def change(module, inputs, output):
            x = output[0] if isinstance(output, (tuple, list)) else output
            direction_for_x = direction.to(device=x.device, dtype=x.dtype)
            changed = x + alpha * direction_for_x

            if isinstance(output, tuple):
                return (changed,) + output[1:]
            if isinstance(output, list):
                return [changed] + output[1:]
            return changed

        return change

    original_text = 'In the middle of the room there was a large table with'
    prompt = tokenizer(
        original_text,
        return_tensors='pt'
    )

    def generate(direction, alpha):
        handle = layer_module.register_forward_hook(make_steering_hook(direction, alpha))
        try:
            with torch.inference_mode():
                result = model.generate(
                    **prompt,
                    max_new_tokens=25,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id
                )
        finally:
            handle.remove()

        start = prompt['input_ids'].shape[1]
        return tokenizer.decode(result[0, start:], skip_special_tokens=True)

    e = torch.zeros(512)
    e_idx = 67
    e[e_idx] = 1.0

    baseline = generate(e, 0.0)
    neuron_texts = {k: generate(e, k * mean_norm) for k in levels}

    rows = [
        {
            'Режим': 'Baseline',
            'Уровень': '0',
            r'$\alpha$': 0.0,
            'Продолжение': baseline.replace('\n', ' ')
        }
    ]

    for k, text in neuron_texts.items():
        rows.append({
            'Режим': 'Neuron Steering',
            'Уровень': f'{k:.1f}',
            r'$\alpha$': round(k * mean_norm, 2),
            'Продолжение': text.replace('\n', ' ')
        })

    df = pd.DataFrame(rows)

    print(original_text)
    mo.md(df.to_markdown())
    return e, e_idx, generate, make_steering_hook


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_4.png)
    """)
    return


@app.cell
def _(fixed, layer_module, mo, model, neutral_texts, pd, tokenizer, torch):
    bracket_texts = [
        "The result (see Table 2) was better than expected.",
        "The meeting (which lasted three hours) ended at noon.",
        "She bought apples (red and green) at the market.",
        "Most students (about 80 percent) passed the exam.",
        "The museum (opened in 1920) is free on Mondays.",
        "Our team (five people in total) finished the project early.",
        "The function print(x) writes the value to the screen.",
        "if (a > b) { return a; } else { return b; }",
        "for (int i = 0; i < n; i++) { sum += arr[i]; }",
        "Let f(x) = (x + 1) * (x - 1) for all real x.",
        "data = {'name': 'Alice', 'age': 30}",
        "values = [1, 2, 3, 4, 5]",
        "matrix[i][j] = matrix[j][i] + 1",
        "def add(a, b): return (a + b)",
    ]
    check = tokenizer(
        bracket_texts + neutral_texts,
        padding=True,
        return_tensors='pt'
    )

    _captured = []
    def _capture(module, inputs, output):
        x = output[0] if isinstance(output, (tuple, list)) else output
        _captured.append(x.detach())

    _handle = layer_module.register_forward_hook(_capture)
    try:
        with torch.inference_mode():
            model(**check, use_cache=False)
    finally:
        _handle.remove()

    real = check['attention_mask'].bool()
    real[:, 0] = False
    with torch.inference_mode():
        f = fixed.encode(_captured[0][real].float())

    check_tokens = [
        tokenizer.decode([t]) 
        for t in check['input_ids'][real].tolist()
    ]
    target = torch.tensor([
        any(c in t for c in '([{') for t in check_tokens
    ])

    mean_target = f[target].mean(dim=0)
    zero_other = (f[~target] == 0).float().mean(dim=0)
    j = torch.where(zero_other >= 0.99, mean_target, -1.0).argmax().item()

    print(f'Токенов: {len(check_tokens)}, целевых (открывающие скобки): {target.sum().item()}, остальных: {(~target).sum().item()}')
    print(f'Латентов, которые молчат на >= 99% остальных токенов: {(zero_other >= 0.99).sum().item()} из 2048')
    print(f'Выбран латент j = {j}: E[f_j] на скобках = {mean_target[j]:.2f}, на остальных = {f[~target, j].mean():.2f}, нулей на остальных = {zero_other[j]:.1%}')

    _where = real.nonzero()
    _rows = []
    for _value, _i in zip(*f[:, j].topk(5)):
        _s, _p = _where[_i].tolist()
        _ids = check['input_ids'][_s]
        _token = tokenizer.decode(_ids[_p:_p + 1])
        _rows.append({
            '$f_j$': f'{_value:.2f}',
            'токен': f'`{_token}`',
            'контекст': tokenizer.decode(_ids[:_p]) + f'<mark>{_token}</mark>' + tokenizer.decode(_ids[_p + 1:], skip_special_tokens=True),
        })
    mo.md(pd.DataFrame(_rows).to_markdown(index=False))
    return (j,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_5.png)
    """)
    return


@app.cell
def _(fixed, generate, j, levels, mean_norm, mo, pd):
    v_sae = (fixed.W_dec[j] / fixed.W_dec[j].norm()).detach()

    _baseline = generate(v_sae, 0.0)
    feature_texts = {k: generate(v_sae, k * mean_norm) for k in levels}

    _rows = [
        {
            'Режим': 'Baseline',
            'Уровень': '0',
            r'$\alpha$': 0.0,
            'Продолжение': _baseline.replace('\n', ' ')
        }
    ]

    for _k, _text in feature_texts.items():
        _rows.append({
            'Режим': 'Feature Steering',
            'Уровень': f'{_k:.1f}',
            r'$\alpha$': round(_k * mean_norm, 2),
            'Продолжение': _text.replace('\n', ' ')
        })

    mo.md(pd.DataFrame(_rows).to_markdown())
    return (v_sae,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Контрольные задания и отчетность
    ![alt](public/task4_6.png)
    """)
    return


@app.cell
def _(e, generate, mean_norm, mo, pd, report_levels, v_sae):
    _strength = dict(zip(report_levels, ['слабое', 'среднее', 'сильное']))

    _rows = [
        {
            'Режим': 'Baseline',
            'Уровень': '0',
            r'$\alpha$': 0.0,
            'Продолжение': generate(e, 0.0).replace('\n', ' ')
        }
    ]

    for _mode, _direction in [('Neuron Steering', e), ('Feature Steering', v_sae)]:
        for _k in report_levels:
            _rows.append({
                'Режим': _mode,
                'Уровень': f'{_k:.1f} ({_strength[_k]})',
                r'$\alpha$': round(_k * mean_norm, 2),
                'Продолжение': generate(_direction, _k * mean_norm).replace('\n', ' ')
            })

    mo.md(pd.DataFrame(_rows).to_markdown())
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_7.png)
    """)
    return


@app.cell
def _(
    X,
    e,
    e_idx,
    j,
    layer_module,
    levels,
    make_steering_hook,
    mean_norm,
    model,
    neutral,
    plt,
    torch,
    v_sae,
):
    labels = neutral['input_ids'].masked_fill(neutral['attention_mask'] == 0, -100)

    def lm_loss(direction, alpha):
        handle = layer_module.register_forward_hook(make_steering_hook(direction, alpha))
        try:
            with torch.inference_mode():
                loss = model(**neutral, labels=labels, use_cache=False).loss
        finally:
            handle.remove()
        return loss.item()

    grid = [0.0] + levels
    neuron_loss = [lm_loss(e, k * mean_norm) for k in grid]
    feature_loss = [lm_loss(v_sae, k * mean_norm) for k in grid]

    _fig, _ax = plt.subplots()
    _ax.plot(grid, neuron_loss, marker='o', label=f'нейрон $e_{e_idx}$')
    _ax.plot(grid, feature_loss, marker='s', label=f'фича SAE $j = {j}$')
    _ax.set_xlabel(r'$\alpha \;/\; \mathbb{E}\|x\|_2$')
    _ax.set_ylabel('Cross-Entropy на нейтральных текстах')
    _ax.legend()
    plt.show()

    print(f'loss нейрон: {[round(l, 2) for l in neuron_loss]}')
    print(f'loss фича:   {[round(l, 2) for l in feature_loss]}')
    print(f'Дисперсия активаций вдоль e_{e_idx}: {(X.float() @ e).var():.2f}, вдоль v_SAE: {(X.float() @ v_sae).var():.2f}')
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4_8.png)
    """)
    return


@app.cell
def _(generate, mean_norm, mo, pd, v_sae):
    _rows = []
    for _k in [0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 0.28, 0.30]:
        _text = generate(v_sae, _k * mean_norm).replace('\n', ' ')
        _rows.append({r'$\alpha / \mathbb{E}\lVert x \rVert_2$': _k, r'$\alpha$': round(_k * mean_norm, 1), 'продолжение промпта': _text})
    mo.md(pd.DataFrame(_rows).to_markdown(index=False))
    return


if __name__ == "__main__":
    app.run()
