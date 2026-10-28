import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ShieldCheck, Sparkles, TrendingUp, Lock, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/lib/finance/store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FinAdvisor XAI" },
      { name: "description", content: "Sign in or register with Supabase Auth to access your explainable financial planning dashboard." },
      { property: "og:title", content: "Sign in — FinAdvisor XAI" },
      { property: "og:description", content: "AI-driven financial planning with explainable machine learning risk profiling." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signInWithSupabase, signUpWithSupabase, signInDemo, loading } = useProfile();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (mode === "login") {
      const res = await signInWithSupabase(email, password);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } else {
      const res = await signUpWithSupabase(name.trim(), email, password);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Account created successfully!");
        navigate({ to: "/profile" });
      }
    }
  };

  const handleDemoMode = () => {
    signInDemo();
    toast.info("Logged in with pre-filled sample portfolio!");
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Gradient Hero Sidebar */}
      <div className="gradient-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur">
            <Activity className="size-6 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight">FinAdvisor XAI</span>
            <span className="ml-2 rounded-md bg-primary-foreground/20 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
              Explainable AI
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Personalized Financial Planning with Explainable Machine Learning
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-primary-foreground/90">
            A comprehensive, transparent wealth intelligence system powered by multinomial logistic
            regression, closed-form SHAP feature contributions, rule-guarded asset allocation, and goal feasibility simulations.
          </p>

          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3.5 backdrop-blur">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium text-sm">Explainable Risk Profiling</p>
                <p className="text-xs text-primary-foreground/75">Calibrated probabilities & exact feature contributions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3.5 backdrop-blur">
              <TrendingUp className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium text-sm">Rule-Guarded Allocation</p>
                <p className="text-xs text-primary-foreground/75">Dynamic tilts based on horizon, age, & liquidity</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-xs text-primary-foreground/80 backdrop-blur">
          <p className="font-semibold text-primary-foreground">Ethical & Safety Notice</p>
          <p className="mt-1 leading-relaxed">
            FinAdvisor XAI is an educational decision-support tool. It does not provide guaranteed returns
            and is not a substitute for a licensed SEBI-registered financial advisor.
          </p>
        </div>
      </div>

      {/* Auth Card Container */}
      <div className="flex items-center justify-center bg-background p-6">
        <Card className="card-elevated w-full max-w-md">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 lg:hidden">
              <Activity className="size-5 text-primary" />
              <span className="font-display font-bold">FinAdvisor XAI</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in with your email and password to access your financial plan."
                : "Register for a secure account with Row Level Security."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as "login" | "register");
                setError("");
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Alok Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs text-muted-foreground">Min 6 characters</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Processing..."
                  ) : mode === "login" ? (
                    <>
                      Sign In <ArrowRight className="ml-2 size-4" />
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or explore instantly</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={handleDemoMode}
            >
              <UserCheck className="mr-2 size-4 text-primary" />
              Continue with Sample Profile (Demo Mode)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
