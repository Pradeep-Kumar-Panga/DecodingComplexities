# Class imbalance -- why a 73.5% baseline accuracy means nothing here
# Companion code for the blog post. Run directly: python class_imbalance_demo.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, recall_score, precision_score, confusion_matrix

df = pd.read_csv("WA_Fn-UseC_-Telco-Customer-Churn.csv")
df = df.drop(columns=["customerID"])
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0)

class_counts = df["Churn"].value_counts()
print("Real class distribution:")
print(class_counts)
print((class_counts / class_counts.sum() * 100).round(1))
print()

# Naive baseline: always predict the majority class, never look at a feature
majority_class = class_counts.idxmax()

# Real model: numeric features only, kept simple on purpose (the demo is about the imbalance trap)
X = df[["tenure", "MonthlyCharges", "TotalCharges"]]
y = (df["Churn"] == "Yes").astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=1, stratify=y
)
print(f"Held-out test set: {len(y_test)} customers, {y_test.sum()} actual churners")

# Baseline and model are both scored on this same test set
majority_label = int(majority_class == "Yes")
baseline_preds = pd.Series(majority_label, index=y_test.index)
naive_accuracy = accuracy_score(y_test, baseline_preds)
naive_recall = recall_score(y_test, baseline_preds)
print(f"Naive baseline (always predict '{majority_class}'): {naive_accuracy:.1%} accuracy, {naive_recall:.1%} recall")
print()

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression()
model.fit(X_train_scaled, y_train)
preds = model.predict(X_test_scaled)

model_accuracy = accuracy_score(y_test, preds)
churn_recall = recall_score(y_test, preds)
churn_precision = precision_score(y_test, preds)
tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()

print(f"Trained model accuracy: {model_accuracy:.1%}")
print(f"Trained model recall on actual churners: {churn_recall:.1%}")
print(f"Trained model precision (of customers flagged as churners, share who really churn): {churn_precision:.1%}")
print(f"Confusion matrix -- true stayers kept: {tn}, false alarms: {fp}, churners missed: {fn}, churners caught: {tp}")
print()
print(f">> The naive baseline ({naive_accuracy:.1%}) and the trained model ({model_accuracy:.1%})")
print(">> score within a few points of each other on accuracy alone --")
print(f">> but the trained model actually catches {churn_recall:.1%} of real churners, the baseline catches {naive_recall:.0%}.")

# Contrast chart: accuracy alone vs. recall on the class that matters, same numbers as above
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(10, 4.5), facecolor="white")

axes[0].bar(["Naive baseline", "Trained model"], [naive_accuracy, model_accuracy],
            color=["#888888", "#2e7d32"], width=0.5)
axes[0].set_ylim(0, 1.0)
axes[0].set_title("Accuracy alone")
for i, v in enumerate([naive_accuracy, model_accuracy]):
    axes[0].text(i, v + 0.02, f"{v:.1%}", ha="center", fontweight="bold")
axes[0].spines[["top", "right"]].set_visible(False)

axes[1].bar(["Naive baseline", "Trained model"], [naive_recall, churn_recall],
            color=["#d32f2f", "#2e7d32"], width=0.5)
axes[1].set_ylim(0, 1.0)
axes[1].set_title("Recall on actual churners")
for i, v in enumerate([naive_recall, churn_recall]):
    axes[1].text(i, v + 0.02, f"{v:.1%}", ha="center", fontweight="bold")
axes[1].spines[["top", "right"]].set_visible(False)

plt.tight_layout()
plt.savefig("ClassImbalance_accuracy_vs_recall.png", dpi=150)
print("Saved contrast chart: ClassImbalance_accuracy_vs_recall.png")
