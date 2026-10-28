import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Banknote,
  PiggyBank,
  Receipt,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  SlidersHorizontal,
  Target,
  Sparkles,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { currency, pct, planGoal } from "@/lib/finance/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financial Health Dashboard — FinAdvisor XAI" },
      {
        name: "description",
        content:
          "AI-driven personalised financial planning with explainable risk profiling, allocation and goal tracking.",
      },
      { property: "og:title", content: "Financial Health Dashboard — FinAdvisor XAI" },
      {
        property: "og:description",
        content:
          "Track income, savings rate, health score, risk profile and recommended allocation in one dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.55 0.1 230)",
];

function Dashboard() {
  const { profile } = useProfile();
  const { health, risk, recommendation } = useAnalysis();
  const plans = profile.goals.map((g) =>
    planGoal(g, recommendation.expectedReturn, health.surplus),
  );

  const getGradeVariant = (grade: string) => {
    switch (grade) {
      case "Excellent":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case "Good":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "Fair":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "Needs work":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
      default:
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    }
  };

  return (
    <AppShell
      title="Financial Health Dashboard"
      subtitle={`Comprehensive wealth analytics for ${profile.name}`}
    >
      {/* Hero Banner */}
      <div className="gradient-hero mb-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl p-6 text-primary-foreground shadow-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary-foreground/75">
              Financial Health Status
            </span>
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${getGradeVariant(health.grade)}`}
            >
              {health.grade}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold md:text-5xl">{health.score}</span>
            <span className="text-lg text-primary-foreground/70">/ 100</span>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/90">
            {risk.narrative}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary" className="shadow-xs">
            <Link to="/recommendations">
              View Recommended Portfolio <ArrowUpRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
          >
            <Link to="/simulator">
              <SlidersHorizontal className="mr-1.5 size-4" /> Run Simulator
            </Link>
          </Button>
        </div>
      </div>

      {/* Core Financial StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly Income"
          value={currency(profile.monthlyIncome)}
          hint="Net monthly take-home"
          icon={<Banknote className="size-4" />}
        />
        <StatCard
          label="Total Monthly Outflow"
          value={currency(profile.monthlyExpenses + profile.monthlyEmi)}
          hint={`Expenses ${currency(profile.monthlyExpenses)} + EMI ${currency(profile.monthlyEmi)}`}
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          label="Monthly Surplus"
          value={currency(health.surplus)}
          hint={
            health.surplus >= 0 ? "Positive cash flow available to invest" : "Cash flow deficit"
          }
          tone={health.surplus > 0 ? "success" : "destructive"}
          icon={<PiggyBank className="size-4" />}
        />
        <StatCard
          label="Savings Rate"
          value={pct(health.savingsRate)}
          hint="Ideal benchmark: 20%–30%"
          tone={health.savingsRate >= 0.2 ? "success" : "warning"}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {/* Key Insights Alert Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {health.emergencyMonths < 6 ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Emergency Buffer Alert ({health.emergencyMonths.toFixed(1)} Months)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your liquid savings of {currency(profile.currentSavings)} cover{" "}
                {health.emergencyMonths.toFixed(1)} months of outflow. We advise channeling surplus
                to liquid deposits until reaching 6 months (
                {currency((profile.monthlyExpenses + profile.monthlyEmi) * 6)}).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Robust Emergency Cushion ({health.emergencyMonths.toFixed(1)} Months)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your liquid reserve exceeds the recommended 6-month safety threshold, providing
                resilience against unforeseen events.
              </p>
            </div>
          </div>
        )}

        {health.debtBurden > 0.35 ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-foreground">
            <AlertTriangle className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Elevated Debt Burden ({pct(health.debtBurden)} of Income)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Debt EMIs consume more than 35% of monthly income. Prioritizing prepayment of
                high-cost loans will de-risk your cash flows.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground">
            <Sparkles className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Healthy Debt Management ({pct(health.debtBurden)})</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your debt-to-income ratio is well controlled under 35%, leaving ample surplus for
                systematic long-term investing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Health Breakdown & Risk/Allocation */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Health Breakdown 5 Pillars */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Financial Health Score Breakdown</CardTitle>
                <CardDescription>
                  Multi-pillar weighted evaluation (Score: {health.score}/100)
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-semibold">
                {health.grade}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {health.metrics.map((m) => (
              <div key={m.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{m.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({Math.round(m.weight * 100)}% weight)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.display}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(m.score)}/100)
                    </span>
                  </div>
                </div>
                <Progress value={m.score} className="h-2" />
                <p className="text-xs text-muted-foreground">{m.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Profile & Allocation Pie */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-primary" /> Risk & Recommended Asset Mix
            </CardTitle>
            <CardDescription>
              Multinomial Classifier:{" "}
              <span className="font-semibold text-foreground">{risk.riskClass}</span> (
              {pct(risk.confidence, 0)} confidence)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recommendation.allocation}
                    dataKey="percent"
                    nameKey="asset"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {recommendation.allocation.map((a, i) => (
                      <Cell key={a.asset} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Expected Return:{" "}
              <span className="font-semibold text-foreground">
                {pct(recommendation.expectedReturn)}
              </span>{" "}
              · Volatility:{" "}
              <span className="font-semibold text-foreground">
                {pct(recommendation.volatility)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Top Strengths
            </CardTitle>
            <CardDescription>Pillars that reinforce your stability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {health.strengths.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Continue building your baseline metrics.
              </p>
            ) : (
              health.strengths.map((m) => (
                <div
                  key={m.key}
                  className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.hint}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-semibold">
                    {m.display}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weaknesses / Opportunities */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="size-4" /> Areas to Improve
            </CardTitle>
            <CardDescription>Highest-impact opportunities to strengthen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {health.weaknesses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All evaluated financial pillars are in good standing!
              </p>
            ) : (
              health.weaknesses.map((m) => (
                <div
                  key={m.key}
                  className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.hint}</p>
                  </div>
                  <Badge variant="destructive" className="shrink-0 font-semibold">
                    {m.display}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Goal Progress Card */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4 text-primary" /> Goal Progress
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/goals">Manage</Link>
              </Button>
            </div>
            <CardDescription>Current savings vs target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {plans.slice(0, 3).map((p) => {
              const progressPct = Math.min(
                100,
                Math.round((p.goal.saved / Math.max(1, p.goal.targetAmount)) * 100),
              );
              return (
                <div key={p.goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{p.goal.name}</span>
                    <span className="text-muted-foreground">
                      {currency(p.goal.saved)} / {currency(p.goal.targetAmount)} ({progressPct}%)
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{p.goal.years} yrs left</span>
                    <span>SIP: {currency(p.requiredMonthly)}/mo</span>
                  </div>
                </div>
              );
            })}
            {plans.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No financial goals set yet.{" "}
                <Link to="/goals" className="text-primary underline">
                  Add your first goal
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Model Drivers Bar Chart */}
        <Card className="card-elevated lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Top ML Risk Drivers (SHAP Local Contributions)
                </CardTitle>
                <CardDescription>
                  Exact signed contributions pushing toward or away from {risk.riskClass}{" "}
                  classification
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/explainability">Full XAI Dashboard</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={risk.contributions.slice(0, 6).map((c) => ({
                  name: c.label,
                  value: Number(c.contribution.toFixed(3)),
                  display: c.display,
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  formatter={(val: number) => [
                    `${val > 0 ? "+" : ""}${val.toFixed(3)} contribution`,
                    "SHAP Impact",
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {risk.contributions.slice(0, 6).map((c) => (
                    <Cell
                      key={c.feature}
                      fill={c.contribution >= 0 ? "var(--color-chart-2)" : "var(--color-chart-5)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ethical & Regulatory Safety Disclaimer Footer */}
      <Alert className="mt-8 border-border bg-card">
        <Info className="size-4 text-primary" />
        <AlertTitle className="text-sm font-semibold">Regulatory and Safety Notice</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
          FinAdvisor XAI is an educational decision-support software. All health scores, machine
          learning risk classifications, and portfolio allocations are deterministic mathematical
          illustrations based on historical averages and user-submitted inputs. They do not
          constitute guaranteed returns, tax advice, or certified investment recommendations under
          SEBI guidelines. Before executing financial decisions, always consult a licensed
          SEBI-registered Investment Adviser (RIA).
        </AlertDescription>
      </Alert>
    </AppShell>
  );
}
