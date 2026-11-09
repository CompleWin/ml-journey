import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell
def _():
    import marimo as mo
    import numpy as np

    return mo, np


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4.png)
    """)
    return


@app.cell
def _(np):
    def task4():
        def func(x):
            return 0.1 * x**2 - np.sin(x) + 0.1 * np.cos(x * 5) + 1.

        def model(x, w):
            return w[0] + w[1] * x + w[2] * x ** 2 + w[3] * x ** 3 + w[4] * x ** 4
    
        def loss_func(xi, w):
            return (model(xi, w) - func(xi)) ** 2
    
    
        coord_x = np.arange(-5.0, 5.0, 0.1) # значения отсчетов по оси абсцисс
        coord_y = func(coord_x) # значения функции по оси ординат
        sz = len(coord_x) # общее число отсчетов
        w = np.array([1.11, -0.26, 0.061, 0.0226, 0.00178])
    
        Q = sum(loss_func(xi, w) for xi in coord_x) / sz
        print(Q)

    task4()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task5.png)
    """)
    return


@app.cell
def _(np):
    def task5():
        def func(x):
            return 0.5 * x**2 - 0.1 * 1/np.exp(-x) + 0.5 * np.cos(2*x) - 2.

        def model(x, w):
            return w[0] + w[1] * x + w[2] * x**2 + w[3] * np.cos(2 * x) + w[4] * np.sin(2 * x)

        def loss(x, w):
            return np.abs(model(x, w) - func(x))
    
    
        coord_x = np.arange(-5.0, 5.0, 0.1) # значения отсчетов по оси абсцисс
        coord_y = func(coord_x) # значения функции по оси ординат
        w = [-1.59, -0.69, 0.278, 0.497, -0.106]
        sz = len(coord_x) # общее число отсчетов
    
        Q = np.average([loss(xi, w) for xi in coord_x])
        print(Q)

    task5()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task6.png)
    """)
    return


@app.cell
def _(np):
    def task6():
        data_x = [
            (5.8, 1.2), (5.6, 1.5), (6.5, 1.5), (6.1, 1.3), (6.4, 1.3), (7.7, 2.0), (6.0, 1.8), (5.6, 1.3), (6.0, 1.6), (5.8, 1.9), (5.7, 2.0), (6.3, 1.5), (6.2, 1.8), (7.7, 2.3), (5.8, 1.2), (6.3, 1.8), (6.0, 1.0), (6.2, 1.3), (5.7, 1.3), (6.3, 1.9), (6.7, 2.5), (5.5, 1.2), (4.9, 1.0), (6.1, 1.4), (6.0, 1.6), (7.2, 2.5), (7.3, 1.8), (6.6, 1.4), (5.6, 2.0), (5.5, 1.0), (6.4, 2.2), (5.6, 1.3), (6.6, 1.3), (6.9, 2.1), (6.8, 2.1), (5.7, 1.3), (7.0, 1.4), (6.1, 1.4), (6.1, 1.8), (6.7, 1.7), (6.0, 1.5), (6.5, 1.8), (6.4, 1.5), (6.9, 1.5), (5.6, 1.3), (6.7, 1.4), (5.8, 1.9), (6.3, 1.3), (6.7, 2.1), (6.2, 2.3), (6.3, 2.4), (6.7, 1.8), (6.4, 2.3), (6.2, 1.5), (6.1, 1.4), (7.1, 2.1), (5.7, 1.0), (6.8, 1.4), (6.8, 2.3), (5.1, 1.1), (4.9, 1.7), (5.9, 1.8), (7.4, 1.9), (6.5, 2.0), (6.7, 1.5), (6.5, 2.0), (5.8, 1.0), (6.4, 2.1), (7.6, 2.1), (5.8, 2.4), (7.7, 2.2), (6.3, 1.5), (5.0, 1.0), (6.3, 1.6), (7.7, 2.3), (6.4, 1.9), (6.5, 2.2), (5.7, 1.2), (6.9, 2.3), (5.7, 1.3), (6.1, 1.2), (5.4, 1.5), (5.2, 1.4), (6.7, 2.3), (7.9, 2.0), (5.6, 1.1), (7.2, 1.8), (5.5, 1.3), (7.2, 1.6), (6.3, 2.5), (6.3, 1.8), (6.7, 2.4), (5.0, 1.0), (6.4, 1.8), (6.9, 2.3), (5.5, 1.3), (5.5, 1.1), (5.9, 1.5), (6.0, 1.5), (5.9, 1.8)
        ]
        data_y = np.array([-1, -1, -1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, -1, -1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1])

        data_x = np.array([(1, x[0], x[1]) for x in data_x])
    
        a = np.sum([x * y for x, y in zip(data_x, data_y)], axis=0)
        b = np.sum([np.outer(x, x) for x in data_x], axis=0)
        b = np.linalg.inv(b)
        w = a @ b

        print(w)


    task6()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    `np.outer(a, b)` — функция NumPy, которая вычисляет внешнее произведение двух одномерных векторов.

    Каждый элемент первого вектора умножается на каждый элемент второго, в результате получается матрица.
    """)
    return


@app.cell
def _(np):
    a = np.array([2, 3])
    b = np.array([4, 5])

    np.outer(a, b)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Результат:
    \[
    \begin{pmatrix}
    2\cdot4 & 2\cdot5\\
    3\cdot4 & 3\cdot5
    \end{pmatrix}
    =
    \begin{pmatrix}
    8 & 10\\
    12 & 15
    \end{pmatrix}
    \]

    Математическая запись:
    \[
    \operatorname{outer}(a,b)=ab^T
    \]

    Размерность результата: если a содержит \(m\) элементов, а b — \(n\), получится матрица \(m\times n\).

    Отличие от np.dot():
    - np.dot(a, b) — скалярное произведение, возвращает число.
    - np.outer(a, b) — внешнее произведение, возвращает матрицу.
    """)
    return


if __name__ == "__main__":
    app.run()
