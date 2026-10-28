import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SAMPLE_PROFILE, analyseHealth, predictRisk, recommend } from "./engine";
import type { FinancialProfile, Goal, HealthReport, Recommendation, RiskPrediction } from "./types";
import { supabase } from "@/integrations/supabase/client";

const PROFILE_STORAGE_KEY = "finadvisor_profile_v2";
const SESSION_STORAGE_KEY = "finadvisor_session_v2";

export interface Session {
  id?: string;
  name: string;
  email: string;
  isDemo?: boolean;
}

interface ProfileContextType {
  hydrated: boolean;
  profile: FinancialProfile;
  session: Session | null;
  loading: boolean;
  updateProfile: (patch: Partial<FinancialProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  signInDemo: (customName?: string) => void;
  signInWithSupabase: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithSupabase: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FinancialProfile>(SAMPLE_PROFILE);
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to persist profile locally
  const persistLocal = useCallback((p: FinancialProfile) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* ignore local storage issues */
    }
  }, []);

  // Fetch remote profile from Supabase if logged in
  const fetchRemoteProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!error && data) {
          const loaded: FinancialProfile = {
            name: data.name || SAMPLE_PROFILE.name,
            age: Number(data.age) || SAMPLE_PROFILE.age,
            occupation: data.occupation || SAMPLE_PROFILE.occupation,
            dependents: Number(data.dependents) ?? SAMPLE_PROFILE.dependents,
            monthlyIncome: Number(data.monthly_income) || SAMPLE_PROFILE.monthlyIncome,
            monthlyExpenses: Number(data.monthly_expenses) ?? SAMPLE_PROFILE.monthlyExpenses,
            monthlyEmi: Number(data.monthly_emi) ?? SAMPLE_PROFILE.monthlyEmi,
            currentSavings: Number(data.current_savings) ?? SAMPLE_PROFILE.currentSavings,
            existingInvestments:
              Number(data.existing_investments) ?? SAMPLE_PROFILE.existingInvestments,
            monthlyInvestment: Number(data.monthly_investment) ?? SAMPLE_PROFILE.monthlyInvestment,
            horizonYears: Number(data.horizon_years) || SAMPLE_PROFILE.horizonYears,
            riskTolerance: Number(data.risk_tolerance) || SAMPLE_PROFILE.riskTolerance,
            incomeStability: Number(data.income_stability) || SAMPLE_PROFILE.incomeStability,
            goals: Array.isArray(data.goals) ? (data.goals as unknown as Goal[]) : SAMPLE_PROFILE.goals,
          };
          setProfile(loaded);
          persistLocal(loaded);
          return;
        }
      } catch (e) {
        console.warn("Could not query Supabase profiles table, falling back to local storage:", e);
      }
    },
    [persistLocal],
  );

  // Initial hydration: check Supabase session & local storage
  useEffect(() => {
    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const user = data.session.user;
          const metaName = (user.user_metadata as Record<string, unknown> | undefined)?.["name"];
          const userSession: Session = {
            id: user.id,
            name: typeof metaName === "string" ? metaName : user.email?.split("@")[0] || "User",
            email: user.email || "",
            isDemo: false,
          };
          setSession(userSession);
          await fetchRemoteProfile(user.id);
        } else {
          const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
          if (storedSession) {
            setSession(JSON.parse(storedSession) as Session);
          }
          const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
          if (storedProfile) {
            setProfile({ ...SAMPLE_PROFILE, ...(JSON.parse(storedProfile) as FinancialProfile) });
          }
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err);
      } finally {
        setHydrated(true);
      }
    }

    initAuth();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession?.user) {
          const user = currentSession.user;
          const metaName = (user.user_metadata as Record<string, unknown> | undefined)?.["name"];
          const newSession: Session = {
            id: user.id,
            name: typeof metaName === "string" ? metaName : user.email?.split("@")[0] || "User",
            email: user.email || "",
            isDemo: false,
          };
          setSession(newSession);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
          } catch {}
          await fetchRemoteProfile(user.id);
        } else if (event === "SIGNED_OUT") {
          setSession((prev) => (prev?.isDemo ? prev : null));
        }
      },
    );

    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, [fetchRemoteProfile]);

  // Update profile in state, localStorage, and Supabase database if logged in
  const updateProfile = useCallback(
    async (patch: Partial<FinancialProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        persistLocal(next);

        if (session?.id && !session.isDemo) {
          supabase
            .from("profiles")
            .upsert({
              id: session.id,
              name: next.name,
              age: next.age,
              occupation: next.occupation,
              dependents: next.dependents,
              monthly_income: next.monthlyIncome,
              monthly_expenses: next.monthlyExpenses,
              monthly_emi: next.monthlyEmi,
              current_savings: next.currentSavings,
              existing_investments: next.existingInvestments,
              monthly_investment: next.monthlyInvestment,
              horizon_years: next.horizonYears,
              risk_tolerance: next.riskTolerance,
              income_stability: next.incomeStability,
              goals: next.goals as unknown as import("@/integrations/supabase/types").Json,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) {
                console.warn("Supabase profile upsert notice:", error.message);
              }
            });
        }
        return next;
      });
    },
    [persistLocal, session],
  );

  const resetProfile = useCallback(async () => {
    setProfile(SAMPLE_PROFILE);
    persistLocal(SAMPLE_PROFILE);
    if (session?.id && !session.isDemo) {
      await updateProfile(SAMPLE_PROFILE);
    }
  }, [persistLocal, session, updateProfile]);

  // Goal operations
  const addGoal = useCallback(
    async (goal: Goal) => {
      await updateProfile({ goals: [...profile.goals, goal] });
    },
    [profile.goals, updateProfile],
  );

  const updateGoal = useCallback(
    async (id: string, patched: Partial<Goal>) => {
      const updated = profile.goals.map((g) => (g.id === id ? { ...g, ...patched } : g));
      await updateProfile({ goals: updated });
    },
    [profile.goals, updateProfile],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const filtered = profile.goals.filter((g) => g.id !== id);
      await updateProfile({ goals: filtered });
    },
    [profile.goals, updateProfile],
  );

  // Authentication methods
  const signInDemo = useCallback((customName?: string) => {
    const demoSession: Session = {
      name: customName || SAMPLE_PROFILE.name,
      email: "demo.investor@finadvisor.ai",
      isDemo: true,
    };
    setSession(demoSession);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoSession));
    } catch {}
  }, []);

  const signInWithSupabase = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data?.user) {
        const metaName = (data.user.user_metadata as Record<string, unknown> | undefined)?.[
          "name"
        ];
        const s: Session = {
          id: data.user.id,
          name: typeof metaName === "string" ? metaName : email.split("@")[0] || "User",
          email,
          isDemo: false,
        };
        setSession(s);
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
        } catch {}
      }
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      return { error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithSupabase = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) return { error: error.message };
        if (data?.user) {
          const s: Session = {
            id: data.user.id,
            name,
            email,
            isDemo: false,
          };
          setSession(s);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
          } catch {}
          const newProfile = { ...SAMPLE_PROFILE, name };
          setProfile(newProfile);
          persistLocal(newProfile);
        }
        return {};
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Registration failed";
        return { error: message };
      } finally {
        setLoading(false);
      }
    },
    [persistLocal],
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      profile,
      session,
      loading,
      updateProfile,
      resetProfile,
      addGoal,
      updateGoal,
      deleteGoal,
      signInDemo,
      signInWithSupabase,
      signUpWithSupabase,
      signOut,
    }),
    [
      hydrated,
      profile,
      session,
      loading,
      updateProfile,
      resetProfile,
      addGoal,
      updateGoal,
      deleteGoal,
      signInDemo,
      signInWithSupabase,
      signUpWithSupabase,
      signOut,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

export interface AnalysisResult {
  health: HealthReport;
  risk: RiskPrediction;
  recommendation: Recommendation;
}

export function useAnalysis(): AnalysisResult {
  const { profile } = useProfile();
  return useMemo(() => {
    const health = analyseHealth(profile);
    const risk = predictRisk(profile);
    const recommendation = recommend(profile, risk);
    return { health, risk, recommendation };
  }, [profile]);
}
