import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { RISK_CLASSES, pct, engineerFeatures } from "@/lib/finance/engine";
import { ShieldCheck, Info, Brain, Sparkles } from "lucide-react";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Assessment — FinAdvisor XAI" },
      { name: "description", content: "ML-based investor risk profiling with per-feature explanations and model comparison." },
      { property: "og:title", content: "Risk Assessment — FinAdvisor XAI" },
      { property: "og:description", content: "See your predicted risk class, confidence and the factors that drove it." },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { profile } = useProfile();
  const { risk, health } = useAnalysis();

  const probData = RISK_CLASSES.map((c) => ({
    name: c,
    value: Number((risk.probabilities[c] * 100).toFixed(1)),
  }));

  const contribData = risk.contributions.map((c) => ({
    name: c.label,
    value: Number(c.contribution.toFixed(3)),
    display: c.display,
  }));

  // Prepare normalized radar data across the 9 features (scaled 0 to 100)
  const f = engineerFeatures(profile);
  const radarData = [
    { subject: "Risk Tolerance", score: f.riskTolerance * 10 },
    { subject: "Horizon", score: Math.min(100, (f.horizonYears / 25) * 100) },
    { subject: "Youth (Horizon Buffer)", score: Math.min(100, Math.max(0, (70 - f.age) * 2)) },
    { subject: "Savings Rate", score: Math.min(100, (Math.max(0, f.savingsRate) / 0.4) * 100) },
    { subject: "Income Stability", score: f.incomeStability * 10 },
    { subject: "Emergency Buffer", score: Math.min(100, (f.emergencyMonths / 12) * 100) },
    { subject: "Low Debt Ratio", score: Math.min(100, Math.max(0, (0.5 - f.debtBurden) * 200)) },
    { subject: "Net-Worth Runway", score: Math.min(100, (f.netWorthMonths / 36) * 100) },
  ];

  return (
    <AppShell
      title="Multinomial Investment Risk Profiling"
      subtitle="Supervised ML classifier over 9 engineered financial variables with closed-form explainability"
    >
      {/* Natural Language Explanation Alert */}
      <Alert className="mb-6 border-primary/30 bg-primary/5">
        <Brain className="size-5 text-primary" />
        <AlertTitle className="text-base font-semibold">Model Prediction Narrative</AlertTitle>
        <AlertDescription className="mt-1 text-sm text-foreground/90 leading-relaxed">
          {risk.narrative}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Prediction Summary Card */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Classified Risk Profile
            </CardTitle>
            <CardDescription>Softmax classification output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Predicted Class</span>
              <Badge className="px-3.5 py-1 text-base font-semibold tracking-wide">
                {risk.riskClass}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Model Confidence</span>
                <span className="font-semibold">{pct(risk.confidence, 1)}</span>
              </div>
              <Progress value={risk.confidence * 100} className="h-2.5" />
              <p className="text-[11px] text-muted-foreground">
                Calibrated posterior probability from softmax normalization
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-border/70 bg-secondary/30 p-3.5">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Full Probability Distribution
              </p>
              {RISK_CLASSES.map((c) => (
                <div key={c} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${c === risk.riskClass ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <span className={c === risk.riskClass ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {c}
                    </span>
                  </div>
                  <span className={c === risk.riskClass ? "font-bold text-primary" : "text-muted-foreground"}>
                    {pct(risk.probabilities[c], 1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              Base intercept for {risk.riskClass}: <code className="rounded bg-muted px-1 py-0.5 font-mono">{risk.baseValue.toFixed(2)}</code>
            </div>
          </CardContent>
        </Card>

        {/* Class Probabilities Bar Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Class Probability Distribution</CardTitle>
            <CardDescription>Softmax probabilities across all 3 risk classes</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis unit="%" stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {probData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.name === risk.riskClass ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investor Feature Radar Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Investor Feature Radar</CardTitle>
            <CardDescription>Multi-dimensional normalized fingerprint (0–100 scale)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="subject" fontSize={10} stroke="var(--color-muted-foreground)" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--color-border)" />
                <Radar
                  name="Normalized Score"
                  dataKey="score"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.35}
                />
                <Tooltip formatter={(val: number) => `${Math.round(val)}/100`} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Why this prediction (SHAP Signed Contributions) */}
        <Card className="card-elevated lg:col-span-3">
          <CardHeader>
            <CardTitle>Per-Feature Local Contributions (Linear SHAP)</CardTitle>
            <CardDescription>
              Exact contribution: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">weight × ((x - mean) / std)</code>. Positive values push towards {risk.riskClass}, negative values pull towards other classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contribData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  formatter={(val: number) => [
                    `${val > 0 ? "+" : ""}${val.toFixed(3)} contribution score`,
                    "SHAP Value",
                  ]}
                />
                <Bar dataKey="value" radius={4}>
                  {contribData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.value >= 0 ? "var(--color-chart-2)" : "var(--color-chart-5)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Alert className="mt-8 border-border bg-card">
        <Info className="size-4 text-primary" />
        <AlertTitle className="text-sm font-semibold">Educational Model Notice</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
          The risk profile generated by FinAdvisor XAI is an algorithmic estimation based on statistical modeling. It should be used solely as decision support. For formal risk suitability analysis compliant with SEBI regulations, consult an accredited financial advisory firm.
        </AlertDescription>
      </Alert>
    </AppShell>
  );
}
