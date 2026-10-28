import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { currency, pct, planGoal } from "@/lib/finance/engine";
import { Download, FileSpreadsheet, FileText, Printer, ShieldCheck, Activity } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Export — FinAdvisor XAI" },
      { name: "description", content: "Export your financial summary, risk profile and allocation as JSON, CSV or PDF." },
      { property: "og:title", content: "Reports & Export — FinAdvisor XAI" },
      { property: "og:description", content: "A shareable summary of your plan, metrics and model explanations." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { profile } = useProfile();
  const { health, risk, recommendation } = useAnalysis();
  const plans = profile.goals.map((g) =>
    planGoal(g, recommendation.expectedReturn, health.surplus),
  );

  const fullReportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      platform: "FinAdvisor XAI — Explainable Financial Planning",
      currency: "INR",
    },
    profile,
    financialHealth: {
      score: health.score,
      grade: health.grade,
      surplus: health.surplus,
      savingsRate: health.savingsRate,
      emergencyMonths: health.emergencyMonths,
      debtBurden: health.debtBurden,
      metrics: health.metrics,
    },
    riskProfile: {
      predictedClass: risk.riskClass,
      confidence: risk.confidence,
      probabilities: risk.probabilities,
      topContributions: risk.contributions,
      narrative: risk.narrative,
    },
    recommendedPortfolio: {
      allocation: recommendation.allocation,
      blendedReturn: recommendation.expectedReturn,
      volatility: recommendation.volatility,
      monthlyDeployment: recommendation.monthlyInvestment,
      activeRules: recommendation.notes,
    },
    goalPlans: plans.map((p) => ({
      name: p.goal.name,
      category: p.goal.kind,
      priority: p.goal.priority,
      targetAmount: p.goal.targetAmount,
      years: p.goal.years,
      saved: p.goal.saved,
      futureValueOfSaved: p.futureValueOfSaved,
      gap: p.gap,
      requiredMonthlySIP: p.requiredMonthly,
      feasible: p.feasible,
    })),
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(fullReportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finadvisor_report_${profile.name.toLowerCase().replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Category", "Parameter", "Value", "Notes"],
      ["Profile", "Full Name", profile.name, ""],
      ["Profile", "Age", profile.age, ""],
      ["Profile", "Occupation", profile.occupation, ""],
      ["Profile", "Dependents", profile.dependents, ""],
      ["Cash Flow", "Monthly Income", profile.monthlyIncome, "INR"],
      ["Cash Flow", "Monthly Living Expenses", profile.monthlyExpenses, "INR"],
      ["Cash Flow", "Monthly EMI", profile.monthlyEmi, "INR"],
      ["Cash Flow", "Monthly Surplus", health.surplus, "INR"],
      ["Health", "Health Score", `${health.score}/100`, health.grade],
      ["Health", "Savings Rate", pct(health.savingsRate), "Target: 20-30%"],
      ["Health", "Emergency Buffer", `${health.emergencyMonths.toFixed(1)} Months`, "Target: 6 months"],
      ["Risk", "Classified Risk Profile", risk.riskClass, `Confidence: ${pct(risk.confidence)}`],
      ["Risk", "Risk Narrative", risk.narrative.replace(/,/g, ";"), ""],
      ...recommendation.allocation.map((a) => [
        "Allocation",
        a.asset,
        `${a.percent}%`,
        `Expected Return: ${pct(a.expectedReturn)}`,
      ]),
      ...plans.map((p) => [
        "Goal",
        p.goal.name,
        `Target: INR ${p.goal.targetAmount}`,
        `Req. SIP: INR ${Math.round(p.requiredMonthly)}/mo (${p.feasible ? "On track" : "Stretch"})`,
      ]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finadvisor_plan_${profile.name.toLowerCase().replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title="Financial Reports & Export"
      subtitle="Export or print your comprehensive personalized wealth strategy"
    >
      <div className="space-y-6">
        {/* Action Header Card (Hidden on Print) */}
        <Card className="card-elevated print:hidden">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold text-foreground">Export Summary Report</p>
              <p className="text-xs text-muted-foreground">
                Download structured machine-readable files or print an executive PDF report
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                <Download className="mr-1.5 size-4" /> Download JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <FileSpreadsheet className="mr-1.5 size-4" /> Download CSV
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground">
                <Printer className="mr-1.5 size-4" /> Print / Save as PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Printable Executive Report Document */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
          {/* Document Header */}
          <div className="flex flex-wrap items-start justify-between border-b border-border pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">FinAdvisor XAI</h1>
                  <p className="text-xs text-muted-foreground">Explainable Wealth Intelligence Report</p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Client: {profile.name}</p>
              <p>Generated: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
              <p>Reference: {profile.occupation} · Age {profile.age}</p>
            </div>
          </div>

          {/* Section 1: Financial Health Scorecard */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">
                1. Financial Health Scorecard
              </h2>
              <Badge className="text-sm font-semibold">
                Score: {health.score} / 100 ({health.grade})
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Weighted assessment across savings discipline, debt burden, liquid reserves, and core expenses.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pillar</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Sub-Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.metrics.map((m) => (
                  <TableRow key={m.key}>
                    <TableCell className="font-medium text-foreground">{m.label}</TableCell>
                    <TableCell>{m.display}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{pct(m.weight, 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{Math.round(m.score)}/100</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Section 2: Explainable Risk Profiling */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-bold text-foreground">
              2. ML Risk Profile & SHAP Feature Attributions
            </h2>
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-4">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {risk.narrative}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Top Influential Factors</TableHead>
                  <TableHead>Your Parameter</TableHead>
                  <TableHead className="text-right">Linear SHAP Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risk.contributions.slice(0, 5).map((c) => (
                  <TableRow key={c.feature}>
                    <TableCell className="font-medium text-foreground">{c.label}</TableCell>
                    <TableCell>{c.display}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {c.contribution > 0 ? `+${c.contribution.toFixed(3)}` : c.contribution.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Section 3: Recommended Asset Allocation */}
          <section className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">
                3. Recommended Strategic Asset Mix
              </h2>
              <div className="text-right text-xs text-muted-foreground">
                Expected Return: <span className="font-semibold text-foreground">{pct(recommendation.expectedReturn)}</span> · Volatility: <span className="font-semibold text-foreground">{pct(recommendation.volatility)}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Class</TableHead>
                  <TableHead className="text-right">Share (%)</TableHead>
                  <TableHead className="text-right">Monthly Deployment</TableHead>
                  <TableHead>Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendation.allocation.map((a) => (
                  <TableRow key={a.asset}>
                    <TableCell className="font-semibold text-foreground">{a.asset}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{a.percent}%</TableCell>
                    <TableCell className="text-right font-mono">
                      {currency(Math.round((recommendation.monthlyInvestment * a.percent) / 100))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.rationale}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Section 4: Goal Planning & Feasibility */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-bold text-foreground">
              4. Goal Planning & Required Monthly SIPs
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal Name</TableHead>
                  <TableHead>Target Amount</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-right">Required Monthly SIP</TableHead>
                  <TableHead className="text-right">Feasibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.goal.id}>
                    <TableCell className="font-medium text-foreground">{p.goal.name}</TableCell>
                    <TableCell>{currency(p.goal.targetAmount)}</TableCell>
                    <TableCell>{p.goal.years} years</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {currency(p.requiredMonthly)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.feasible ? "default" : "destructive"}>
                        {p.feasible ? "On track" : "Stretch"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Document Footer with Mandatory SEBI and Educational Disclaimers */}
          <div className="border-t border-border pt-6 text-[11px] text-muted-foreground leading-relaxed space-y-1">
            <p className="font-semibold text-foreground">Disclaimer & Compliance Statement:</p>
            <p>
              FinAdvisor XAI is an automated financial planning and educational software system. It uses statistical models (multinomial logistic regression) and mathematical heuristics to illustrate financial health and potential asset distributions. This report does NOT represent investment advice, tax planning, or guaranteed return promises under Securities and Exchange Board of India (SEBI) regulations. Always consult a certified, SEBI-registered Investment Adviser (RIA) before committing capital.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
