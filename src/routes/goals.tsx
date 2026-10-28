import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Edit3,
  PlusCircle,
  Target,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { currency, pct, planGoal } from "@/lib/finance/engine";
import { GoalSchema, type Goal, type GoalKind, type GoalPriority } from "@/lib/finance/types";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Financial Goal Planner — FinAdvisor XAI" },
      { name: "description", content: "Plan house, education, retirement and emergency goals with required monthly SIPs." },
      { property: "og:title", content: "Financial Goal Planner — FinAdvisor XAI" },
      { property: "og:description", content: "See the monthly investment each goal needs and whether it fits your surplus." },
    ],
  }),
  component: GoalsPage,
});

const GOAL_KINDS: GoalKind[] = [
  "House",
  "Higher Education",
  "Emergency Fund",
  "Retirement",
  "Car",
  "Travel",
  "Other",
];

const PRIORITIES: GoalPriority[] = ["High", "Medium", "Low"];

function GoalsPage() {
  const { profile, addGoal, updateGoal, deleteGoal } = useProfile();
  const { health, recommendation } = useAnalysis();

  // New goal draft
  const [draft, setDraft] = useState({
    name: "",
    kind: "House" as GoalKind,
    priority: "High" as GoalPriority,
    targetAmount: 2000000,
    years: 5,
    saved: 100000,
  });

  // Edit goal modal state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const plans = profile.goals.map((g) =>
    planGoal(g, recommendation.expectedReturn, health.surplus),
  );
  const totalRequiredMonthly = plans.reduce((a, p) => a + p.requiredMonthly, 0);

  const handleAddGoal = async () => {
    const parseResult = GoalSchema.safeParse({
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      kind: draft.kind,
      priority: draft.priority,
      targetAmount: Number(draft.targetAmount),
      years: Number(draft.years),
      saved: Number(draft.saved),
    });

    if (!parseResult.success) {
      toast.error(parseResult.error.errors[0]?.message || "Invalid goal parameters.");
      return;
    }

    await addGoal(parseResult.data as Goal);
    setDraft({
      name: "",
      kind: "House",
      priority: "Medium",
      targetAmount: 1500000,
      years: 5,
      saved: 50000,
    });
    toast.success("Goal added successfully!");
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    const parseResult = GoalSchema.safeParse(editingGoal);
    if (!parseResult.success) {
      toast.error(parseResult.error.errors[0]?.message || "Invalid goal values.");
      return;
    }

    await updateGoal(editingGoal.id, editingGoal);
    setEditingGoal(null);
    toast.success("Goal updated!");
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    await deleteGoal(id);
    toast.info(`Removed goal: ${name}`);
  };

  const chartData = plans.map((p) => ({
    name: p.goal.name,
    required: Math.round(p.requiredMonthly),
    capacity: Math.round(Math.max(0, health.surplus)),
  }));

  return (
    <AppShell
      title="Financial Goal Planning"
      subtitle="Compound-interest calculation of future values, shortfall gaps, and required monthly SIPs"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Goals List (2 columns on large screens) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header Summary Card */}
          <div className="gradient-hero flex flex-wrap items-center justify-between gap-4 rounded-xl p-5 text-primary-foreground">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/75">
                Total Monthly SIP Required
              </p>
              <p className="font-display text-3xl font-bold">
                {currency(totalRequiredMonthly)} / month
              </p>
              <p className="text-xs text-primary-foreground/80 mt-1">
                Calculated at {pct(recommendation.expectedReturn)} expected portfolio return
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/75">
                Available Monthly Surplus
              </p>
              <p className="font-display text-2xl font-semibold">
                {currency(health.surplus)} / month
              </p>
              <Badge
                variant={totalRequiredMonthly <= health.surplus ? "default" : "destructive"}
                className="mt-1"
              >
                {totalRequiredMonthly <= health.surplus
                  ? "Fully Affordable"
                  : `Shortfall: ${currency(totalRequiredMonthly - health.surplus)}`}
              </Badge>
            </div>
          </div>

          {/* Goal Cards */}
          <div className="space-y-4">
            {plans.map((p) => {
              const progressPercent = Math.min(
                100,
                Math.round((p.goal.saved / Math.max(1, p.goal.targetAmount)) * 100),
              );

              return (
                <Card key={p.goal.id} className="card-elevated overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-semibold">{p.goal.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {p.goal.kind}
                          </Badge>
                          <Badge
                            variant={
                              p.goal.priority === "High"
                                ? "destructive"
                                : p.goal.priority === "Medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {p.goal.priority} Priority
                          </Badge>
                        </div>
                        <CardDescription>
                          Target: <span className="font-semibold text-foreground">{currency(p.goal.targetAmount)}</span> in <span className="font-semibold text-foreground">{p.goal.years} years</span>
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={p.feasible ? "default" : "destructive"}
                          className="px-2.5 py-1 text-xs"
                        >
                          {p.feasible ? "Feasible with Surplus" : "Exceeds Surplus"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditingGoal(p.goal)}
                          title="Edit Goal"
                        >
                          <Edit3 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteGoal(p.goal.id, p.goal.name)}
                          title="Delete Goal"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-secondary/50 p-2.5">
                        <span className="text-muted-foreground block mb-0.5">Required Monthly SIP</span>
                        <span className="font-display text-base font-bold text-primary">
                          {currency(p.requiredMonthly)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-2.5">
                        <span className="text-muted-foreground block mb-0.5">Projected Value of Savings</span>
                        <span className="font-display text-base font-semibold text-foreground">
                          {currency(p.futureValueOfSaved)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-2.5">
                        <span className="text-muted-foreground block mb-0.5">Remaining Funding Gap</span>
                        <span className="font-display text-base font-semibold text-foreground">
                          {currency(p.gap)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Funded: {currency(p.goal.saved)} ({progressPercent}%)</span>
                        <span>Remaining: {currency(Math.max(0, p.goal.targetAmount - p.goal.saved))}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {plans.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                <Target className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                <p className="font-medium text-foreground">No financial goals added yet</p>
                <p className="text-xs mt-1">Use the form to define your first financial target.</p>
              </div>
            )}
          </div>

          {/* Goal SIP Comparison Chart */}
          {plans.length > 0 && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Required Monthly SIP vs Surplus Capacity</CardTitle>
                <CardDescription>
                  Checking required monthly investment against your available surplus ({currency(health.surplus)})
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(v: number) => currency(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar name="Required Monthly SIP" dataKey="required" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar name="Monthly Surplus" dataKey="capacity" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Goal Form Sidebar */}
        <div className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PlusCircle className="size-4 text-primary" /> Add New Financial Goal
              </CardTitle>
              <CardDescription>
                Compound formula computes required SIP automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. New Electric SUV"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(v) => setDraft({ ...draft, kind: v as GoalKind })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) => setDraft({ ...draft, priority: v as GoalPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-target">Target Amount (₹)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  min={1000}
                  step={10000}
                  value={String(draft.targetAmount)}
                  onChange={(e) => setDraft({ ...draft, targetAmount: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="goal-years">Horizon (Years)</Label>
                  <Input
                    id="goal-years"
                    type="number"
                    min={1}
                    max={60}
                    value={String(draft.years)}
                    onChange={(e) => setDraft({ ...draft, years: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="goal-saved">Already Saved (₹)</Label>
                  <Input
                    id="goal-saved"
                    type="number"
                    min={0}
                    step={10000}
                    value={String(draft.saved)}
                    onChange={(e) => setDraft({ ...draft, saved: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={handleAddGoal} className="w-full mt-2">
                <PlusCircle className="mr-2 size-4" /> Save Financial Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Goal Dialog Modal */}
      {editingGoal && (
        <Dialog open={Boolean(editingGoal)} onOpenChange={(open) => !open && setEditingGoal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal: {editingGoal.name}</DialogTitle>
              <DialogDescription>
                Modify the target amount, timeline, or current accumulated savings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Goal Name</Label>
                <Input
                  id="edit-name"
                  value={editingGoal.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editingGoal.kind}
                    onValueChange={(v) => setEditingGoal({ ...editingGoal, kind: v as GoalKind })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={editingGoal.priority}
                    onValueChange={(v) =>
                      setEditingGoal({ ...editingGoal, priority: v as GoalPriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-target">Target Amount (₹)</Label>
                <Input
                  id="edit-target"
                  type="number"
                  min={1000}
                  value={String(editingGoal.targetAmount)}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, targetAmount: Number(e.target.value) })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-years">Timeline (Years)</Label>
                  <Input
                    id="edit-years"
                    type="number"
                    min={1}
                    max={60}
                    value={String(editingGoal.years)}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, years: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-saved">Amount Saved (₹)</Label>
                  <Input
                    id="edit-saved"
                    type="number"
                    min={0}
                    value={String(editingGoal.saved)}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, saved: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGoal}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
