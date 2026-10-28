import { z } from "zod";

/** Domain types for the FinAdvisor XAI financial advisory engine. */

export type RiskClass = "Conservative" | "Moderate" | "Aggressive";

export type GoalKind =
  | "House"
  | "Higher Education"
  | "Emergency Fund"
  | "Retirement"
  | "Car"
  | "Travel"
  | "Other";

export type GoalPriority = "High" | "Medium" | "Low";

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  targetAmount: number;
  years: number;
  /** Amount already saved towards this goal in INR. */
  saved: number;
  priority: GoalPriority;
}

export const GoalSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().trim().min(2, "Goal name must be at least 2 characters"),
  kind: z.enum([
    "House",
    "Higher Education",
    "Emergency Fund",
    "Retirement",
    "Car",
    "Travel",
    "Other",
  ]),
  targetAmount: z.number().positive("Target amount must be greater than zero"),
  years: z.number().positive("Years must be greater than zero").max(60, "Years cannot exceed 60"),
  saved: z.number().min(0, "Saved amount cannot be negative"),
  priority: z.enum(["High", "Medium", "Low"]),
});

export interface FinancialProfile {
  name: string;
  age: number;
  occupation: string;
  dependents: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  currentSavings: number;
  existingInvestments: number;
  monthlyInvestment: number;
  horizonYears: number;
  /** Self-declared risk tolerance, 1 (very low) – 10 (very high). */
  riskTolerance: number;
  /** Perceived income stability, 1 (unstable) – 10 (very stable). */
  incomeStability: number;
  goals: Goal[];
}

export const FinancialProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  age: z
    .number()
    .int("Age must be an integer")
    .min(18, "Age must be between 18 and 100")
    .max(100, "Age must be between 18 and 100"),
  occupation: z.string().trim().min(1, "Occupation is required"),
  dependents: z
    .number()
    .int("Dependents must be an integer")
    .min(0, "Dependents cannot be negative")
    .max(15, "Dependents cannot exceed 15"),
  monthlyIncome: z.number().min(1, "Monthly income must be greater than zero"),
  monthlyExpenses: z.number().min(0, "Monthly expenses cannot be negative"),
  monthlyEmi: z.number().min(0, "Monthly EMI cannot be negative"),
  currentSavings: z.number().min(0, "Current savings cannot be negative"),
  existingInvestments: z.number().min(0, "Existing investments cannot be negative"),
  monthlyInvestment: z.number().min(0, "Monthly investment cannot be negative"),
  horizonYears: z
    .number()
    .int("Horizon must be an integer")
    .min(1, "Investment horizon must be at least 1 year")
    .max(60, "Horizon cannot exceed 60 years"),
  riskTolerance: z
    .number()
    .int("Risk tolerance must be an integer")
    .min(1, "Risk tolerance must be 1 to 10")
    .max(10, "Risk tolerance must be 1 to 10"),
  incomeStability: z
    .number()
    .int("Income stability must be an integer")
    .min(1, "Income stability must be 1 to 10")
    .max(10, "Income stability must be 1 to 10"),
  goals: z.array(GoalSchema).default([]),
});

export interface HealthMetric {
  key: string;
  label: string;
  value: number;
  display: string;
  score: number; // 0-100 sub-score
  weight: number;
  status: "strong" | "fair" | "weak";
  hint: string;
}

export interface HealthReport {
  score: number;
  grade: "Excellent" | "Good" | "Fair" | "Needs work" | "Critical";
  metrics: HealthMetric[];
  strengths: HealthMetric[];
  weaknesses: HealthMetric[];
  surplus: number;
  savingsRate: number;
  emergencyMonths: number;
  expenseRatio: number;
  debtBurden: number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: number;
  display: string;
  /** SHAP-style signed contribution to the predicted class score. */
  contribution: number;
}

export interface RiskPrediction {
  riskClass: RiskClass;
  scores: Record<RiskClass, number>;
  probabilities: Record<RiskClass, number>;
  confidence: number;
  baseValue: number;
  contributions: FeatureContribution[];
  narrative: string;
}

export interface AllocationSlice {
  asset: string;
  percent: number;
  expectedReturn: number;
  rationale: string;
}

export interface Recommendation {
  allocation: AllocationSlice[];
  expectedReturn: number;
  volatility: number;
  monthlyInvestment: number;
  notes: string[];
}

export interface ModelBenchmark {
  model: string;
  accuracy: number;
  f1: number;
  rocAuc: number;
  selected: boolean;
  notes: string;
}
