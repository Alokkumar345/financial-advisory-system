"""
FinAdvisor XAI — Model Training, Cross-Validation & Weight Extraction Pipeline
Trains 4 machine learning architectures:
  1. XGBoost Classifier
  2. Gradient Boosting Classifier
  3. Random Forest Classifier
  4. Multinomial Logistic Regression (Deployed for exact closed-form SHAP explainability)

Exports trained weights and benchmark metrics to JSON for the TypeScript inference engine.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import xgboost as xgb

from generate_dataset import generate_investor_dataset

FEATURES = [
    "risk_tolerance",
    "horizon_years",
    "age",
    "savings_rate",
    "income_stability",
    "emergency_months",
    "debt_burden",
    "dependents",
    "net_worth_months",
]

FEATURE_LABELS = {
    "risk_tolerance": "Risk tolerance",
    "horizon_years": "Investment horizon",
    "age": "Age",
    "savings_rate": "Savings rate",
    "income_stability": "Income stability",
    "emergency_months": "Emergency fund",
    "debt_burden": "Debt burden",
    "dependents": "Dependents",
    "net_worth_months": "Net-worth buffer",
}

CLASSES = ["Conservative", "Moderate", "Aggressive"]

def train_and_evaluate_pipeline():
    print("=" * 65)
    print("      FinAdvisor XAI — ML Training & Evaluation Pipeline")
    print("=" * 65)

    data_path = "ml/data/investor_profiles.csv"
    if not os.path.exists(data_path):
        print("[1/5] Generating synthetic investor dataset (N=5,000)...")
        os.makedirs("ml/data", exist_ok=True)
        df = generate_investor_dataset(5000)
        df.to_csv(data_path, index=False)
    else:
        print(f"[1/5] Loading existing dataset from {data_path}...")
        df = pd.read_csv(data_path)

    print(f"      Total dataset size: {len(df)} samples")
    print(f"      Target distribution: {dict(df['risk_class'].value_counts())}")

    X = df[FEATURES].copy()
    y = df["risk_class"].copy()

    # Train-test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Standard Scaler (Computes baseline mean & std for SHAP)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Encode labels: Conservative=0, Moderate=1, Aggressive=2
    le = LabelEncoder()
    le.fit(CLASSES)
    y_train_encoded = le.transform(y_train)
    y_test_encoded = le.transform(y_test)

    print("\n[2/5] Benchmarking Models with 5-Fold Stratified Cross-Validation...")

    models = {
        "XGBoost": xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            random_state=42,
            eval_metric="mlogloss",
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=42,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=120,
            max_depth=6,
            random_state=42,
            n_jobs=-1,
        ),
        "Logistic Regression (deployed)": LogisticRegression(
            solver="lbfgs",
            max_iter=1000,
            random_state=42,
            C=1.0,
        ),
    }

    leaderboard = []
    trained_estimators = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in models.items():
        print(f"      Training {name}...", end=" ", flush=True)

        # Cross validation scores
        scores = cross_validate(
            clf,
            X_train_scaled,
            y_train_encoded,
            cv=cv,
            scoring=["accuracy", "f1_macro", "roc_auc_ovr"],
            n_jobs=-1,
        )

        acc = float(np.mean(scores["test_accuracy"]))
        f1 = float(np.mean(scores["test_f1_macro"]))
        roc_auc = float(np.mean(scores["test_roc_auc_ovr"]))

        # Fit on training set and evaluate on held-out test set
        clf.fit(X_train_scaled, y_train_encoded)
        trained_estimators[name] = clf

        is_deployed = "deployed" in name
        notes = (
            "Deployed: Exact closed-form SHAP explainability and low inference latency"
            if is_deployed
            else f"Offline benchmark model ({name.split()[0]} ensemble)"
        )

        leaderboard.append({
            "model": name,
            "accuracy": round(acc, 3),
            "f1": round(f1, 3),
            "rocAuc": round(roc_auc, 3),
            "selected": is_deployed,
            "notes": notes,
        })
        print(f"Done! Acc: {acc*100:.1f}% | F1: {f1*100:.1f}% | ROC-AUC: {roc_auc*100:.1f}%")

    # Sort leaderboard by Accuracy descending
    leaderboard.sort(key=lambda x: x["accuracy"], reverse=True)

    print("\n[3/5] Model Benchmark Comparison Table:")
    print("-" * 65)
    print(f"{'Model':<32} | {'Accuracy':<10} | {'F1-Score':<10} | {'ROC-AUC':<10}")
    print("-" * 65)
    for m in leaderboard:
        mark = "[DEPLOYED]" if m["selected"] else " "
        print(f"{m['model']:<32} | {m['accuracy']*100:.1f}%      | {m['f1']*100:.1f}%      | {m['rocAuc']*100:.1f}% {mark}")
    print("-" * 65)

    print("\n[4/5] Extracting Deployed Multinomial Logistic Regression Parameters...")
    deployed_lr = trained_estimators["Logistic Regression (deployed)"]

    # Save trained scikit-learn model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(deployed_lr, "ml/models/deployed_logistic_model.joblib")
    joblib.dump(scaler, "ml/models/standard_scaler.joblib")

    # Classes in encoder order
    class_order = [le.inverse_transform([i])[0] for i in range(len(CLASSES))]

    # Build per-feature JSON spec
    feature_specs = []
    for i, feat in enumerate(FEATURES):
        means = float(scaler.mean_[i])
        stds = float(scaler.scale_[i])

        # Extract weights for each class
        weights = {}
        for c_idx, c_name in enumerate(class_order):
            weights[c_name] = round(float(deployed_lr.coef_[c_idx, i]), 3)

        feature_specs.append({
            "key": feat,
            "label": FEATURE_LABELS[feat],
            "mean": round(means, 3),
            "std": round(stds, 3),
            "weights": weights,
        })

    # Extract intercepts
    intercepts = {}
    for c_idx, c_name in enumerate(class_order):
        intercepts[c_name] = round(float(deployed_lr.intercept_[c_idx]), 3)

    # Compute global feature importances: mean(|w_{c, i}|) across classes
    global_importances = []
    for spec in feature_specs:
        avg_w = float(np.mean([abs(spec["weights"][c]) for c in CLASSES]))
        global_importances.append({
            "label": spec["label"],
            "importance": round(avg_w, 3)
        })
    global_importances.sort(key=lambda x: x["importance"], reverse=True)

    export_data = {
        "metadata": {
            "model_type": "Multinomial Logistic Regression (L-BFGS)",
            "trained_samples": len(X_train),
            "num_features": len(FEATURES),
            "classes": CLASSES,
            "training_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        "intercepts": intercepts,
        "feature_specs": feature_specs,
        "global_importance": global_importances,
        "leaderboard": leaderboard,
    }

    print("\n[5/5] Exporting Trained Model Weights to TypeScript Engine...")
    json_path = "src/lib/finance/model_weights.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)

    print(f"      Model weights saved to {json_path}")
    print("\n[SUCCESS] ML Training Pipeline completed successfully!")
    print("=" * 65)

if __name__ == "__main__":
    train_and_evaluate_pipeline()
