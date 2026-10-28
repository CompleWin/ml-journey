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
    import torch

    return AutoModelForCausalLM, AutoTokenizer, load_dataset, mo, nn, torch


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
    assert len(X) == len(ids) * 127
    torch.save(X, "pythia_activations.pt")
    return (X,)


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
    return


if __name__ == "__main__":
    app.run()
