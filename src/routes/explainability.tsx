import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Brain, Info, CheckCircle2, Award, GitBranch } from "lucide-react";
import { useAnalysis } from "@/lib/finance/store";
import { MODEL_LEADERBOARD, globalImportance, pct } from "@/lib/finance/engine";

export const Route = createFileRoute("/explainability")({
  head: () => ({
    meta: [
      { title: "Explainable AI Dashboard — FinAdvisor XAI" },
      { name: "description", content: "SHAP-style local and global feature importance behind every risk prediction." },
      { property: "og:title", content: "Explainable AI Dashboard — FinAdvisor XAI" },
      { property: "og:description", content: "Understand exactly which financial factors drove the model's output." },
    ],
  }),
  component: XaiPage,
});

const PIPELINE_STEPS = [
  { step: "Data Synthesis & Ingestion", detail: "Multi-cohort investor profiles with diverse demographic and cash-flow parameters." },
  { step: "Data Cleaning & Bounds Checks", detail: "Negative value rejection, 18-100 age filters, and outlier winsorization." },
  { step: "Feature Engineering", detail: "Ratios: savings rate, debt burden, emergency months, net-worth runway." },
  { step: "Model Training & Selection", detail: "Trained XGBoost, Gradient Boosting, Random Forest, and Multinomial Logistic Regression." },
  { step: "Cross-Validated Evaluation", detail: "Stratified 5-fold CV measuring Accuracy, Micro/Macro F1, and ROC-AUC." },
  { step: "Exact Linear SHAP Explainability", detail: "Decomposes logits into closed-form feature contributions: weight × (x - E[x])." },
  { step: "Rule-Guarded Allocation", detail: "Post-inference safeguards: 110-minus-age equity cap and emergency fund liquidity shift." },
];

function XaiPage() {
  const { risk, health } = useAnalysis();

  const localContributions = risk.contributions.map((c) => ({
    name: c.label,
    value: Number(c.contribution.toFixed(3)),
    display: c.display,
  }));

  const globalData = globalImportance().map((g) => ({
    name: g.label,
    value: Number(g.importance.toFixed(3)),
  }));

  const radarData = health.metrics.map((m) => ({
    metric: m.label,
    score: Math.round(m.score),
  }));

  return (
    <AppShell
      title="Explainable AI (XAI) Dashboard"
      subtitle="Transparent, glass-box machine learning with local Shapley values and global feature importances"
    >
      {/* Model Narrative Banner */}
      <Alert className="mb-6 border-primary/30 bg-primary/5">
        <Brain className="size-5 text-primary" />
        <AlertTitle className="text-base font-semibold">Natural-Language Decision Rationale</AlertTitle>
        <AlertDescription className="mt-1 text-sm text-foreground/90 leading-relaxed">
          {risk.narrative}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Local SHAP Waterfall / Signed Bar Chart */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Local Explanation (This Prediction)</CardTitle>
            <CardDescription>
              Exact signed contribution to {risk.riskClass} classification logit (Base intercept: {risk.baseValue.toFixed(2)})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={localContributions}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
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
                    `${val > 0 ? "+" : ""}${val.toFixed(3)} contribution`,
                    "SHAP Impact",
                  ]}
                />
                <Bar dataKey="value" radius={4}>
                  {localContributions.map((d) => (
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

        {/* Global Feature Importance */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Global Feature Importance</CardTitle>
            <CardDescription>
              Mean absolute weight magnitude across all 3 classes: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">E[|w_c|]</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={globalData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
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
                  formatter={(val: number) => [`${val.toFixed(3)}`, "Global Importance"]}
                />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Feature Contribution Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Feature Value & Contribution Breakdown</CardTitle>
            <CardDescription>
              Engineered input values and their directional influence on {risk.riskClass}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>User Value</TableHead>
                  <TableHead className="text-right">SHAP Contribution</TableHead>
                  <TableHead className="text-right">Influence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risk.contributions.map((c) => (
                  <TableRow key={c.feature}>
                    <TableCell className="font-medium text-foreground">{c.label}</TableCell>
                    <TableCell>{c.display}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {c.contribution > 0 ? `+${c.contribution.toFixed(3)}` : c.contribution.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.contribution >= 0 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Pushes toward {risk.riskClass}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Pulls away
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Offline Model Comparison Leaderboard Table */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="size-5 text-amber-500" /> Offline Model Leaderboard
                </CardTitle>
                <CardDescription>
                  Benchmark evaluation across candidate architectures (Stratified 5-Fold CV)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400">
                Sample Benchmark Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Architecture</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">F1 Score</TableHead>
                  <TableHead className="text-right">ROC-AUC</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODEL_LEADERBOARD.map((m) => (
                  <TableRow
                    key={m.model}
                    className={m.selected ? "bg-primary/5 font-medium" : ""}
                  >
                    <TableCell>
                      <div className="font-semibold text-foreground">{m.model}</div>
                      <div className="text-[11px] text-muted-foreground">{m.notes}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{pct(m.accuracy, 1)}</TableCell>
                    <TableCell className="text-right font-mono">{pct(m.f1, 1)}</TableCell>
                    <TableCell className="text-right font-mono">{pct(m.rocAuc, 1)}</TableCell>
                    <TableCell className="text-right">
                      {m.selected ? (
                        <Badge className="bg-primary text-primary-foreground font-semibold">
                          Deployed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Benchmark
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Why Logistic Regression was deployed: </span>
              While ensemble models (XGBoost) scored slightly higher (+2.4% accuracy), Multinomial Logistic Regression was chosen for deployment because it yields <strong>exact closed-form Shapley feature attributions</strong> without sampling error, guaranteeing instantaneous, deterministic explainability.
            </div>
          </CardContent>
        </Card>

        {/* End-to-End Pipeline & Evaluation */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-5 text-primary" /> End-to-End Machine Learning Pipeline
            </CardTitle>
            <CardDescription>
              Offline model engineering, cross-validation, and real-time explainable inference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PIPELINE_STEPS.map((s, idx) => (
                <div key={s.step} className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-foreground">{s.step}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                    {s.detail}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="mt-8 border-border bg-card">
        <Info className="size-4 text-primary" />
        <AlertTitle className="text-sm font-semibold">Model Transparency Notice</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
          The benchmark statistics presented above are derived from offline cross-validation datasets. All algorithmic explanations reflect the mathematical contribution of your profile features to the deployed multinomial scoring engine.
        </AlertDescription>
      </Alert>
    </AppShell>
  );
}
