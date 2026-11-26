# Data Leakage -- a model that scores great in testing and fails in production
# Companion code for the video -- paste this into a Colab cell and run it.

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

np.random.seed(42)
n = 2000

# ---------------------------------------------------------------------------
# Two honest features: income and loan amount. The true probability of
# default depends on the loan-to-income ratio, plus realistic noise --
# there's a genuine but moderate signal here, not a perfect one.
# ---------------------------------------------------------------------------
income = np.random.uniform(20000, 120000, n)
loan_amount = np.random.uniform(5000, 50000, n)

ratio = loan_amount / income
prob_default = 1 / (1 + np.exp(-(ratio * 6 - 3)))
default = (np.random.rand(n) < prob_default).astype(int)

print(f"Default rate in this dataset: {default.mean():.1%}")
print()

# ---------------------------------------------------------------------------
# THE LEAKY FEATURE: "collections_flag" only takes a meaningful value AFTER
# someone has already defaulted -- it doesn't exist at the moment a loan
# application actually needs a prediction. A touch of noise is added so it
# isn't a literal copy of the label, which is realistic -- leaks are rarely
# perfectly clean copies in real datasets either.
# ---------------------------------------------------------------------------
collections_flag = np.where(default == 1, 1, 0)
noise_idx = np.random.choice(n, size=int(n * 0.03), replace=False)
collections_flag[noise_idx] = 1 - collections_flag[noise_idx]

df = pd.DataFrame({
    "income": income,
    "loan_amount": loan_amount,
    "collections_flag": collections_flag,
    "default": default,
})

# ---------------------------------------------------------------------------
# Split FIRST, before anything else -- same discipline as the last two videos,
# generalized: nothing gets calculated until the split has already happened.
# ---------------------------------------------------------------------------
X_with_flag = df[["income", "loan_amount", "collections_flag"]]
X_clean = df[["income", "loan_amount"]]
y = df["default"]

X_train_leak, X_test_leak, y_train, y_test = train_test_split(
    X_with_flag, y, test_size=0.3, random_state=1
)
X_train_clean, X_test_clean, _, _ = train_test_split(
    X_clean, y, test_size=0.3, random_state=1
)

# ---------------------------------------------------------------------------
# THE INFLATED NUMBER: train with the leaky feature included
# ---------------------------------------------------------------------------
print("=== With the leaky feature (collections_flag) ===")

model_leaky = LogisticRegression()
model_leaky.fit(X_train_leak, y_train)
acc_leaky = accuracy_score(y_test, model_leaky.predict(X_test_leak))
print(f"Test accuracy: {acc_leaky:.3f}")
print()

# ---------------------------------------------------------------------------
# THE HONEST NUMBER: same model, same data, minus the leaky column
# ---------------------------------------------------------------------------
print("=== Without the leaky feature (realistic) ===")

model_clean = LogisticRegression()
model_clean.fit(X_train_clean, y_train)
acc_clean = accuracy_score(y_test, model_clean.predict(X_test_clean))
print(f"Test accuracy: {acc_clean:.3f}")
print()

print(f">> The leaky feature inflated test accuracy from {acc_clean:.1%} to {acc_leaky:.1%}.")
print(">> In production, collections_flag doesn't exist at prediction time --")
print(">> so the real-world accuracy of this model is the honest number, not the inflated one.")

# ---------------------------------------------------------------------------
# CONTRAST CARD for the slide deck -- matches the exact numbers printed above,
# not a separately-drawn approximation. Brand palette: black/white/red/green.
# ---------------------------------------------------------------------------
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(6, 4), facecolor="white")
bars = ax.bar(
    ["With leaky feature", "Without leaky feature"],
    [acc_leaky, acc_clean],
    color=["#d32f2f", "#2e7d32"],
    width=0.5,
)
for bar, acc in zip(bars, [acc_leaky, acc_clean]):
    ax.text(
        bar.get_x() + bar.get_width() / 2, acc + 0.02, f"{acc:.1%}",
        ha="center", va="bottom", fontsize=14, fontweight="bold", color="black",
    )
ax.set_ylim(0, 1.05)
ax.set_ylabel("Test accuracy")
ax.set_title("Inflated vs. honest accuracy")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("DataLeakage_accuracy_contrast.png", dpi=150)
print("Saved contrast chart: DataLeakage_accuracy_contrast.png")
