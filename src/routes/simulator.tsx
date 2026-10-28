import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/finance/store";
import {
  analyseHealth,
  currency,
  pct,
  predictRisk,
  projectWealth,
  recommend,
} from "@/lib/finance/engine";
import { RotateCcw, Sliders, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — FinAdvisor XAI" },
      {
        name: "description",
        content:
          "Change income, expenses, SIP amount, horizon or risk and watch outcomes update live.",
      },
      { property: "og:title", content: "What-If Simulator — FinAdvisor XAI" },
      {
        property: "og:description",
        content: "Interactive scenario testing for your financial health and projected corpus.",
      },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { profile } = useProfile();

  // Scenario parameters
  const [income, setIncome] = useState(profile.monthlyIncome);
  const [expenses, setExpenses] = useState(profile.monthlyExpenses);
  const [sip, setSip] = useState(profile.monthlyInvestment);
  const [horizon, setHorizon] = useState(profile.horizonYears);
  const [risk, setRisk] = useState(profile.riskTolerance);

  // Baseline evaluation with saved profile
  const base = useMemo(() => {
    const health = analyseHealth(profile);
    const r = predictRisk(profile);
    const rec = recommend(profile, r);
    return { health, risk: r, rec };
  }, [profile]);

  // Live scenario evaluation with modified sliders
  const scenario = useMemo(() => {
    const simulatedProfile = {
      ...profile,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlyInvestment: sip,
      horizonYears: horizon,
      riskTolerance: risk,
    };
    const health = analyseHealth(simulatedProfile);
    const r = predictRisk(simulatedProfile);
    const rec = recommend(simulatedProfile, r);
    return { profile: simulatedProfile, health, risk: r, rec };
  }, [profile, income, expenses, sip, horizon, risk]);

  const years = Math.max(horizon, profile.horizonYears);
  const basePoints = projectWealth(
    profile.existingInvestments,
    profile.monthlyInvestment,
    base.rec.expectedReturn,
    years,
  );
  const scenarioPoints = projectWealth(
    profile.existingInvestments,
    sip,
    scenario.rec.expectedReturn,
    years,
  );

  const chartData = basePoints.map((b, i) => ({
    year: b.year,
    currentValue: b.value,
    currentInvested: b.invested,
    scenarioValue: scenarioPoints[i]?.value ?? 0,
    scenarioInvested: scenarioPoints[i]?.invested ?? 0,
  }));

  const finalBase = basePoints.at(-1);
  const finalScenario = scenarioPoints.at(-1);

  const reset = () => {
    setIncome(profile.monthlyIncome);
    setExpenses(profile.monthlyExpenses);
    setSip(profile.monthlyInvestment);
    setHorizon(profile.horizonYears);
    setRisk(profile.riskTolerance);
  };

  return (
    <AppShell
      title="What-If Financial Simulator"
      subtitle="Interactive scenario testing without altering your saved database profile"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Card */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="size-4 text-primary" /> Scenario Inputs
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs">
                <RotateCcw className="mr-1.5 size-3.5" /> Reset
              </Button>
            </div>
            <CardDescription>Drag sliders to test instant hypothetical outcomes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Monthly Income</Label>
                <span className="font-semibold text-primary">{currency(income)}</span>
              </div>
              <Slider
                value={[income]}
                min={20000}
                max={Math.max(500000, profile.monthlyIncome * 3)}
                step={5000}
                onValueChange={([v]) => setIncome(v ?? 20000)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Monthly Living Expenses</Label>
                <span className="font-semibold text-primary">{currency(expenses)}</span>
              </div>
              <Slider
                value={[expenses]}
                min={10000}
                max={Math.max(300000, profile.monthlyExpenses * 2.5)}
                step={2000}
                onValueChange={([v]) => setExpenses(v ?? 10000)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Monthly Investment (SIP)</Label>
                <span className="font-semibold text-primary">{currency(sip)}</span>
              </div>
              <Slider
                value={[sip]}
                min={1000}
                max={Math.max(200000, profile.monthlyInvestment * 4)}
                step={2000}
                onValueChange={([v]) => setSip(v ?? 1000)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Investment Horizon</Label>
                <span className="font-semibold text-primary">{horizon} Years</span>
              </div>
              <Slider
                value={[horizon]}
                min={1}
                max={40}
                step={1}
                onValueChange={([v]) => setHorizon(v ?? 1)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Risk Tolerance Score</Label>
                <span className="font-semibold text-primary">{risk} / 10</span>
              </div>
              <Slider
                value={[risk]}
                min={1}
                max={10}
                step={1}
                onValueChange={([v]) => setRisk(v ?? 5)}
              />
            </div>

            <Button variant="outline" className="w-full mt-2" onClick={reset}>
              <RotateCcw className="mr-2 size-4" /> Reset to Saved Profile
            </Button>
          </CardContent>
        </Card>

        {/* Live Impact & Wealth Comparison */}
        <div className="space-y-6 lg:col-span-2">
          {/* Delta Metrics Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-elevated">
              <CardContent className="pt-5 space-y-1">
                <span className="text-xs text-muted-foreground">Financial Health Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{scenario.health.score}</span>
                  <span className="text-xs text-muted-foreground">
                    vs {base.health.score} saved
                  </span>
                </div>
                <Badge
                  variant={scenario.health.score >= base.health.score ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {scenario.health.score - base.health.score >= 0 ? "+" : ""}
                  {scenario.health.score - base.health.score} pts ({scenario.health.grade})
                </Badge>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-5 space-y-1">
                <span className="text-xs text-muted-foreground">Risk Profile Classification</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{scenario.risk.riskClass}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Expected Return: {pct(scenario.rec.expectedReturn)} (was{" "}
                  {pct(base.rec.expectedReturn)})
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-5 space-y-1">
                <span className="text-xs text-muted-foreground">Terminal Wealth Projection</span>
                <div className="text-xl font-bold text-primary">
                  {currency(finalScenario?.value ?? 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Invested: {currency(finalScenario?.invested ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart: Current vs Scenario Wealth */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Projected Wealth Accumulation
                (Current vs Scenario)
              </CardTitle>
              <CardDescription>
                Comparing projected portfolio growth under current profile versus the what-if
                simulated inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="year"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(y) => `Yr ${y}`}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      currency(val),
                      name === "scenarioValue"
                        ? "Scenario Portfolio Value"
                        : name === "currentValue"
                          ? "Current Saved Profile Value"
                          : name === "scenarioInvested"
                            ? "Scenario Total Invested"
                            : "Current Total Invested",
                    ]}
                    labelFormatter={(lbl) => `Year ${lbl}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="currentValue"
                    name="Current Saved Plan"
                    stroke="var(--color-muted-foreground)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="scenarioValue"
                    name="What-If Scenario"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="scenarioInvested"
                    name="Scenario Invested Amount"
                    stroke="var(--color-chart-2)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Asset Allocation Changes */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Simulated Portfolio Asset Mix</CardTitle>
              <CardDescription>
                How changes to risk tolerance and horizon dynamically shifted target asset weights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scenario.rec.allocation.map((slice) => (
                  <Badge key={slice.asset} variant="secondary" className="px-3 py-1.5 text-xs">
                    {slice.asset}:{" "}
                    <span className="ml-1 font-bold text-primary">{slice.percent}%</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
