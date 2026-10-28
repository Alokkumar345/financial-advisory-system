import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useProfile } from "@/lib/finance/store";
import { currency } from "@/lib/finance/engine";
import { FinancialProfileSchema, type FinancialProfile } from "@/lib/finance/types";
import { RotateCcw, Save, Sparkles, UserCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Financial Profile — FinAdvisor XAI" },
      { name: "description", content: "Capture income, expenses, savings, horizon and risk tolerance to drive the models." },
      { property: "og:title", content: "Financial Profile — FinAdvisor XAI" },
      { property: "og:description", content: "Update your financial inputs and instantly refresh every analysis." },
    ],
  }),
  component: ProfilePage,
});

type NumericKey =
  | "age"
  | "dependents"
  | "monthlyIncome"
  | "monthlyExpenses"
  | "monthlyEmi"
  | "currentSavings"
  | "existingInvestments"
  | "monthlyInvestment"
  | "horizonYears";

const NUMERIC_FIELDS: {
  key: NumericKey;
  label: string;
  hint: string;
  max: number;
}[] = [
  { key: "age", label: "Age (years)", hint: "Valid range 18 to 100", max: 100 },
  { key: "dependents", label: "Number of dependents", hint: "Children, parents, or spouse", max: 15 },
  { key: "monthlyIncome", label: "Monthly income (₹)", hint: "Net monthly take-home salary or profit", max: 10_000_000 },
  { key: "monthlyExpenses", label: "Monthly living expenses (₹)", hint: "Rent, food, utilities, lifestyle (excl. EMI)", max: 10_000_000 },
  { key: "monthlyEmi", label: "Monthly EMI / Debt payments (₹)", hint: "Home loan, car loan, credit card EMIs", max: 10_000_000 },
  { key: "currentSavings", label: "Liquid savings (₹)", hint: "Bank balance & liquid funds for emergencies", max: 1_000_000_000 },
  { key: "existingInvestments", label: "Existing investments (₹)", hint: "Mutual funds, shares, PPF, EPF, gold", max: 1_000_000_000 },
  { key: "monthlyInvestment", label: "Monthly SIP / Investment (₹)", hint: "Current amount regularly invested each month", max: 10_000_000 },
  { key: "horizonYears", label: "Investment horizon (years)", hint: "Planned time period before withdrawals begin", max: 60 },
];

function ProfilePage() {
  const { profile, updateProfile, resetProfile } = useProfile();
  const [draft, setDraft] = useState<FinancialProfile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleNumChange = (key: NumericKey, rawVal: string, max: number) => {
    const val = rawVal === "" ? 0 : Number(rawVal);
    setDraft((prev) => ({ ...prev, [key]: val }));

    setErrors((prev) => {
      const next = { ...prev };
      if (!Number.isFinite(val) || val < 0) {
        next[key] = "Cannot be negative";
      } else if (key === "age" && (val < 18 || val > 100)) {
        next[key] = "Age must be between 18 and 100";
      } else if (key === "monthlyIncome" && val <= 0) {
        next[key] = "Monthly income must be greater than zero";
      } else if (val > max) {
        next[key] = `Value cannot exceed ${max.toLocaleString("en-IN")}`;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleSave = async () => {
    const result = FinancialProfileSchema.safeParse(draft);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0];
        if (fieldName) {
          fieldErrors[fieldName.toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(result.error.errors[0]?.message || "Please check the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(draft);
      setErrors({});
      toast.success("Profile saved and synced with models!");
    } catch {
      toast.error("Failed to persist profile.");
    } finally {
      setSaving(false);
    }
  };

  const outflow = Math.max(0, draft.monthlyExpenses) + Math.max(0, draft.monthlyEmi);
  const surplus = Math.max(0, draft.monthlyIncome) - outflow;
  const emergencyMonths = outflow > 0 ? (draft.currentSavings / outflow).toFixed(1) : "0.0";

  return (
    <AppShell title="User Financial Profile" subtitle="Your financial data powers the scoring engine, ML risk models, and allocation rules">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Inputs */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal & Financial Inputs</CardTitle>
            <CardDescription>
              All monetary values are in Indian Rupees (INR). Validated with strict schema guardrails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Alok Kumar"
                />
                {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation / Industry</Label>
                <Input
                  id="occupation"
                  value={draft.occupation}
                  onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}
                  placeholder="e.g. Software Engineer"
                />
                {errors["occupation"] && <p className="text-xs text-destructive">{errors["occupation"]}</p>}
              </div>
            </div>

            {/* Financial Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {NUMERIC_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={f.key} className="text-xs font-semibold">
                      {f.label}
                    </Label>
                  </div>
                  <Input
                    id={f.key}
                    type="number"
                    min={0}
                    value={String(draft[f.key])}
                    onChange={(e) => handleNumChange(f.key, e.target.value, f.max)}
                    className={errors[f.key] ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors[f.key] ? (
                    <p className="text-[11px] text-destructive">{errors[f.key]}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Qualitative Slider Inputs */}
            <div className="space-y-5 rounded-xl border border-border/80 bg-secondary/30 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Label className="font-semibold">Risk Tolerance (Self-Reported)</Label>
                  <span className="font-display font-bold text-primary">{draft.riskTolerance} / 10</span>
                </div>
                <Slider
                  value={[draft.riskTolerance]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([v]) => setDraft({ ...draft, riskTolerance: v ?? 5 })}
                />
                <p className="text-[11px] text-muted-foreground">
                  1 = Extremely conservative (capital protection) · 10 = High risk capacity (aggressive growth)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Label className="font-semibold">Income Stability Perception</Label>
                  <span className="font-display font-bold text-primary">{draft.incomeStability} / 10</span>
                </div>
                <Slider
                  value={[draft.incomeStability]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([v]) => setDraft({ ...draft, incomeStability: v ?? 5 })}
                />
                <p className="text-[11px] text-muted-foreground">
                  1 = Highly variable (freelance / commission) · 10 = Predictable, highly secure salary
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="min-w-32">
                <Save className="mr-2 size-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setDraft(profile);
                  setErrors({});
                  toast.info("Reverted unsaved changes.");
                }}
              >
                <RotateCcw className="mr-2 size-4" />
                Revert
              </Button>

              <Button
                variant="ghost"
                onClick={async () => {
                  await resetProfile();
                  setDraft(profile);
                  toast.success("Loaded default Indian investor sample profile.");
                }}
              >
                <UserCheck className="mr-2 size-4 text-primary" />
                Reset to Sample Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Calculation Sidebar */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Live Calculations
              </CardTitle>
              <CardDescription>Instant real-time evaluation of inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Monthly Outflow:</span>
                <span className="font-semibold">{currency(outflow)}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Monthly Surplus:</span>
                <span className={`font-semibold ${surplus >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {currency(surplus)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Savings Rate:</span>
                <span className="font-semibold">
                  {draft.monthlyIncome > 0 ? `${((surplus / draft.monthlyIncome) * 100).toFixed(1)}%` : "0.0%"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Emergency Buffer:</span>
                <span className="font-semibold">{emergencyMonths} months</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Debt-to-Income (EMI):</span>
                <span className="font-semibold">
                  {draft.monthlyIncome > 0 ? `${((draft.monthlyEmi / draft.monthlyIncome) * 100).toFixed(1)}%` : "0.0%"}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Net Wealth Base:</span>
                <span className="font-bold text-foreground">
                  {currency(draft.currentSavings + draft.existingInvestments)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated bg-secondary/20">
            <CardContent className="pt-5 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Security & Row-Level Privacy</p>
              Your financial inputs are stored securely under your Supabase user ID with PostgreSQL Row Level Security (RLS) active. No other user has access to your records.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
