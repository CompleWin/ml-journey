import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt

    return mo, np, plt


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task6.png)
    """)
    return


@app.cell
def _(np, plt):
    def task6():
        x_test = [(5, -3), (-3, 8), (3, 6), (0, 0), (5, 3), (-3, -1), (-3, 3)]
    
        x_cords = [xi[0] for xi in x_test]
        y_cords = [xi[1] for xi in x_test]
    
        w = [-33, 9, 13]
    
        y = lambda x: -w[1] / w[2] * x - w[0] / w[2]
    
        sign = lambda x, w: [(1 if xi[0] * w[1] + xi[1] * w[2] + w[0] > 0 else -1) for xi in x]
    
        y_pred = sign(x_test, w)
    
        x = np.linspace(-10, 10, 100)
    
        plt.axvline(0, color='black')
        plt.axhline(0, color='black')
        plt.scatter(x_cords, y_cords, color='blue')
        plt.plot(x, y(x), color='red')
        plt.grid()
        plt.xlim(-10, 10)
        plt.ylim(-10, 10)
        plt.show()

    task6()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](/public/task7.png)
    """)
    return


@app.cell
def _():
    def task7():

        x_test = [(9, 6), (2, 4), (-3, -1), (3, -2), (-3, 6), (7, -3), (6, 2)]
    
        w = [-14, 7, -5]
        sign = lambda x, w: [1 if (w[1] * xi[0] + w[2] * xi[1] + w[0]) < 0 else -1 for xi in x]
        predict = sign(x_test, w)
        print(predict)
    
    task7()
    return


if __name__ == "__main__":
    app.run()
