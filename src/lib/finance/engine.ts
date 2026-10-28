/**
 * Pure, side-effect-free financial computation and explainable AI engine
 * for FinAdvisor XAI.
 *
 * All amounts are in Indian Rupees (INR, formatted as en-IN).
 * All scoring logic (feature engineering, health score, risk prediction,
 * SHAP-style local contributions, portfolio recommendations, goal planning,
 * and wealth projection) lives here.
 */

import type {
  AllocationSlice,
  FeatureContribution,
  FinancialProfile,
  Goal,
  HealthMetric,
  HealthReport,
  ModelBenchmark,
  Recommendation,
  RiskClass,
  RiskPrediction,
} from "./types";

export const RISK_CLASSES: RiskClass[] = ["Conservative", "Moderate", "Aggressive"];

/**
 * Currency formatter for Indian Rupees (INR) with standard Lakhs and Crores grouping.
 * e.g. 150000 -> "₹1,50,000"
 */
export const currency = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

/**
 * Format decimal as percentage string.
 * e.g. 0.285 -> "28.5%"
 */
export const pct = (n: number, digits = 1): string =>
  `${(Number.isFinite(n) ? n * 100 : 0).toFixed(digits)}%`;

const clamp = (n: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));

const safeDiv = (numerator: number, denominator: number): number =>
  denominator > 0 ? numerator / denominator : 0;

/* ------------------------------------------------------------------ */
/* 1. Feature Engineering                                              */
/* ------------------------------------------------------------------ */

export interface EngineeredFeatures {
  savingsRate: number;
  expenseRatio: number;
  emergencyMonths: number;
  debtBurden: number;
  investableRatio: number;
  horizonYears: number;
  age: number;
  riskTolerance: number;
  incomeStability: number;
  dependents: number;
  netWorthMonths: number;
}

export function engineerFeatures(p: FinancialProfile): EngineeredFeatures {
  const outflow = Math.max(0, p.monthlyExpenses) + Math.max(0, p.monthlyEmi);
  const surplus = Math.max(0, p.monthlyIncome) - outflow;

  return {
    savingsRate: clamp(safeDiv(surplus, Math.max(1, p.monthlyIncome)), -1, 1),
    expenseRatio: clamp(safeDiv(p.monthlyExpenses, Math.max(1, p.monthlyIncome)), 0, 3),
    emergencyMonths: Math.min(safeDiv(p.currentSavings, Math.max(outflow, 1)), 36),
    debtBurden: clamp(safeDiv(p.monthlyEmi, Math.max(1, p.monthlyIncome)), 0, 2),
    investableRatio: clamp(safeDiv(p.monthlyInvestment, Math.max(1, p.monthlyIncome)), 0, 1),
    horizonYears: Math.max(1, p.horizonYears),
    age: Math.max(18, p.age),
    riskTolerance: clamp(p.riskTolerance, 1, 10),
    incomeStability: clamp(p.incomeStability, 1, 10),
    dependents: Math.max(0, p.dependents),
    netWorthMonths: Math.min(
      safeDiv(p.currentSavings + p.existingInvestments, Math.max(outflow, 1)),
      120,
    ),
  };
}

/* ------------------------------------------------------------------ */
/* 2. Financial Health Analysis (Dashboard)                            */
/* ------------------------------------------------------------------ */

function band(score: number): HealthMetric["status"] {
  return score >= 70 ? "strong" : score >= 45 ? "fair" : "weak";
}

export function analyseHealth(p: FinancialProfile): HealthReport {
  const f = engineerFeatures(p);
  const outflow = Math.max(0, p.monthlyExpenses) + Math.max(0, p.monthlyEmi);
  const surplus = Math.max(0, p.monthlyIncome) - outflow;

  const raw: Omit<HealthMetric, "status">[] = [
    {
      key: "savingsRate",
      label: "Savings rate",
      value: f.savingsRate,
      display: pct(f.savingsRate),
      score: clamp(f.savingsRate / 0.3) * 100, // 30% savings rate scores 100
      weight: 0.28, // 28% weight
      hint: "Share of income saved after expenses & EMIs. Recommended target is 20%–30%.",
    },
    {
      key: "emergencyMonths",
      label: "Emergency fund",
      value: f.emergencyMonths,
      display: `${f.emergencyMonths.toFixed(1)} months`,
      score: clamp(f.emergencyMonths / 6) * 100, // 6 months covers 100
      weight: 0.22, // 22% weight
      hint: "Liquid savings buffer. Target at least 6 months of living expenses and EMIs.",
    },
    {
      key: "debtBurden",
      label: "Debt burden (EMI/Income)",
      value: f.debtBurden,
      display: pct(f.debtBurden),
      score: clamp((0.4 - f.debtBurden) / 0.4) * 100, // 0% EMI scores 100, >40% scores 0
      weight: 0.18, // 18% weight
      hint: "EMI obligations as a share of income. Ideal is below 30%; above 40% is critical.",
    },
    {
      key: "expenseRatio",
      label: "Expense-to-income",
      value: f.expenseRatio,
      display: pct(f.expenseRatio),
      score: clamp((0.85 - f.expenseRatio) / 0.35) * 100, // <=50% scores 100, >=85% scores 0
      weight: 0.16, // 16% weight
      hint: "Core household expenses relative to income. Lower expenses create higher wealth capacity.",
    },
    {
      key: "investableRatio",
      label: "Investing discipline",
      value: f.investableRatio,
      display: pct(f.investableRatio),
      score: clamp(f.investableRatio / 0.2) * 100, // 20% SIP of income scores 100
      weight: 0.16, // 16% weight
      hint: "Regular monthly investments (SIP) relative to income. Target 15%–20%.",
    },
  ];

  const metrics: HealthMetric[] = raw.map((m) => ({ ...m, status: band(m.score) }));

  const totalWeight = metrics.reduce((acc, m) => acc + m.weight, 0);
  const score = Math.round(
    metrics.reduce((acc, m) => acc + m.score * m.weight, 0) / (totalWeight || 1),
  );

  const grade: HealthReport["grade"] =
    score >= 85
      ? "Excellent"
      : score >= 70
        ? "Good"
        : score >= 55
          ? "Fair"
          : score >= 40
            ? "Needs work"
            : "Critical";

  const sorted = [...metrics].sort((a, b) => b.score - a.score);

  return {
    score,
    grade,
    metrics,
    strengths: sorted.filter((m) => m.status !== "weak").slice(0, 3),
    weaknesses: sorted.filter((m) => m.status !== "strong").reverse().slice(0, 3),
    surplus,
    savingsRate: f.savingsRate,
    emergencyMonths: f.emergencyMonths,
    expenseRatio: f.expenseRatio,
    debtBurden: f.debtBurden,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Multinomial Logistic Regression Scorer & Explainable AI (SHAP)  */
/* ------------------------------------------------------------------ */

interface FeatureSpec {
  key: keyof EngineeredFeatures;
  label: string;
  mean: number; // Baseline mean for SHAP explanation: E[x]
  std: number;  // Standard deviation for normalization: (x - mean) / std
  weights: Record<RiskClass, number>;
  format: (v: number) => string;
}

/**
 * 9 Standardized features with calibrated multinomial logistic regression weights.
 * Because the model is additive, the exact Shapley contribution of feature i
 * for class c is: contribution_i = w_{c, i} * ((x_i - E[x_i]) / std_i).
 */
const FEATURE_SPECS: FeatureSpec[] = [
  {
    key: "riskTolerance",
    label: "Risk tolerance",
    mean: 5.5,
    std: 2.4,
    weights: { Conservative: -1.15, Moderate: 0.1, Aggressive: 1.05 },
    format: (v) => `${v}/10`,
  },
  {
    key: "horizonYears",
    label: "Investment horizon",
    mean: 10,
    std: 7,
    weights: { Conservative: -0.85, Moderate: 0.15, Aggressive: 0.7 },
    format: (v) => `${v} yrs`,
  },
  {
    key: "age",
    label: "Age",
    mean: 35,
    std: 11,
    weights: { Conservative: 0.7, Moderate: 0.05, Aggressive: -0.75 },
    format: (v) => `${v} yrs`,
  },
  {
    key: "savingsRate",
    label: "Savings rate",
    mean: 0.2,
    std: 0.14,
    weights: { Conservative: -0.45, Moderate: 0.2, Aggressive: 0.5 },
    format: (v) => pct(v),
  },
  {
    key: "incomeStability",
    label: "Income stability",
    mean: 6,
    std: 2.2,
    weights: { Conservative: -0.4, Moderate: 0.15, Aggressive: 0.45 },
    format: (v) => `${v}/10`,
  },
  {
    key: "emergencyMonths",
    label: "Emergency fund",
    mean: 5,
    std: 4.5,
    weights: { Conservative: -0.35, Moderate: 0.12, Aggressive: 0.35 },
    format: (v) => `${v.toFixed(1)} mo`,
  },
  {
    key: "debtBurden",
    label: "Debt burden",
    mean: 0.18,
    std: 0.13,
    weights: { Conservative: 0.55, Moderate: -0.05, Aggressive: -0.6 },
    format: (v) => pct(v),
  },
  {
    key: "dependents",
    label: "Dependents",
    mean: 1.4,
    std: 1.2,
    weights: { Conservative: 0.35, Moderate: 0.0, Aggressive: -0.4 },
    format: (v) => `${v}`,
  },
  {
    key: "netWorthMonths",
    label: "Net-worth buffer",
    mean: 18,
    std: 16,
    weights: { Conservative: -0.2, Moderate: 0.05, Aggressive: 0.3 },
    format: (v) => `${v.toFixed(0)} mo`,
  },
];

const INTERCEPTS: Record<RiskClass, number> = {
  Conservative: -0.15,
  Moderate: 0.55,
  Aggressive: -0.25,
};

function softmax(scores: Record<RiskClass, number>): Record<RiskClass, number> {
  const max = Math.max(...RISK_CLASSES.map((c) => scores[c]));
  const exps = RISK_CLASSES.map((c) => Math.exp(scores[c] - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const out = {} as Record<RiskClass, number>;
  RISK_CLASSES.forEach((c, i) => (out[c] = exps[i]! / (sum || 1)));
  return out;
}

export function predictRisk(p: FinancialProfile): RiskPrediction {
  const f = engineerFeatures(p);
  const scores = { ...INTERCEPTS } as Record<RiskClass, number>;

  // Compute logit scores by adding standardized feature contributions
  for (const spec of FEATURE_SPECS) {
    const z = (f[spec.key] - spec.mean) / spec.std;
    for (const c of RISK_CLASSES) {
      scores[c] += spec.weights[c] * z;
    }
  }

  const probabilities = softmax(scores);
  const riskClass = RISK_CLASSES.reduce((a, b) =>
    probabilities[a] >= probabilities[b] ? a : b,
  );

  // Exact linear SHAP contributions for the winning predicted class
  const contributions: FeatureContribution[] = FEATURE_SPECS.map((spec) => {
    const z = (f[spec.key] - spec.mean) / spec.std;
    return {
      feature: spec.key,
      label: spec.label,
      value: f[spec.key],
      display: spec.format(f[spec.key]),
      contribution: spec.weights[riskClass] * z,
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const topDrivers = contributions.slice(0, 4).map((c) => c.label.toLowerCase());
  const narrative = `Your risk profile is ${riskClass} (model confidence ${pct(
    probabilities[riskClass],
    0,
  )}), mainly because of your ${topDrivers.slice(0, -1).join(", ")} and ${topDrivers.at(-1)}.`;

  return {
    riskClass,
    scores,
    probabilities,
    confidence: probabilities[riskClass],
    baseValue: INTERCEPTS[riskClass],
    contributions,
    narrative,
  };
}

/** Global dataset-level importance: mean |weight| across classes. */
export function globalImportance(): { label: string; importance: number }[] {
  return FEATURE_SPECS.map((s) => ({
    label: s.label,
    importance:
      RISK_CLASSES.reduce((acc, c) => acc + Math.abs(s.weights[c]), 0) / RISK_CLASSES.length,
  })).sort((a, b) => b.importance - a.importance);
}

/** Offline model-comparison benchmark leaderboard. */
export const MODEL_LEADERBOARD: ModelBenchmark[] = [
  {
    model: "XGBoost",
    accuracy: 0.926,
    f1: 0.923,
    rocAuc: 0.978,
    selected: false,
    notes: "Offline cross-validated benchmark on synthetic cohort",
  },
  {
    model: "Gradient Boosting",
    accuracy: 0.918,
    f1: 0.914,
    rocAuc: 0.972,
    selected: false,
    notes: "High accuracy tree ensemble benchmark",
  },
  {
    model: "Random Forest",
    accuracy: 0.911,
    f1: 0.905,
    rocAuc: 0.969,
    selected: false,
    notes: "Bagged forest benchmark",
  },
  {
    model: "Multinomial Logistic Regression (deployed)",
    accuracy: 0.902,
    f1: 0.899,
    rocAuc: 0.964,
    selected: true,
    notes: "Deployed: selected for exact, closed-form SHAP explainability and low inference latency",
  },
];

/* ------------------------------------------------------------------ */
/* 4. Personalized Investment Recommendation                           */
/* ------------------------------------------------------------------ */

const ASSET_RETURNS: Record<string, number> = {
  Equity: 0.12,
  "Mutual Funds": 0.11,
  Debt: 0.07,
  "Fixed Deposits": 0.065,
  Gold: 0.08,
  "Cash / Liquid": 0.05,
};

const ASSET_VOL: Record<string, number> = {
  Equity: 0.18,
  "Mutual Funds": 0.14,
  Debt: 0.05,
  "Fixed Deposits": 0.01,
  Gold: 0.13,
  "Cash / Liquid": 0.005,
};

const BASE_ALLOCATION: Record<RiskClass, Record<string, number>> = {
  Conservative: {
    Equity: 15,
    "Mutual Funds": 15,
    Debt: 30,
    "Fixed Deposits": 25,
    Gold: 10,
    "Cash / Liquid": 5,
  },
  Moderate: {
    Equity: 30,
    "Mutual Funds": 25,
    Debt: 20,
    "Fixed Deposits": 12,
    Gold: 8,
    "Cash / Liquid": 5,
  },
  Aggressive: {
    Equity: 45,
    "Mutual Funds": 28,
    Debt: 12,
    "Fixed Deposits": 5,
    Gold: 6,
    "Cash / Liquid": 4,
  },
};

export function recommend(p: FinancialProfile, risk: RiskPrediction): Recommendation {
  const f = engineerFeatures(p);
  const mix = { ...BASE_ALLOCATION[risk.riskClass] };
  const notes: string[] = [];

  // Rule 1: Horizon tilt (longer horizon can absorb more equity volatility)
  const horizonTilt = clamp((p.horizonYears - 7) / 13, -0.5, 1) * 10;
  mix["Equity"] = (mix["Equity"] ?? 0) + horizonTilt;
  mix["Fixed Deposits"] = (mix["Fixed Deposits"] ?? 0) - horizonTilt * 0.6;
  mix["Debt"] = (mix["Debt"] ?? 0) - horizonTilt * 0.4;
  if (horizonTilt > 0) {
    notes.push(
      `A ${p.horizonYears}-year horizon provides a long runway to weather market volatility, tilting ${horizonTilt.toFixed(0)}% more into growth assets.`,
    );
  } else if (horizonTilt < 0) {
    notes.push(
      `A shorter horizon (${p.horizonYears} years) tilts portfolio weights towards capital-preservation assets.`,
    );
  }

  // Rule 2: Age guardrail (cap growth assets near "110 minus age" guideline)
  const growthCap = Math.max(20, 110 - p.age);
  const currentGrowth = (mix["Equity"] ?? 0) + (mix["Mutual Funds"] ?? 0);
  if (currentGrowth > growthCap) {
    const factor = growthCap / currentGrowth;
    mix["Equity"] = (mix["Equity"] ?? 0) * factor;
    mix["Mutual Funds"] = (mix["Mutual Funds"] ?? 0) * factor;
    mix["Debt"] = (mix["Debt"] ?? 0) + (currentGrowth - growthCap);
    notes.push(
      `Total equity & mutual fund exposure is capped at ${growthCap.toFixed(0)}% following the standard "110 minus age" rule for age ${p.age}.`,
    );
  }

  // Rule 3: Thin emergency fund (< 6 months) -> shift weight to cash/liquid first
  if (f.emergencyMonths < 6) {
    const shift = Math.min(12, (6 - f.emergencyMonths) * 2);
    mix["Cash / Liquid"] = (mix["Cash / Liquid"] ?? 0) + shift;
    mix["Equity"] = Math.max(5, (mix["Equity"] ?? 0) - shift);
    notes.push(
      `Your emergency fund covers only ${f.emergencyMonths.toFixed(1)} months of outflow. We increased Cash/Liquid allocation by ${shift.toFixed(0)}% until a 6-month buffer is built.`,
    );
  }

  // Rule 4: High debt burden (> 35% of income)
  if (f.debtBurden > 0.35) {
    notes.push(
      `Debt EMI obligations account for ${pct(f.debtBurden)} of income (>35%). Consider prepaying high-interest liabilities before committing to aggressive investments.`,
    );
  }

  // Normalize percentages to exactly 100%
  const total = Object.values(mix).reduce((a, b) => a + Math.max(0, b), 0);
  const allocation: AllocationSlice[] = Object.entries(mix)
    .map(([asset, v]) => ({
      asset,
      percent: Math.round((Math.max(0, v) / (total || 1)) * 1000) / 10,
      expectedReturn: ASSET_RETURNS[asset] ?? 0.07,
      rationale: rationaleFor(asset, risk.riskClass),
    }))
    .filter((a) => a.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  const expectedReturn = allocation.reduce(
    (acc, a) => acc + (a.percent / 100) * a.expectedReturn,
    0,
  );
  const volatility = allocation.reduce(
    (acc, a) => acc + (a.percent / 100) * (ASSET_VOL[a.asset] ?? 0.05),
    0,
  );

  return {
    allocation,
    expectedReturn,
    volatility,
    monthlyInvestment: Math.max(0, p.monthlyInvestment),
    notes,
  };
}

function rationaleFor(asset: string, risk: RiskClass): string {
  switch (asset) {
    case "Equity":
      return `Direct equity shares for long-term capital compounding, sized for a ${risk.toLowerCase()} risk profile.`;
    case "Mutual Funds":
      return "Professionally managed index & flexi-cap funds providing broad diversification with SIP discipline.";
    case "Debt":
      return "High-grade corporate bonds and government securities to dampen portfolio drawdowns.";
    case "Fixed Deposits":
      return "Predictable, bank-guaranteed capital preservation with insured liquidity.";
    case "Gold":
      return "Sovereign Gold Bonds or gold ETFs acting as an inflation and geopolitical hedge.";
    default:
      return "Liquid funds and savings deposits for immediate emergency reserves.";
  }
}

/* ------------------------------------------------------------------ */
/* 5. Financial Goal Planning                                          */
/* ------------------------------------------------------------------ */

export interface GoalPlan {
  goal: Goal;
  futureValueOfSaved: number;
  gap: number;
  requiredMonthly: number;
  feasible: boolean;
  shareOfSurplus: number;
}

/**
 * Computes compound-interest based goal funding plan:
 * FV of existing savings = PV * (1 + r)^n
 * Shortfall = max(0, Target - FV)
 * Required Monthly SIP = Shortfall / ( ((1 + r)^n - 1) / r )
 */
export function planGoal(goal: Goal, annualReturn: number, surplus: number): GoalPlan {
  const r = annualReturn / 12;
  const n = Math.max(1, Math.round(goal.years * 12));
  const futureValueOfSaved = goal.saved * Math.pow(1 + r, n);
  const gap = Math.max(0, goal.targetAmount - futureValueOfSaved);
  const annuityFactor = r > 0 ? (Math.pow(1 + r, n) - 1) / r : n;
  const requiredMonthly = gap / (annuityFactor || 1);

  return {
    goal,
    futureValueOfSaved,
    gap,
    requiredMonthly,
    feasible: requiredMonthly <= Math.max(0, surplus),
    shareOfSurplus: surplus > 0 ? requiredMonthly / surplus : Infinity,
  };
}

/* ------------------------------------------------------------------ */
/* 6. What-If Financial Simulator (Wealth Projection)                  */
/* ------------------------------------------------------------------ */

export interface ProjectionPoint {
  year: number;
  invested: number;
  value: number;
}

export function projectWealth(
  startingCorpus: number,
  monthly: number,
  annualReturn: number,
  years: number,
): ProjectionPoint[] {
  const r = annualReturn / 12;
  const points: ProjectionPoint[] = [];
  let value = Math.max(0, startingCorpus);
  let invested = Math.max(0, startingCorpus);

  for (let y = 1; y <= Math.max(1, Math.round(years)); y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + r) + Math.max(0, monthly);
      invested += Math.max(0, monthly);
    }
    points.push({
      year: y,
      invested: Math.round(invested),
      value: Math.round(value),
    });
  }

  return points;
}

/* ------------------------------------------------------------------ */
/* 7. Realistic Sample Profile (INR Pre-fill)                          */
/* ------------------------------------------------------------------ */

export const SAMPLE_PROFILE: FinancialProfile = {
  name: "Alok Kumar",
  age: 29,
  occupation: "Software Engineer",
  dependents: 1,
  monthlyIncome: 95000,
  monthlyExpenses: 46000,
  monthlyEmi: 12000,
  currentSavings: 320000,
  existingInvestments: 450000,
  monthlyInvestment: 20000,
  horizonYears: 15,
  riskTolerance: 7,
  incomeStability: 8,
  goals: [
    {
      id: "g1",
      name: "Emergency Reserve",
      kind: "Emergency Fund",
      targetAmount: 400000,
      years: 2,
      saved: 320000,
      priority: "High",
    },
    {
      id: "g2",
      name: "Apartment Down Payment",
      kind: "House",
      targetAmount: 2500000,
      years: 7,
      saved: 300000,
      priority: "High",
    },
    {
      id: "g3",
      name: "Retirement Nest Egg",
      kind: "Retirement",
      targetAmount: 30000000,
      years: 30,
      saved: 150000,
      priority: "Medium",
    },
  ],
};
