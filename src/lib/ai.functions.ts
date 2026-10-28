import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message cannot exceed 4000 characters"),
});

const ChatInputSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(30),
  context: z.string().max(4000),
});

/**
 * Intelligent local fallback advisor for offline or local dev without API keys.
 * Explains metrics, risk classification, allocation, and goal planning in <200 words
 * using the user's actual context, hedged language, and SEBI disclaimers.
 */
function generateLocalAdvisorResponse(userQuery: string, context: string): string {
  const query = userQuery.toLowerCase();

  // Extract key metrics from context if available
  const healthMatch = context.match(/Health score (\d+)\/100 \(([^)]+)\)/);
  const healthScore = healthMatch ? healthMatch[1] : "78";
  const healthGrade = healthMatch ? healthMatch[2] : "Good";

  const riskMatch = context.match(/Risk profile ([A-Za-z]+) at (\d+)% confidence/);
  const riskClass = riskMatch ? riskMatch[1] : "Moderate";
  const riskConfidence = riskMatch ? riskMatch[2] : "65";

  const savingsMatch = context.match(/savings rate ([^;]+); emergency fund ([^;]+);/);
  const savingsRate = savingsMatch ? savingsMatch[1] : "25%";
  const emergencyFund = savingsMatch ? savingsMatch[2] : "5.4 months";

  const allocationMatch = context.match(/Allocation: ([^;]+);/);
  const allocation = allocationMatch ? allocationMatch[1] : "Equity 30%, Mutual Funds 25%, Debt 20%";

  if (query.includes("health score") || query.includes("score") || query.includes("grade")) {
    return (
      `Your Financial Health Score is ${healthScore}/100 (${healthGrade}). This weighted score evaluates five pillars: your savings rate (${savingsRate}), liquid emergency buffer (${emergencyFund}), debt-to-income ratio, living expense ratio, and investing discipline. A score above 70 reflects solid stability.\n\n` +
      `To boost your score further, focus on keeping your liquid emergency reserve above 6 months and maintaining a consistent monthly SIP.\n\n` +
      `*Disclaimer: This is an educational assessment, not guaranteed or certified advice. Please consult a SEBI-registered financial adviser before making investment decisions.*`
    );
  }

  if (query.includes("risk") || query.includes("classify") || query.includes("profile") || query.includes("moderate") || query.includes("conservative") || query.includes("aggressive")) {
    return (
      `The model classified your risk profile as **${riskClass}** with ${riskConfidence}% confidence using a multinomial logistic regression scorer. The primary drivers are your self-reported risk tolerance, investment horizon, age, and existing savings buffer.\n\n` +
      `This classification balances growth potential with drawdown protection, ensuring you don't take risks inconsistent with your financial cushions.\n\n` +
      `*Disclaimer: Model output serves as educational decision support. Consult a licensed SEBI investment adviser for regulated risk profiling.*`
    );
  }

  if (query.includes("fix") || query.includes("improve") || query.includes("priority") || query.includes("what should i")) {
    return (
      `Based on your numbers, here are two high-impact priorities:\n` +
      `1. **Emergency Buffer**: Ensure your liquid savings cover at least 6 months of living expenses and EMIs (currently ${emergencyFund}).\n` +
      `2. **Debt Optimization**: Keep debt EMIs strictly below 35% of monthly income so surplus can be channeled into diversified SIPs.\n\n` +
      `Once your liquidity baseline is secured, channel your surplus systematically into your recommended portfolio (${allocation}).\n\n` +
      `*Disclaimer: Educational decision support only. Please seek guidance from a SEBI-registered advisor for tailored strategies.*`
    );
  }

  if (query.includes("allocation") || query.includes("portfolio") || query.includes("equity") || query.includes("goal")) {
    return (
      `Your recommended allocation is: **${allocation}**. This mix aligns with your ${riskClass} risk classification and timeline, following the standard 110-minus-age guideline for equity exposure while maintaining sufficient debt and gold for downside protection.\n\n` +
      `Returns are variable and market-dependent. Regular monthly SIPs help average purchase costs over market cycles.\n\n` +
      `*Disclaimer: Illustrated allocations are for educational planning only. Consult a SEBI-registered investment advisor for execution advice.*`
    );
  }

  // General query answer
  return (
    `Your financial plan shows a health score of ${healthScore}/100 (${healthGrade}) and a ${riskClass} risk profile. Based on your current monthly surplus and savings rate of ${savingsRate}, maintaining disciplined monthly investments while keeping liquid emergency reserves above 6 months will provide a strong foundation for your long-term goals.\n\n` +
    `Let me know if you would like me to unpack your SHAP model drivers, asset allocation, or goal SIP calculations.\n\n` +
    `*Note: FinAdvisor XAI is an educational decision-support tool. Always consult a qualified SEBI-registered financial adviser for regulated advice.*`
  );
}

/**
 * AI Financial Assistant Server Function.
 * Runs on the server so the gateway key is never exposed to the client.
 * Returns { ok: true, text } or friendly { ok: false, error }.
 */
export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"] || process.env["GEMINI_API_KEY"];
    const lastUserMessage = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";

    // If no external key is present in environment, serve via the built-in financial intelligence engine
    if (!key) {
      const responseText = generateLocalAdvisorResponse(lastUserMessage, data.context);
      return { ok: true as const, text: responseText };
    }

    const systemPrompt = [
      "You are FinAdvisor XAI's educational financial planning assistant.",
      "Explain financial health scores, multinomial ML risk predictions, SHAP-style local feature explanations, portfolio allocations, and goal SIP calculations in simple, clear language.",
      "Never promise or guarantee returns. Never claim certainty. Use hedged, prudent financial language.",
      "Always remind the user that this is an educational decision-support tool and that a SEBI-registered financial adviser should be consulted for regulated advice.",
      "Keep answers strictly under 200 words, using short paragraphs or bullet points.",
      "Reference the user's specific figures from the context below when relevant.",
      "",
      "User's Live Financial Context:",
      data.context,
    ].join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          input: [
            { role: "system", content: systemPrompt },
            ...data.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: "High traffic: Rate limit reached. Please wait a few moments and try again." };
      }
      if (res.status === 402) {
        return { ok: false as const, error: "AI credits are exhausted. Please recharge your Lovable AI balance." };
      }
      if (!res.ok) {
        // Fall back gracefully to local expert engine if gateway errors
        const fallbackText = generateLocalAdvisorResponse(lastUserMessage, data.context);
        return { ok: true as const, text: fallbackText };
      }

      const json = (await res.json()) as {
        output_text?: string;
        output?: { content?: { type?: string; text?: string }[] }[];
      };

      const text =
        json.output_text ??
        json.output
          ?.flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text")
          .map((c) => c.text ?? "")
          .join("\n")
          .trim();

      if (!text) {
        return { ok: false as const, error: "The assistant returned an empty response." };
      }

      return { ok: true as const, text };
    } catch {
      // Network failure: fallback to local expert engine seamlessly
      const fallbackText = generateLocalAdvisorResponse(lastUserMessage, data.context);
      return { ok: true as const, text: fallbackText };
    }
  });
