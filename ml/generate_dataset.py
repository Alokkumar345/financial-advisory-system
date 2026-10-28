"""
FinAdvisor XAI — Synthetic Investor Dataset Generator
Generates realistic multi-attribute investor profile data based on
empirical Indian financial distributions and behavioral finance principles.
"""

import os
import numpy as np
import pandas as pd

def generate_investor_dataset(num_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # 1. Age (skewed toward young professionals 22-60)
    age = np.clip(np.random.normal(34, 9, num_samples).astype(int), 21, 65)

    # 2. Monthly Income in INR (Lognormal distribution, median ~₹85,000)
    log_income = np.random.normal(11.3, 0.55, num_samples)
    monthly_income = np.round(np.exp(log_income) / 1000) * 1000
    monthly_income = np.clip(monthly_income, 25000, 500000)

    # 3. Monthly Living Expenses (Fraction of income: 25% - 70%)
    expense_ratio = np.clip(np.random.beta(3, 4, num_samples) * 0.7 + 0.15, 0.25, 0.75)
    monthly_expenses = np.round((monthly_income * expense_ratio) / 500) * 500

    # 4. Debt EMI (Fraction of income: 0% - 45%)
    has_debt = np.random.binomial(1, 0.65, num_samples)
    emi_ratio = has_debt * np.clip(np.random.beta(2, 5, num_samples) * 0.45, 0.05, 0.45)
    monthly_emi = np.round((monthly_income * emi_ratio) / 500) * 500

    # Monthly Outflow
    outflow = monthly_expenses + monthly_emi
    surplus = np.maximum(0, monthly_income - outflow)

    # 5. Liquid Savings (0.5 to 18 months of outflow)
    savings_months = np.clip(np.random.gamma(2.5, 2.2, num_samples), 0.5, 24)
    current_savings = np.round((outflow * savings_months) / 5000) * 5000

    # 6. Existing Investments (Correlation with age and surplus)
    inv_factor = np.clip((age - 20) * 0.8 + np.random.normal(5, 8, num_samples), 0.5, 40)
    existing_investments = np.round((surplus * inv_factor) / 10000) * 10000

    # 7. Monthly SIP / Investment (10% to 80% of surplus)
    sip_ratio = np.clip(np.random.beta(3, 2, num_samples) * 0.75, 0.1, 0.85)
    monthly_investment = np.round((surplus * sip_ratio) / 1000) * 1000

    # 8. Horizon (Years)
    horizon_years = np.clip(np.random.gamma(3, 3.5, num_samples).astype(int), 1, 35)

    # 9. Psychometric Risk Tolerance (1 - 10)
    risk_tolerance = np.clip(np.random.normal(5.6, 2.3, num_samples).round().astype(int), 1, 10)

    # 10. Perceived Income Stability (1 - 10)
    income_stability = np.clip(np.random.normal(6.5, 2.1, num_samples).round().astype(int), 1, 10)

    # 11. Dependents (0 - 4)
    dependents = np.clip(np.random.poisson(1.3, num_samples), 0, 5)

    # Compute Engineered Features
    savings_rate = np.clip(surplus / monthly_income, 0.0, 1.0)
    expense_ratio_feat = np.clip(monthly_expenses / monthly_income, 0.0, 2.0)
    emergency_months = np.clip(current_savings / np.maximum(outflow, 1), 0.0, 36.0)
    debt_burden = np.clip(monthly_emi / monthly_income, 0.0, 1.0)
    net_worth_months = np.clip((current_savings + existing_investments) / np.maximum(outflow, 1), 0.0, 120.0)

    # Ground-Truth Risk Capacity & Willingness Score (Standard Financial Planning Formula)
    # Combines Risk Willingness (psychometric) with Financial Risk Capacity (buffers & horizon)
    willingness = (risk_tolerance - 1) / 9.0  # [0, 1]
    
    capacity = (
        0.28 * np.clip(horizon_years / 20.0, 0, 1) +
        0.24 * np.clip((65 - age) / 40.0, 0, 1) +
        0.18 * np.clip(savings_rate / 0.35, 0, 1) +
        0.14 * np.clip(emergency_months / 10.0, 0, 1) +
        0.10 * np.clip(income_stability / 10.0, 0, 1) +
        0.10 * np.clip((0.45 - debt_burden) / 0.45, 0, 1) -
        0.04 * np.clip(dependents / 3.0, 0, 1)
    )
    capacity = np.clip(capacity, 0.0, 1.0)

    # Total Risk Index (50% willingness, 50% capacity) + realistic noise
    risk_index = 0.48 * willingness + 0.52 * capacity + np.random.normal(0, 0.06, num_samples)
    risk_index = np.clip(risk_index, 0.0, 1.0)

    # Categorize into 3 Ground-Truth Classes
    risk_class = pd.cut(
        risk_index,
        bins=[-0.1, 0.38, 0.64, 1.1],
        labels=["Conservative", "Moderate", "Aggressive"]
    )

    df = pd.DataFrame({
        "age": age,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_emi": monthly_emi,
        "current_savings": current_savings,
        "existing_investments": existing_investments,
        "monthly_investment": monthly_investment,
        "horizon_years": horizon_years,
        "risk_tolerance": risk_tolerance,
        "income_stability": income_stability,
        "dependents": dependents,
        "savings_rate": np.round(savings_rate, 4),
        "expense_ratio": np.round(expense_ratio_feat, 4),
        "emergency_months": np.round(emergency_months, 2),
        "debt_burden": np.round(debt_burden, 4),
        "net_worth_months": np.round(net_worth_months, 2),
        "risk_class": risk_class,
    })

    return df

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    df = generate_investor_dataset(num_samples=5000)
    csv_path = "ml/data/investor_profiles.csv"
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} synthetic investor profiles -> {csv_path}")
    print("Class distribution:")
    print(df["risk_class"].value_counts(normalize=True).round(3))
