import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["ipynb"])


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Тесты
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ### Подвиг 1. Выберите все верные выражения, представляющие собой линейную модель относительно вектора параметров θ

    ![alt](public/test1.png)

    ### Подвиг 2. Выберите все верные утверждения, касающиеся линейной модели.

    ![alt](public/test2.png)

    ### Подвиг 3. Выберите все верные утверждения, касающиеся признаков образов обучающей выборки.

    ![alt](public/test3.png)

    ### Подвиг 6. Выберите все верные утверждения, касающиеся эффекта переобучения модели.

    ![alt](public/test4.png)
    """)
    return


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt

    return mo, np, plt


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task4.png)
    """)
    return


@app.cell
def _(np):
    def task4():
        np.random.seed(0) # псевдослучайные числа образуют одну и ту же последовательность (при каждом запуске)
        x = np.arange(-1.0, 1.0, 0.1) # аргумент [-1; 1] с шагом 0,1

        size_train = len(x)  # размер выборки
        w = [0.5, -0.3]  # коэффициенты модели
        model_a = lambda m_x, m_w: (m_w[1] * m_x + m_w[0])  # модель
        loss = lambda ax, y: (ax - y) ** 2 # квадратическая функция потерь

        y = model_a(x, w) + np.random.normal(0, 0.1, len(x)) # целевые значения
        # здесь продолжайте программу
        Q = np.sum(loss(model_a(x, w), y)) / size_train # <- РЕШЕНИЕ
        print(Q)

    task4()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task5.png)
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    >`column_stack` объединяет две матрицы в одну, принимает кортеж
    `np.linalg.inv` ищет обратную матрицу
    """)
    return


@app.cell
def _(np, plt):
    def task5():
        np.random.seed(0) # псевдослучайные числа образуют одну и ту же последовательность (при каждом запуске)
        x = np.arange(-1.0, 1.0, 0.1) # аргумент [-1; 1] с шагом 0,1

        model_a = lambda xx, ww: (ww[0] + ww[1] * xx) # модель
        Y = -5.2 + 0.7 * x + np.random.normal(0, 0.1, len(x)) # вектор целевых значений
        X = np.column_stack((np.ones(len(x)), x))

        w = np.linalg.inv(X.T @ X) @ X.T @ Y 

        y_pred = model_a(x, w)
        plt.scatter(x, Y)
        plt.plot(x, y_pred, color='red')
        plt.show()

    task5()    
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ![alt](public/task3.png)
    """)
    return


@app.cell
def _(np, plt):
    def task7():
        np.random.seed(0) # псевдослучайные числа образуют одну и ту же последовательность (при каждом запуске)
        x = np.arange(-1.0, 1.0, 0.1) # аргумент [-1; 1] с шагом 0,1


        model_a = lambda xx, ww: (ww[0] + ww[1] * xx + ww[2] * xx ** 2 + ww[3] * xx ** 3) # модель
        Y = np.sin(x * 5) + 2 * x + np.random.normal(0, 0.1, len(x)) # вектор целевых значений

        X = np.array([[1, xx, xx**2, xx**3] for xx in x]) # обучающая выборка для поиска коэффициентов w модели a

        w = np.linalg.inv(X.T @ X) @ X.T @ Y 

        y_pred = model_a(x, w)

        plt.scatter(x, Y)
        plt.plot(x, y_pred, color='red')

        plt.show()

    task7()
    return


if __name__ == "__main__":
    app.run()
