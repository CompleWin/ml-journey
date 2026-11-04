import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import poisson, expon, uniform 
# 1. Фиксируем случайность
np.random.seed(42)

# 2. Параметры
n = 10000   

size_buffer = int(n * 1.5)   # запас 50%
unit_price_all = np.random.exponential(scale=40, size=size_buffer)
qty_all = np.random.poisson(lam=2, size=size_buffer)
discount_all = np.random.uniform(0, 0.35, size=size_buffer)
delivery_fee_all = np.random.uniform(0, 25, size=size_buffer)

# Отбираем только строки с qty > 0
mask = qty_all > 0
unit_price = unit_price_all[mask][:n]
qty = qty_all[mask][:n]
discount = discount_all[mask][:n]
delivery_fee = delivery_fee_all[mask][:n]

# Если после фильтрации не хватило записей, можно увеличить size_buffer, но при n=1000 и вероятности ~0.86 хватит

# 3. Вычисляем производные поля (используя поэлементные операции NumPy)
subtotal = unit_price * qty
discount_value = subtotal * discount
# avg_item_cost = subtotal / qty  (но это в точности unit_price, поэтому можно просто скопировать)
avg_item_cost = unit_price.copy()
order_total = subtotal - discount_value + delivery_fee

# 4. Собираем DataFrame
df = pd.DataFrame({
    'unit_price': unit_price,
    'qty': qty,
    'discount': discount,
    'delivery_fee': delivery_fee,
    'subtotal': subtotal,
    'discount_value': discount_value,
    'avg_item_cost': avg_item_cost,
    'order_total': order_total
})
print(df)

# 5. Функции для ручного вычисления оценок
def sample_mean(arr):
    """Выборочное среднее (ручное вычисление)"""
    return sum(arr) / len(arr)

def sample_var(arr):
    """Несмещённая выборочная дисперсия (ручное вычисление)"""
    mean_val = sample_mean(arr)
    # Сумма квадратов отклонений
    ss = sum((x - mean_val) ** 2 for x in arr)
    return ss / (len(arr) - 1)

# 6. Применяем к каждому столбцу
print("Оценки для каждого поля:\n")
for col in df.columns:
    mean_val = sample_mean(df[col])
    var_val = sample_var(df[col])
    print(f"{col:15} | mean = {mean_val:10.4f} | variance = {var_val:10.4f}")

def sample_std(arr):
    return np.sqrt(sample_var(arr))

# Вычислим для всех колонок
means = {}
stds = {}
for col in df.columns:
    means[col] = sample_mean(df[col])
    stds[col] = sample_std(df[col])

outliers_info = {}
for col in df.columns:
    mean_val = means[col]
    std_val = stds[col]
    threshold = 3 * std_val
    # Маска выбросов
    outlier_mask = np.abs(df[col] - mean_val) > threshold
    outlier_count = outlier_mask.sum()
    outliers_info[col] = {
        'count': outlier_count,
        'percentage': 100 * outlier_count / len(df),
        'values': df[col][outlier_mask].tolist()
    }

print("=" * 60)
print("ВЫБРОСЫ ПО ПРАВИЛУ 3-Х СИГМ")
print("=" * 60)
for col, info in outliers_info.items():
    print(f"\n{col:15} : выбросов {info['count']:3}")

def sample_cov(x, y):
    """Несмещённая ковариация между x и y"""
    n = len(x)
    mean_x = sample_mean(x)
    mean_y = sample_mean(y)
    # Сумма произведений отклонений
    cov_sum = np.sum((x - mean_x) * (y - mean_y))
    return cov_sum / (n - 1)

# Получим список всех колонок
columns = df.columns.tolist()
n_cols = len(columns)
corr_matrix = np.zeros((n_cols, n_cols))

# Вычисляем корреляцию для каждой пары
for i, col1 in enumerate(columns):
    for j, col2 in enumerate(columns):
        if i == j:
            corr_matrix[i, j] = 1.0
        else:
            # Можно использовать симметрию, но для наглядности вычислим все
            cov_ij = sample_cov(df[col1], df[col2])
            std_i = stds[col1]
            std_j = stds[col2]
            corr_matrix[i, j] = cov_ij / (std_i * std_j)

# Представим в виде DataFrame для удобства
corr_df = pd.DataFrame(corr_matrix, index=columns, columns=columns)

print("\n" + "=" * 60)
print("МАТРИЦА КОРРЕЛЯЦИЙ (Пирсона, ручное вычисление)")
print("=" * 60)
print(corr_df.round(4))

# ТОЧЕЧНЫЕ ГРАФИКИ С ВЫДЕЛЕНИЕМ ВЫБРОСОВ

#Вычисляем маски выбросов для каждого поля
outlier_masks = {}
for col in df.columns:
    mean_val = means[col]
    std_val = stds[col]
    threshold = 3 * std_val
    outlier_masks[col] = np.abs(df[col] - mean_val) > threshold

# Построим графики для каждого поля (сетка 2x4)
fig, axes = plt.subplots(2, 4, figsize=(15, 10))
axes = axes.flatten()

for idx, col in enumerate(df.columns):
    ax = axes[idx]
    x = np.arange(len(df))  # индекс
    y = df[col]
    mask_out = outlier_masks[col]
    
    # Обычные точки (синие)
    ax.scatter(x[~mask_out], y[~mask_out], c='blue', s=10, alpha=0.6, label='normal')
    # Выбросы (красные)
    ax.scatter(x[mask_out], y[mask_out], c='red', s=30, label='outlier')
    ax.set_title(col)
    ax.set_xlabel('Индекс наблюдения')
    ax.set_ylabel(col)
    ax.legend(loc='upper right', fontsize=8)

plt.suptitle('Точечные графики с выделением выбросов', fontsize=14)
plt.tight_layout()
plt.show()

# ГИСТОГРАММЫ РАСПРЕДЕЛЕНИЙ И ПРОВЕРКА СООТВЕТСТВИЯ

# Создаем сетку 2x4
fig, axes = plt.subplots(4, 2, figsize=(12, 16))
axes = axes.flatten()

for idx, col in enumerate(df.columns):
    ax = axes[idx]
    data = df[col]
    
    # 1. Рассчитываем статистики
    mean_val = data.mean()
    std_val = data.std()
    upper_bound = mean_val + 3 * std_val
    
    # 2. Строим гистограмму (частота, а не плотность)
    # bins=50 для большей детализации, как на Рисунке 1
    ax.hist(data, bins=50, color='tab:blue', edgecolor=None, alpha=1.0)
    
    # 3. Добавляем вертикальные линии (среднее и 3 сигмы)
    ax.axvline(mean_val, color='red', linestyle='--', linewidth=1.5, 
               label=f'Среднее = {mean_val:.2f}')
    ax.axvline(upper_bound, color='orange', linestyle=':', linewidth=1.5, 
               label=f'+3σ = {upper_bound:.2f}')
    
    # 4. Оформление
    ax.set_title(f'Гистограмма: {col}')
    ax.set_xlabel(col)
    ax.set_ylabel('Частота')
    ax.legend(loc='upper right', fontsize=8)

plt.suptitle('Гистограммы с выделением границ 3σ', fontsize=14)
plt.tight_layout()
plt.show()

# ТЕПЛОВАЯ КАРТА КОРРЕЛЯЦИЙ
columns = df.columns.tolist()
n_cols = len(columns)
corr_matrix = np.zeros((n_cols, n_cols))

for i, col1 in enumerate(columns):
    for j, col2 in enumerate(columns):
        if i == j:
            corr_matrix[i, j] = 1.0
        else:
            cov_ij = sample_cov(df[col1], df[col2])
            corr_matrix[i, j] = cov_ij / (stds[col1] * stds[col2])

corr_df = pd.DataFrame(corr_matrix, index=columns, columns=columns)

plt.figure(figsize=(10, 8))
sns.heatmap(corr_df, annot=True, fmt='.2f', cmap='coolwarm', center=0,
            square=True, linewidths=0.5, cbar_kws={'label': 'коэффициент корреляции'})
plt.title('Тепловая карта коэффициентов корреляции Пирсона (ручной расчёт)')
plt.tight_layout()
plt.show()