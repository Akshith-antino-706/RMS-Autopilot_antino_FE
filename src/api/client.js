const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://qh6hjtm8-4000.inc1.devtunnels.ms";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  const options = { method, headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loginUser(credentials) {
  return request("/auth/login", { method: "POST", body: credentials });
}

export function getUserProfile({ userId, token }) {
  return request(`/users/${userId}`, { token });
}

export function getDailyLesson({ userId, token, dateISO }) {
  return request(`/learning/${userId}/daily`, { method: "POST", token, body: { dateISO } });
}

export function getAssessmentHistory({ userId, token }) {
  return request(`/assessment/${userId}/history`, { token });
}

export function submitAssessmentResult({ userId, token, dateISO, unitId, topic, score, answers }) {
  return request(`/assessment/${userId}/${dateISO}`, {
    method: "POST",
    token,
    body: {
      unitId,
      topic,
      score,
      answers,
    },
});
}

export function getStreakOverview({ userId, token }) {
  return request(`/streaks/${userId}`, { token });
}

export function getLeaderboard({ token, skill, role, level, metric }) {
  const params = new URLSearchParams();
  if (skill) params.set("skill", skill);
  if (role) params.set("role", role);
  if (level) params.set("level", level);
  if (metric) params.set("metric", metric);
  const qs = params.toString();
  return request(`/leaderboard${qs ? `?${qs}` : ""}`, { token });
}

export function getWeeklyChallenge({ userId, token }) {
  return request(`/weekly-challenge/${userId}/current`, { token });
}

export function submitWeeklyChallenge({ userId, challengeId, token, solutions }) {
  return request(`/weekly-challenge/${userId}/${challengeId}/submit`, {
    method: "POST",
    token,
    body: { solutions },
  });
}
