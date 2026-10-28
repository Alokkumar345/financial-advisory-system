import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Sparkles, AlertCircle, RefreshCw, Info } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { askAssistant } from "@/lib/ai.functions";
import { useAnalysis, useProfile } from "@/lib/finance/store";
import { currency, pct } from "@/lib/finance/engine";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Financial Assistant — FinAdvisor XAI" },
      { name: "description", content: "Ask questions about your dashboard, metrics, risk profile and recommendations." },
      { property: "og:title", content: "AI Financial Assistant — FinAdvisor XAI" },
      { property: "og:description", content: "A cautious, explanation-first assistant for your financial data." },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Explain my Financial Health Score in plain English.",
  "Why did the model classify my risk profile this way?",
  "What is the single most important weakness I should fix first?",
  "How did the rule engine arrive at my asset allocation?",
  "Can I afford my financial goals with my current monthly surplus?",
];

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function AssistantPage() {
  const { profile } = useProfile();
  const { health, risk, recommendation } = useAnalysis();
  const askServerFn = useServerFn(askAssistant);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        `Hello ${profile.name}! I am your FinAdvisor XAI assistant. I have full context of your financial health score (${health.score}/100, ${health.grade}), your ML risk classification (${risk.riskClass} at ${pct(risk.confidence, 0)} confidence), your recommended portfolio, and your goals.\n\n` +
        `I provide educational explanations in simple language. What would you like to explore today?\n\n` +
        `*Disclaimer: I am an educational decision-support tool. For certified advice, please consult a SEBI-registered financial advisor.*`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compile rich context string for the system prompt
  const liveContext = [
    `User: ${profile.name}, Age ${profile.age}, Occupation: ${profile.occupation}, Dependents: ${profile.dependents}.`,
    `Cash Flow: Monthly Income ${currency(profile.monthlyIncome)}, Expenses ${currency(profile.monthlyExpenses)}, EMI ${currency(profile.monthlyEmi)}, Monthly Surplus ${currency(health.surplus)}.`,
    `Assets: Liquid Savings ${currency(profile.currentSavings)}, Existing Investments ${currency(profile.existingInvestments)}, Monthly SIP ${currency(profile.monthlyInvestment)}, Horizon ${profile.horizonYears} years.`,
    `Health Score: ${health.score}/100 (${health.grade}); Savings Rate ${pct(health.savingsRate)}; Emergency Buffer ${health.emergencyMonths.toFixed(1)} months; Debt Burden ${pct(health.debtBurden)}.`,
    `Risk Profile: ${risk.riskClass} at ${pct(risk.confidence)} confidence. Top SHAP Drivers: ${risk.contributions.slice(0, 4).map((c) => `${c.label} (${c.display})`).join(", ")}.`,
    `Recommended Allocation: ${recommendation.allocation.map((a) => `${a.asset} ${a.percent}%`).join(", ")}; Expected Return ${pct(recommendation.expectedReturn)}; Volatility ${pct(recommendation.volatility)}.`,
    `Goals: ${profile.goals.map((g) => `${g.name} (${g.kind}): ${currency(g.targetAmount)} in ${g.years} yrs, saved ${currency(g.saved)}`).join("; ") || "None specified"}.`,
  ].join("\n");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || busy) return;

    const newMessages: ChatMsg[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setBusy(true);

    try {
      const response = await askServerFn({
        data: {
          messages: newMessages.slice(-12),
          context: liveContext,
        },
      });

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${response.error}\n\nPlease try again shortly. Remember that you can also review your exact calculations on the Dashboard and XAI pages.`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Network connection interrupted. Please verify your connection and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="AI Financial Assistant"
      subtitle="Context-aware natural language explanations for your metrics and model predictions"
    >
      <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col gap-4">
        {/* Suggested Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3.5 text-primary" /> Suggested:
          </span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              disabled={busy}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:bg-secondary/70 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat Window Card */}
        <Card className="card-elevated flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b border-border py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">FinAdvisor Intelligent Agent</CardTitle>
                  <CardDescription className="text-[11px]">
                    Live context attached · Strictly under 200 words · Prudent decision support
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Active Session: {profile.name}
              </Badge>
            </div>
          </CardHeader>

          {/* Messages Container */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground mt-0.5">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-secondary/80 text-foreground border border-border/50"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-0.5">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-10">
                <RefreshCw className="size-3.5 animate-spin text-primary" />
                <span>Formulating explainable financial insights…</span>
              </div>
            )}
            <div ref={scrollRef} />
          </CardContent>

          {/* Input Footer */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask about your risk drivers, asset allocation, or savings gap..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
                className="flex-1"
                maxLength={4000}
              />
              <Button type="submit" disabled={busy || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Educational decision-support assistant. Does not promise returns. Consult a SEBI-registered adviser for financial execution.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
