# FinAdvisor XAI

> **Explainable AI-Driven Personalized Financial Planning & Investment Advisory System**  
> *A full-stack fintech platform combining statistical machine learning, closed-form SHAP explainability, rule-guarded asset allocation, and goal planning for Indian retail investors.*

---

## 📌 Overview

**FinAdvisor XAI** is a major portfolio-ready full-stack fintech platform designed to make personalized wealth advisory completely transparent, explainable, and accessible. Built for Indian retail investors (with native Indian Rupee ₹ INR and `en-IN` Lakhs/Crores formatting), it evaluates personal income, expenses, debt EMIs, existing assets, risk tolerance, and life goals to deliver mathematically sound, explainable financial recommendations.

Unlike black-box financial robo-advisors, FinAdvisor XAI computes **exact local Shapley (SHAP) feature contributions** for every prediction, showing users exactly which financial metrics (e.g., horizon, savings rate, age, debt burden) drove their classification and recommended asset mix.

---

## 🌟 Key Highlights & Engineering Features

### 1. Robust Authentication & User Profile
- **Supabase Auth Integration**: Email & password authentication with state persistence.
- **Demo Mode**: Instant 1-click exploration with realistic sample Indian investor profiles.
- **Row Level Security (RLS)**: PostgreSQL policies isolate user records (`auth.uid() = id`).
- **Strict Zod Guardrails**: Zero-division prevention, non-negative income/expense constraints, age (18–100), and slider bounds.

### 2. Multi-Pillar Financial Health Engine
Computes an objective **Financial Health Score (0–100)** from five weighted pillars:
- **Savings Rate (28% weight)**: Monthly surplus divided by income (target 20%–30%).
- **Emergency Reserve (22% weight)**: Liquid fund buffer in months of living outflow (target ≥ 6 months).
- **Debt Burden (18% weight)**: Debt EMI obligations relative to income (critical threshold > 35%–40%).
- **Expense-to-Income Ratio (16% weight)**: Core living expenses as a fraction of gross earnings.
- **Investing Discipline (16% weight)**: Regular monthly SIP relative to income.
- **Grading Scale**: Excellent (≥85), Good (70–84), Fair (55–69), Needs work (40–54), Critical (<40).

### 3. Explainable Risk Profiling with Multinomial Logistic Regression
- **Classifies Users into 3 Tiers**: `Conservative`, `Moderate`, or `Aggressive`.
- **9 Standardized Features**: Risk tolerance, investment horizon, age, savings rate, income stability, emergency buffer, debt burden, dependents, and net-worth runway.
- **Calibrated Posterior Probabilities**: Softmax normalization yields confident class probabilities.
- **Radar & Bar Charts**: Multi-dimensional radar fingerprint and probability distribution charts.
- **Dynamic Natural Language Explanation**: Synthesizes top drivers into an intuitive narrative.

### 4. Explainable AI (XAI) & SHAP Attributions
- **Exact Closed-Form SHAP Contributions**: Because the model is additive, the exact Shapley contribution of feature $i$ for class $c$ is:
  $$\phi_{c, i} = w_{c, i} \times \left( \frac{x_i - \mathbb{E}[x_i]}{\sigma_i} \right)$$
- **Local Explanation Waterfall**: Signed bar chart indicating which factors pushed toward or away from the predicted class.
- **Global Feature Importance**: Dataset-level ranking based on mean absolute weights across classes: $\frac{1}{C}\sum_c |w_{c, i}|$.
- **Offline Model Benchmark Leaderboard**: Compares accuracy, F1-score, and ROC-AUC across **XGBoost (92.6%)**, **Gradient Boosting (91.8%)**, **Random Forest (91.1%)**, and the deployed **Logistic Regression (90.2%)** selected for real-time exact explainability.

### 5. Rule-Guarded Investment Recommendations
Allocates capital across 6 major asset classes:
**Equity, Mutual Funds, Debt, Fixed Deposits, Gold, Cash/Liquid**.
- **Horizon Tilt**: Longer investment horizons dynamically tilt weight into growth assets.
- **110 Minus Age Guideline**: Automatically caps total equity & mutual fund exposure near `110 - age`.
- **Liquidity Guardrail**: If emergency fund < 6 months, shifts allocation toward Cash/Liquid funds first.
- **Debt Warning**: If monthly debt EMIs exceed 35% of income, prioritizes debt prepayment.

### 6. Compound-Interest Financial Goal Planner
- **Supported Goals**: House, Higher Education, Emergency Fund, Retirement, Car, Travel, Other.
- **Mathematical Formulations**:
  - Future Value of Saved Corpus: $\text{FV} = \text{PV} \times (1 + r)^n$
  - Shortfall to Fund: $\text{Gap} = \max(0, \text{Target} - \text{FV})$
  - Required Monthly SIP: $\text{SIP} = \frac{\text{Gap}}{\frac{(1 + r)^n - 1}{r}}$
- **Surplus Feasibility**: Compares required SIP against monthly disposable cash flow and assigns feasibility status (`On track` vs `Stretch`).

### 7. What-If Financial Simulator
- Real-time interactive sliders for Monthly Income, Living Expenses, Monthly SIP, Horizon, and Risk Tolerance.
- Recomputes health score, risk class, and asset allocation live without mutating the database profile.
- Multi-curve line chart projecting wealth accumulation (Current Saved Plan vs What-If Scenario) year by year.

### 8. AI Financial Assistant
- Context-aware chatbot with suggested prompt chips.
- Runs via a server function using Lovable AI Gateway / Gemini API so secret keys never touch client code.
- **Intelligent Offline Fallback Engine**: Generates context-aware, prudent answers under 200 words even when no external API key is present.
- Adheres to SEBI guidelines: never guarantees returns and emphasizes certified advisory for execution.

### 9. Multi-Format Reports & PDF Export
- Executive financial summary covering health scorecard, risk profile, asset mix, and goal status.
- **1-Click JSON Export**: Machine-readable full data schema.
- **1-Click CSV Export**: Formatted spreadsheet rows.
- **Print / Save as PDF**: Print-optimized stylesheet (`@media print`) that removes browser chrome and renders a clean PDF.

---

## 🏗️ System Architecture

```
                                  [ User Browser ]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
            [ TanStack Router ]                       [ Supabase Auth ]
            (File-based routes)                      (Email / Password / Demo)
                    │                                         │
                    ▼                                         ▼
        [ FinAdvisor AppShell ]                       [ PostgreSQL + RLS ]
                    │                                (Profiles Table with RLS)
        ┌───────────┴───────────┐
        ▼                       ▼
[ Pure Scoring Engine ]   [ Server Functions ]
  ├── Feature Engineering   └── askAssistant (AI Gateway / Local Fallback)
  ├── Health Score (0-100)
  ├── Multinomial Classifier
  ├── Exact Linear SHAP
  ├── Rule-Guarded Portfolio
  └── Goal SIP Planner
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19 + TypeScript, TanStack Start, TanStack Router |
| **Bundler & Build Tool** | Vite v8, Nitro (Cloudflare / Node SSR runtime) |
| **Styling & Components** | Tailwind CSS v4, shadcn/ui design tokens, Radix UI primitives |
| **Data Visualization** | Recharts (Responsive Pie, Area, Bar, Line, Radar charts) |
| **Icons & Notifications** | Lucide React, Sonner toasts |
| **Form & Validation** | Zod v3, React Hook Form |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security policies) |
| **AI Integration** | Lovable AI Gateway / Gemini API via TanStack Server Functions |

---

## 📁 Project Directory Structure

```
personal_finance_advisor/
├── public/                     # Static assets & favicon
├── src/
│   ├── components/
│   │   ├── app/                # AppShell, StatCard
│   │   └── ui/                 # Accessible Radix/shadcn UI components
│   ├── integrations/
│   │   └── supabase/           # Supabase client, types & middleware
│   ├── lib/
│   │   ├── ai.functions.ts     # AI Assistant Server Function with fallback engine
│   │   ├── utils.ts            # Classnames & styling utilities
│   │   └── finance/
│   │       ├── engine.ts       # Pure side-effect-free financial & ML math engine
│   │       ├── store.tsx       # React Profile & Session Context with Supabase sync
│   │       └── types.ts        # Domain models, Zod schemas & types
│   ├── routes/                 # File-based TanStack routes
│   │   ├── __root.tsx          # Root layout, error boundary, 404, fonts & meta
│   │   ├── index.tsx           # / (Financial Health Dashboard)
│   │   ├── auth.tsx            # /auth (Login, Register & Demo mode)
│   │   ├── profile.tsx         # /profile (Financial profile data capture)
│   │   ├── risk.tsx            # /risk (Multinomial risk profiling & radar)
│   │   ├── recommendations.tsx # /recommendations (Rule-guarded asset allocation)
│   │   ├── goals.tsx           # /goals (Goal planning with compound SIP formula)
│   │   ├── simulator.tsx       # /simulator (What-if scenario line simulator)
│   │   ├── explainability.tsx  # /explainability (SHAP local/global XAI dashboard)
│   │   ├── assistant.tsx       # /assistant (AI chat interface with context)
│   │   └── reports.tsx         # /reports (Executive report, JSON, CSV & PDF print)
│   ├── router.tsx              # Router instantiation
│   └── styles.css              # Tailwind v4 theme, oklch tokens & print media
├── supabase/
│   └── migrations/             # SQL migration files with RLS schemas
├── .env.example                # Sample environment variables
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite & TanStack Router config
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher (v22/v24 recommended)
- **Package Manager**: npm, pnpm, or bun

### 2. Clone and Install
```bash
git clone https://github.com/alokkumar345/personal_finance_advisor.git
cd personal_finance_advisor

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file from the provided `.env.example`:
```bash
cp .env.example .env
```
Default parameters are pre-configured. To connect your own Supabase project:
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"

# Optional AI Gateway key:
LOVABLE_API_KEY=""
```

### 4. Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` to explore the dashboard.

### 5. Production Build
```bash
npm run build
```
Builds the client bundle and SSR Nitro server in `.output/`.

---

## 🗄️ Supabase Database Setup & Row-Level Security

To enable persistent cloud database synchronization:
1. Open your Supabase SQL editor.
2. Execute the migration file located at:
   `supabase/migrations/20261029_create_profiles.sql`
3. This creates the `profiles` table with strict Row Level Security (RLS) policies:
   ```sql
   create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
   create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
   create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
   ```

---

## ⚖️ Ethical & Regulatory Safety Disclaimer

**FinAdvisor XAI** is built strictly as an educational decision-support software platform.
1. **No Guaranteed Returns**: Projected compounding figures, expected returns (e.g. 12% equity, 7% debt), and historical volatilities are illustrative mathematical models. Actual financial market returns vary unpredictably.
2. **Not Certified Financial Advice**: This application is not a substitute for professional, certified advisory regulated by the Securities and Exchange Board of India (SEBI).
3. **User Discretion**: Users should verify tax implications and consult an accredited SEBI-registered Investment Adviser (RIA) prior to making capital allocation or loan prepayment decisions.

---

## 👨‍💻 Author

**Alok Kumar**  
Major Project: *AI-Driven Personalized Financial Planning & Investment Advisory System with Explainable Risk Profiling (FinAdvisor XAI)*
