import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { currency, pct, projectWealth } from "@/lib/finance/engine";
import { Info, PieChart as PieIcon, ShieldAlert, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Investment Recommendation — FinAdvisor XAI" },
      { name: "description", content: "Personalised asset allocation across equity, debt, mutual funds, FDs and gold." },
      { property: "og:title", content: "Investment Recommendation — FinAdvisor XAI" },
      { property: "og:description", content: "An explainable allocation built from your risk profile, horizon and goals." },
    ],
  }),
  component: RecommendationPage,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.55 0.1 230)",
];

function RecommendationPage() {
  const { profile } = useProfile();
  const { risk, recommendation } = useAnalysis();

  const projection = projectWealth(
    profile.existingInvestments,
    recommendation.monthlyInvestment,
    recommendation.expectedReturn,
    profile.horizonYears,
  );

  const finalProjection = projection.at(-1);

  return (
    <AppShell
      title="Personalized Investment Recommendation"
      subtitle={`Rule-guarded strategic asset allocation optimized for a ${risk.riskClass} risk profile`}
    >
      {/* Prominent Educational & Regulatory Disclaimer */}
      <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
        <Info className="size-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-base font-semibold text-amber-900 dark:text-amber-200">
          Educational Decision Support (Not Regulated Financial Advice)
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs text-foreground/80 leading-relaxed">
          This asset allocation is a model-generated, rule-guarded illustration designed for financial literacy and scenario planning. It does NOT promise guaranteed returns or constitute certified advisory under SEBI regulations. Historical returns do not guarantee future performance. Consult a certified financial planner before deploying capital.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended Allocation Pie Chart */}
        <Card className="card-elevated lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieIcon className="size-5 text-primary" /> Target Asset Allocation
            </CardTitle>
            <CardDescription>
              Deploying {currency(recommendation.monthlyInvestment)}/month across 6 asset classes
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recommendation.allocation}
                  dataKey="percent"
                  nameKey="asset"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {recommendation.allocation.map((a, i) => (
                    <Cell key={a.asset} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio Metrics & Asset Breakdown Table */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Portfolio Breakdown & Rationale</CardTitle>
                <CardDescription>
                  Blended expected return: <span className="font-semibold text-foreground">{pct(recommendation.expectedReturn)}</span> · Estimated annual volatility: <span className="font-semibold text-foreground">{pct(recommendation.volatility)}</span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1 font-semibold">
                Risk Tier: {risk.riskClass}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Class</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Monthly SIP</TableHead>
                  <TableHead className="text-right">Expected Return</TableHead>
                  <TableHead>Investment Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendation.allocation.map((slice) => {
                  const monthlyAllocated = Math.round(
                    (recommendation.monthlyInvestment * slice.percent) / 100,
                  );
                  return (
                    <TableRow key={slice.asset}>
                      <TableCell className="font-semibold text-foreground">
                        {slice.asset}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {slice.percent}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {currency(monthlyAllocated)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {pct(slice.expectedReturn)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                        {slice.rationale}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rule Engine Explanatory Notes */}
        <Card className="card-elevated lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> Active Rule-Engine Adjustments
            </CardTitle>
            <CardDescription>
              How our financial safety rules adapted the base portfolio for your specific situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendation.notes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs text-foreground leading-relaxed"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
              {recommendation.notes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Standard base allocation applied without custom tilt adjustments.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Long-Term Corpus Compounding Projection */}
        <Card className="card-elevated lg:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Compounded Wealth Projection</CardTitle>
                <CardDescription>
                  Projecting initial corpus ({currency(profile.existingInvestments)}) + monthly investment ({currency(recommendation.monthlyInvestment)}) over {profile.horizonYears} years at {pct(recommendation.expectedReturn)}
                </CardDescription>
              </div>
              {finalProjection && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Estimated Final Value</p>
                  <p className="font-display text-2xl font-extrabold text-primary">
                    {currency(finalProjection.value)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Total Invested: {currency(finalProjection.invested)}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
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
                    name === "value" ? "Projected Portfolio Value" : "Cumulative Invested Capital",
                  ]}
                  labelFormatter={(lbl) => `End of Year ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="var(--color-muted-foreground)"
                  fill="transparent"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  fill="url(#wealthGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
