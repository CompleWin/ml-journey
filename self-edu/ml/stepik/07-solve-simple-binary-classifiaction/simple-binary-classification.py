import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt

    return mo, np


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3.png)
    """)
    return


@app.cell
def _(np):
    def task3():
        w = np.array([15/7, -9/7, -1])
        x_test = np.array([[-8, -4], [-2, 2], [4, 8], [6, 3]]) # задайте самостоятельно (признаки образов: x0, x1, x2)
        y_test = np.array([1, 1, -1, -1]) # задайте самостоятельно (метки класса)

        def calculate_margin(w, x, y):
            # M = <wi, xi> * yi
            return (w[1] * x[0] + w[2] * x[1] + w[0]) * y

        margins = np.array([calculate_margin(w, xi, yi) for xi, yi in zip(x_test, y_test)])
        print(margins)

    task3()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4.png)
    """)
    return


@app.cell
def _(np):
    def task4():
        w = np.array([-16, -4, 9]) # задайте самостоятельно (параметры модели: w0, w1, w2 - ориентация разделяющей линии)
        x_test = np.array([[-5, 2], [-4, 6], [3, 2], [3, -3], [5, 6], [9, 2]]) # задайте самостоятельно (признаки образов: x0, x1, x2)
        y_test = np.array([1, 1, 1, -1, -1, -1]) # задайте самостоятельно (метки класса)

        def margins(x, y):
            return (w[1] * x[0] + w[2] * x[1] + w[0]) * y 

        margin = np.array([margins(xi, yi) for xi, yi in zip(x_test, y_test)])
        print(margin)

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
        x_test = np.array([(-5, 2), (-4, 6), (3, 2), (3, -3), (5, 5), (5, 2), (-1, 3)])
        y_test = np.array([1, 1, 1, -1, -1, -1, -1])
        w = np.array([-8/3, -2/3, 1])

        def margin(x, y):
            return (w[1] * x[0] + w[2] * x[1] + w[0]) * y

        margins = np.array([margin(xi, yi) for xi, yi in zip(x_test, y_test)])
        Q = np.sum(margins < 0)
        print(Q)

    task5()
    return


if __name__ == "__main__":
    app.run()
