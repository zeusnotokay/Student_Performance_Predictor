import { getToken } from "@/lib/auth";

/** Frontend service for the real Flask + ML prediction API. */

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type StudentFormData = {
  studentId: string;
  age: number;
  gender: string;
  department: string;
  year: string;
  previousMarks: number;
  internalMarks: number;
  assignmentScore: number;
  attendance: number;
  backlogs: number;
  studyHours: number;
  sleepHours: number;
  previousExamScore: number;
  extracurricular: boolean;
  resources: "good" | "limited" | "none";
};

export type RiskLevel = "Low" | "Moderate" | "High";

export type PredictionResult = {
  id?: number;
  studentId: string;
  score: number;
  status: string;
  grade: string;
  risk: RiskLevel;
  attendance: number;
  studyHours: number;
  insights: string[];
  recommendations: { title: string; detail: string }[];
};

export async function predictPerformance(data: StudentFormData): Promise<PredictionResult> {
  const response = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Unable to connect to the prediction server.");
  return payload.data as PredictionResult;
}

export type DashboardData = {
  total: number;
  average: number;
  distribution: { performance: string; count: number }[];
  latest: Record<string, unknown> | null;
};

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API_URL}/api/dashboard`, { headers: authHeaders() });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Unable to load dashboard data.");
  return payload.data as DashboardData;
}

export type FeatureImportanceItem = { name: string; value: number };

export async function getFeatureImportance(): Promise<FeatureImportanceItem[]> {
  const response = await fetch(`${API_URL}/api/feature-importance`, { headers: authHeaders() });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Unable to load feature importance.");
  return payload.data as FeatureImportanceItem[];
}

export type ModelInfo = {
  model_name: string;
  r2: number;
  features: string[];
  feature_count: number;
};

export async function getModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${API_URL}/api/model-info`, { headers: authHeaders() });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Unable to load model info.");
  return payload.data as ModelInfo;
}

export type GoalSuggestion = { field: string; message: string; priority: "high" | "medium" | "low" };
export type GoalResult = {
  currentScore: number;
  targetScore: number;
  gap: number;
  suggestions: GoalSuggestion[];
};

export async function getGoalSuggestion(data: StudentFormData & { targetScore: number }): Promise<GoalResult> {
  const response = await fetch(`${API_URL}/api/goal-suggestion`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? "Unable to calculate goal suggestion.");
  return payload.data as GoalResult;
}

const KEY = "spp:last-prediction";
export function saveLastPrediction(r: PredictionResult) {
  try { sessionStorage.setItem(KEY, JSON.stringify(r)); } catch { /* ignore */ }
}
export function loadLastPrediction(): PredictionResult | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v ? (JSON.parse(v) as PredictionResult) : null;
  } catch { return null; }
}
