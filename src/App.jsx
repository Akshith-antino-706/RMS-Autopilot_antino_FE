import React, { useCallback, useEffect, useState } from "react";
import {
  loginUser,
  getUserProfile,
  getDailyLesson,
  getAssessmentHistory,
  submitAssessmentResult,
  getStreakOverview,
  getLeaderboard,
  getWeeklyChallenge,
  submitWeeklyChallenge,
} from "./api/client";
import "./index.css";
import Runner from "./assets/dev-runner.svg";

const SESSION_KEY = "rms_autopilot_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSessionStorage() {
  localStorage.removeItem(SESSION_KEY);
}

function isoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!session) return;
    let active = true;
    (async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const data = await getUserProfile({ userId: session.userId, token: session.token });
        if (active) setProfile(data);
      } catch (error) {
        if (active) setProfileError(error.message || "Unable to load profile");
      } finally {
        if (active) setProfileLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [session]);

  const initials = profile?.name ? profile.name.trim().slice(0, 1).toUpperCase() : "U";

  const handleLogin = (nextSession) => {
    persistSession(nextSession);
    setSession(nextSession);
  };

  const handleLogout = () => {
    clearSessionStorage();
    setSession(null);
    setProfile(null);
    setProfileError("");
  };

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <h1>RMS Autopilot</h1>
          <p>AI Microlearning & Skill Reinforcement (MVP)</p>
        </div>
        {session && profile ? (
          <div className="userchip">
            <div className="avatar">{initials}</div>
            <div className="meta">
              <div className="name">{profile.name}</div>
              <div className="sub">
                {profile.role} • {profile.skill} • {profile.level}
              </div>
            </div>
            <Button onClick={handleLogout}>Log out</Button>
          </div>
        ) : null}
      </div>

      {!session ? (
        <>
          <Auth onLogin={handleLogin} />
          <div className="runnerLane" aria-hidden="true">
            <img src={Runner} alt="" className="runnerSprite" draggable="false" />
            <div className="runnerSword" />
          </div>
        </>
      ) : profileLoading ? (
        <Card title="Loading profile">Syncing your workspace…</Card>
      ) : profileError ? (
        <Card title="Unable to load profile">
          <div className="prose">{profileError}</div>
          <div className="btnRow">
            <Button onClick={handleLogout}>Log out</Button>
          </div>
        </Card>
      ) : profile ? (
        <Dashboard auth={session} profile={profile} />
      ) : (
        <Card title="Loading…">Preparing dashboard…</Card>
      )}

      <div className="footer">MVP demo: backend-connected autopilot with AI fallback generation.</div>
    </div>
  );
}

function Card({ title, right, children, className = "" }) {
  const cardClass = className ? `card ${className}` : "card";
  return (
    <div className={cardClass}>
      {(title || right) && (
        <div className="cardHeader">
          <div className="cardTitle">{title}</div>
          <div className="cardRight">{right}</div>
        </div>
      )}
      <div className="cardBody">{children}</div>
    </div>
  );
}

function Button({ children, onClick, disabled, variant = "ghost", type }) {
  const cls = variant === "primary" ? "btn btnPrimary" : "btn";
  return (
    <button type={type} className={cls} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function Auth({ onLogin }) {
  const [email, setEmail] = useState("dev@demo.com");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const session = await loginUser({ email, password });
      onLogin(session);
    } catch (error) {
      setErr(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginShell">
      <div className="loginGlow" />
      <div className="loginHero">
        <div className="heroBadge">SkillUp 2025</div>
        <h2>Level up faster with purposeful practice.</h2>
        <p>
          Daily micro-units crafted around your stack, assessments that adapt to your seniority, and instant feedback so every rep compounds. Antino Labs powers your growth with an
          intentional habit loop—learn, assess, reflect.
        </p>
        <div className="heroMetrics">
          <div className="metricCard">
            <div className="metricValue">+5 min</div>
            <div className="metricLabel">Daily focus burst</div>
          </div>
          <div className="metricCard">
            <div className="metricValue">92%</div>
            <div className="metricLabel">Skill retention</div>
          </div>
          <div className="metricCard">
            <div className="metricValue">AI + Mentors</div>
            <div className="metricLabel">Guided by industry leaders</div>
          </div>
        </div>
        <div className="heroList">
          <div className="heroListItem">
            <span>⚡</span>
            Adaptive lessons synthesized from your role, level, and preferred stack.
          </div>
          <div className="heroListItem">
            <span>🎯</span>
            Assessments shift in difficulty as you improve, keeping momentum steady.
          </div>
          <div className="heroListItem">
            <span>🤝</span>
            Community leaderboard & streaks fuel a friendly push toward mastery.
          </div>
        </div>
      </div>

      <div className="loginPanel">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">Sign in to continue</div>
            <div className="panelSubtitle">One unit per day. Real feedback. Nothing to configure.</div>
          </div>
          <span className="panelBadge">Antino Labs</span>
        </div>

        <form onSubmit={handleLogin} className="loginForm">
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="label" style={{ marginTop: 12 }}>
            Password
          </label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {err ? <div className="formError">{err}</div> : null}

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Checking…" : "Log in"}
          </Button>

          <div className="demoHint">
            Demo users: <strong>dev@demo.com</strong> / demo, <strong>mgr@demo.com</strong> / demo
          </div>
        </form>

        <div className="panelFooter">
          <div>
            <div className="footTitle">Growth at Antino Labs</div>
            <div className="small">
              We invest deeply in our people through real project ownership, continuous learning programs, and daily skill reinforcement. Your success is our success—and we build
              both, together.
            </div>
          </div>
          <div className="footPulse">
            <div className="pulseDot" />
            Live • Active cohorts
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ auth, profile }) {
  const todayISO = isoDate();
  const isWeeklyChallengeDay = new Date().getDay() === 5;
  const [tab, setTab] = useState("today");
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [unitState, setUnitState] = useState({ data: null, loading: false, error: "" });
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);
  const [weeklyChallengeLoading, setWeeklyChallengeLoading] = useState(false);
  const [weeklyChallengeError, setWeeklyChallengeError] = useState("");
  const [weeklyChallengeSubmitting, setWeeklyChallengeSubmitting] = useState(false);
  const [weeklyChallengeSubmitError, setWeeklyChallengeSubmitError] = useState("");

  const token = auth?.token;

  const loadHistory = useCallback(async () => {
    if (!token) return;
    const list = await getAssessmentHistory({ userId: profile.id, token });
    setHistory(Array.isArray(list) ? list : []);
  }, [token, profile.id]);

  const loadStreak = useCallback(async () => {
    if (!token) return;
    const summary = await getStreakOverview({ userId: profile.id, token });
    setStreak(summary || null);
  }, [token, profile.id]);

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const lb = await getLeaderboard({
        token,
        role: profile.role,
        skill: profile.skill,
        level: profile.level,
      });
      setLeaderboard(Array.isArray(lb) ? lb : []);
    } catch (error) {
      setLeaderboardError(error.message || "Unable to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [token, profile.role, profile.skill, profile.level]);

  const loadWeeklyChallenge = useCallback(async () => {
    if (!token) return;
    setWeeklyChallengeLoading(true);
    setWeeklyChallengeError("");
    try {
      const data = await getWeeklyChallenge({ userId: profile.id, token });
      setWeeklyChallenge(data);
    } catch (error) {
      setWeeklyChallengeError(error.message || "Unable to load weekly challenge");
    } finally {
      setWeeklyChallengeLoading(false);
    }
  }, [token, profile.id]);

  const submitWeeklyChallengeSolutions = useCallback(
    async (solutions) => {
      if (!token || !weeklyChallenge) return;
      setWeeklyChallengeSubmitting(true);
      setWeeklyChallengeSubmitError("");
      try {
        const response = await submitWeeklyChallenge({
          userId: profile.id,
          challengeId: weeklyChallenge.id,
          token,
          solutions,
        });
        setWeeklyChallenge(response);
      } catch (error) {
        setWeeklyChallengeSubmitError(error.message || "Unable to submit challenge");
      } finally {
        setWeeklyChallengeSubmitting(false);
      }
    },
    [token, profile.id, weeklyChallenge],
  );

  const loadUnit = useCallback(async () => {
    if (!token) return;
    setUnitState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const lesson = await getDailyLesson({ userId: profile.id, token, dateISO: todayISO });
      setUnitState({ data: lesson, loading: false, error: "" });
    } catch (error) {
      setUnitState({ data: null, loading: false, error: error.message || "Unable to load today’s unit" });
    }
  }, [token, profile.id, todayISO]);

  const refreshSignals = useCallback(async () => {
    if (!token) return;
    setMetaLoading(true);
    setMetaError("");
    try {
      await Promise.all([loadHistory(), loadStreak()]);
    } catch (error) {
      setMetaError(error.message || "Failed to load learning signals");
    } finally {
      setMetaLoading(false);
    }
  }, [token, loadHistory, loadStreak]);

  useEffect(() => {
    refreshSignals();
    loadUnit();
    loadLeaderboard();
    if (isWeeklyChallengeDay) {
      loadWeeklyChallenge();
    } else {
      setWeeklyChallenge(null);
      setWeeklyChallengeError("");
    }
  }, [refreshSignals, loadUnit, loadLeaderboard, loadWeeklyChallenge, isWeeklyChallengeDay]);

  const last7 = history.slice(0, 7);
  const avg = last7.length ? last7.reduce((sum, record) => sum + (record.score || 0), 0) / last7.length : null;

  return (
    <div className="dashboardShell">
      <div className="dashboardGlow" />
      <div className="grid dashboardGrid">
        <div className="dashboardMain">
          <Card className="signalsCard" title="Your signals" right={`Today: ${todayISO}`}>
            <div className="signalsBanner">
              <div>
                <div className="badge">Role-fit</div>
                <div className="signalsTitle">{profile.role}</div>
                <div className="signalsHint">
                  {profile.skill} • {profile.level}
                </div>
              </div>
              <div className="signalsPulse">
                <div className="pulseDot" />
                Live streak tracking
              </div>
            </div>
            <div className="kpis">
              <div className="kpi">
                <div className="label">Streak</div>
                <div className="value">🔥 {streak?.currentStreak || 0}</div>
                <div className="hint">Complete once per day to keep it alive</div>
              </div>
            <div className="kpi">
              <div className="label">Days active</div>
              <div className="value">📅 {streak?.totalDaysActive || history.length || 0}</div>
              <div className="hint">Daily consistency wins</div>
            </div>
            <div className="kpi">
              <div className="label">Accuracy (last {last7.length})</div>
              <div className="value">✅ {avg == null ? "—" : `${Math.round(avg * 100)}%`}</div>
              <div className="hint">Trends matter more than perfection</div>
            </div>
          </div>
          {metaError ? <div className="small" style={{ color: "#fb7185", marginTop: 8 }}>{metaError}</div> : null}

            <div className="tabs">
              <button className={`tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}>
                Today
              </button>
              <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
                History
              </button>
            </div>
          </Card>

          {tab === "today" ? (
            <TodayFlow
              auth={auth}
              profile={profile}
              unitState={unitState}
              history={history}
              onAssessmentComplete={async () => {
                await refreshSignals();
                await loadUnit();
              }}
            />
          ) : (
            <HistoryView history={history} loading={metaLoading} />
          )}

          {isWeeklyChallengeDay ? (
            <WeeklyChallengePanel
              challenge={weeklyChallenge}
              loading={weeklyChallengeLoading}
              error={weeklyChallengeError}
              submitting={weeklyChallengeSubmitting}
              submitError={weeklyChallengeSubmitError}
              onRefresh={loadWeeklyChallenge}
              onSubmit={submitWeeklyChallengeSolutions}
            />
          ) : (
            <WeeklyChallengeLockedCard />
          )}
        </div>

        <div className="dashboardSide">
          <Card className="infoCard" title="How it works">
            <div className="prose">
              <strong>Autopilot</strong> generates one unit daily per user, personalized by role/skill/level.
              <div className="hr" />
              <div className="prose">
                <div>• Read: ~5 minutes</div>
                <div>• Assess: 4 quick questions</div>
                <div>• Feedback: instant, with explanations</div>
              </div>
              <div className="hr" />
              <div className="small">Next: plug in a real AI API for content generation.</div>
            </div>
          </Card>

          <Card className="infoCard momentumCard" title="Momentum tips">
            <div className="prose">
              <div className="heroListItem">
                <span>🧠</span> Skim the concept, then jump straight to scenario for better recall.
              </div>
              <div className="heroListItem">
                <span>📈</span> Keep streaks alive—even 1 correct answer reinforces memory.
              </div>
              <div className="heroListItem">
                <span>🤖</span> Feedback adapts with your level; revisit explanations for shortcuts.
              </div>
            </div>
          </Card>

          <Card className="leaderboardCard" title="Leaderboard" right={leaderboardLoading ? "Loading…" : undefined}>
            {leaderboardError ? (
              <div className="small" style={{ color: "#fb7185" }}>{leaderboardError}</div>
            ) : leaderboard.length === 0 ? (
              <div className="small" style={{ color: "rgba(231,234,242,0.75)" }}>No entries yet. Complete assessments to climb the board.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <div key={entry.userId} className="qCard boardRow">
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        #{idx + 1} {entry.name}
                      </div>
                      <div className="small">
                        {entry.role} • {entry.skill} • {entry.level}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900 }}>{entry.metricValue}</div>
                      <div className="small">{entry.metricLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function TodayFlow({ auth, profile, unitState, history, onAssessmentComplete }) {
  const { data: unit, loading, error } = unitState;
  const [step, setStep] = useState("read");
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverFeedback, setServerFeedback] = useState("");

  useEffect(() => {
    setStep("read");
    setAnswers({});
    setResults(null);
    setSubmitError("");
    setServerFeedback("");
  }, [unit?.id]);

  if (loading && !unit) return <Card className="flowCard" title="Today’s microlearning">Generating…</Card>;
  if (error && !unit) return <Card className="flowCard" title="Today’s microlearning">{error}</Card>;
  if (!unit) return null;

  const alreadyCompleted = history.some((record) => record.dateISO === unit.dateISO);
  const recordForDay = history.find((record) => record.dateISO === unit.dateISO);
  const performanceFeedback = serverFeedback || recordForDay?.feedback || "";
  const stepView = alreadyCompleted ? "done" : step;

  async function submitAssessment() {
    const evalRes = evaluate(unit.assessment, answers);
    setResults(evalRes);
    setSubmitError("");
    setSubmitting(true);

    try {
      const response = await submitAssessmentResult({
        userId: profile.id,
        token: auth.token,
        dateISO: unit.dateISO,
        unitId: unit.id || `${profile.id}-${unit.dateISO}`,
        topic: unit.topic,
        score: evalRes.score,
        answers: buildAnswerPayload(unit.assessment, answers),
      });
      setServerFeedback(response?.feedback || "");
      if (onAssessmentComplete) {
        await onAssessmentComplete();
      }
      setStep("done");
    } catch (error) {
      setSubmitError(error.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {stepView === "read" && (
        <Card className="flowCard" title="Today’s microlearning" right={`~${unit.content.durationMinutes} minutes`}>
          <div className="pills">
            <Pill>Topic: {unit.topic}</Pill>
            <Pill>Tone: {unit.content.tone}</Pill>
            <Pill>Date: {unit.dateISO}</Pill>
          </div>

          <div className="prose">
            <div className="sectionTitle">Concept</div>
            <div dangerouslySetInnerHTML={{ __html: mdBold(unit.content.concept) }} />
          </div>

          <div className="btnRow">
            <Button variant="primary" onClick={() => setStep("assess")}>
              Start micro-assessment
            </Button>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            One unit per day. No scheduling. No admin content uploads (MVP behavior).
          </div>
        </Card>
      )}

      {stepView === "assess" && (
        <Card className="flowCard" title="Micro-assessment" right={`${unit.assessment.length} questions`}>
          <Assessment questions={unit.assessment} answers={answers} setAnswers={setAnswers} />
          <div className="btnRow">
            <Button onClick={() => setStep("read")}>Back</Button>
            <Button
              variant="primary"
              onClick={submitAssessment}
              disabled={!isAssessmentComplete(unit.assessment, answers) || submitting}
            >
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
          {submitError ? <div className="small" style={{ marginTop: 10, color: "#fb7185" }}>{submitError}</div> : null}
          <div className="small" style={{ marginTop: 10 }}>
            These questions test application and judgment—not trivia.
          </div>
        </Card>
      )}

      {stepView === "done" && (
        <Card className="flowCard" title="Done for today ✅" right={unit.dateISO}>
          {alreadyCompleted && !results ? (
            <div className="prose">You already completed today’s unit. Come back tomorrow for a new one.</div>
          ) : (
            <>
              <div className="pills">
                <Pill>Score: {Math.round((results?.score || 0) * 100)}%</Pill>
                <Pill>
                  Correct: {results?.correctCount}/{results?.totalCount}
                </Pill>
              </div>

              <div className="sectionTitle">Instant feedback</div>
              <Feedback questions={unit.assessment} results={results} />
            </>
          )}
          {performanceFeedback ? (
            <div className="serverFeedback">
              <div className="serverFeedbackTitle">Coach feedback</div>
              <div>{performanceFeedback}</div>
            </div>
          ) : null}
        </Card>
      )}
    </>
  );
}

function buildAnswerPayload(questions, answers) {
  return questions.map((q) => {
    const entry = answers[q.id];
    if (q.type === "mcq") {
      const choiceIndex = typeof entry?.choiceIndex === "number" ? entry.choiceIndex : null;
      return {
        questionId: q.id,
        value: choiceIndex != null ? q.options[choiceIndex] : "",
      };
    }
    return {
      questionId: q.id,
      value: entry?.text || "",
    };
  });
}

function Assessment({ questions, answers, setAnswers }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {questions.map((q) => (
        <div key={q.id} className="qCard">
          <div className="qHeader">
            <div style={{ fontWeight: 900 }}>Q{q.id}</div>
            <span className="badge">{q.type.toUpperCase()}</span>
          </div>

          <div className="prose" style={{ whiteSpace: "pre-wrap", marginBottom: 10 }}>
            {q.prompt}
          </div>

          {q.type === "mcq" ? (
            <div style={{ display: "grid", gap: 8 }}>
              {q.options.map((opt, idx) => {
                const selected = answers?.[q.id]?.choiceIndex === idx;
                return (
                  <label key={idx} className={`option ${selected ? "active" : ""}`}>
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: { choiceIndex: idx } }))}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              className="input"
              rows={3}
              placeholder="Type your answer…"
              value={answers?.[q.id]?.text || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { text: e.target.value } }))}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function evaluate(questions, answers) {
  let correct = 0;
  const perQ = questions.map((q) => {
    const a = answers[q.id];
    if (!a) return { id: q.id, correct: false };

    if (q.type === "mcq") {
      const ok = a.choiceIndex === q.answerIndex;
      if (ok) correct++;
      return { id: q.id, correct: ok };
    }

    const txt = (a.text || "").toLowerCase();
    const ok = (q.keywords || []).some((k) => txt.includes(String(k).toLowerCase()));
    if (ok) correct++;
    return { id: q.id, correct: ok };
  });

  const total = questions.length;
  return {
    score: total ? correct / total : 0,
    correctCount: correct,
    totalCount: total,
    perQuestion: perQ,
  };
}

function Feedback({ questions, results }) {
  if (!results) return null;
  const map = new Map(results.perQuestion.map((p) => [p.id, p.correct]));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {questions.map((q) => {
        const ok = map.get(q.id);
        return (
          <div key={q.id} className="qCard">
            <div className="qHeader">
              <div style={{ fontWeight: 900 }}>Q{q.id}</div>
              <div className={ok ? "good" : "bad"}>{ok ? "Correct" : "Needs work"}</div>
            </div>
            <div className="prose">{q.explain}</div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryView({ history, loading }) {
  const list = history.slice();

  return (
    <Card className="historyCard" title="Completion history" right={`${list.length} days`}>
      {loading ? (
        <div className="prose" style={{ color: "rgba(231,234,242,0.75)" }}>
          Loading history…
        </div>
      ) : list.length === 0 ? (
        <div className="prose" style={{ color: "rgba(231,234,242,0.75)" }}>
          No completions yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((entry) => (
            <div key={entry.dateISO} className="qCard" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900 }}>{entry.dateISO}</div>
                <div className="small">{entry.topic || "Daily unit"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900 }}>{Math.round((entry.score || 0) * 100)}%</div>
                <div className="small">
                  {entry.correctCount}/{entry.totalCount} correct
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function WeeklyChallengePanel({ challenge, loading, error, submitting, submitError, onRefresh, onSubmit }) {
  const [draftMap, setDraftMap] = useState({});
  const drafts = challenge ? draftMap[challenge.id] || {} : {};

  const handleChange = (taskId, value) => {
    if (!challenge) return;
    setDraftMap((prev) => ({
      ...prev,
      [challenge.id]: {
        ...(prev[challenge.id] || {}),
        [taskId]: value,
      },
    }));
  };

  const pendingSolutions = challenge?.tasks
    ?.map((task) => {
      const submission = challenge.submissions?.find((sub) => sub.taskId === task.id);
      const code = drafts[task.id] != null ? drafts[task.id] : submission?.code || "";
      return {
        taskId: task.id,
        code: code.trim(),
      };
    })
    .filter((entry) => entry.code.length > 0);

  if (loading && !challenge) {
    return (
      <Card className="flowCard challengeCard" title="Weekly challenge">
        <div className="prose">Tailoring prompts to your week…</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flowCard challengeCard" title="Weekly challenge" right={<Button onClick={onRefresh}>Retry</Button>}>
        <div className="prose" style={{ color: "#fb7185" }}>{error}</div>
      </Card>
    );
  }

  if (!challenge) return null;

  const weekLabel = challenge.weekLabel || challenge.weekISO;

  return (
    <Card
      className="flowCard challengeCard"
      title={`Weekly challenge · ${weekLabel}`}
      right={
        <Button onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      }
    >
      <div className="challengeHeader">
        <div>
          <div className="small">Topics reinforcing</div>
          <div className="challengeTopics">
            {challenge.summary?.topics?.slice(0, 3).map((topic) => (
              <span key={topic.topic} className={`pill pill-${topic.emphasis || "core"}`}>
                {topic.topic}
              </span>
            ))}
          </div>
        </div>
        <div className="challengeStats">
          <div>
            <div className="small">Avg score</div>
            <div className="value">{challenge.summary?.stats?.avgScore ? `${Math.round(challenge.summary.stats.avgScore * 100)}%` : "—"}</div>
          </div>
          <div>
            <div className="small">Days active</div>
            <div className="value">{challenge.summary?.stats?.completionDays || 0}</div>
          </div>
        </div>
      </div>

      <div className="challengeTaskGrid">
        {challenge.tasks?.map((task) => {
          const submission = challenge.submissions?.find((sub) => sub.taskId === task.id);
          const evaluation = submission?.evaluation;
          return (
            <div key={task.id} className="challengeTask">
              <div className="challengeTaskHeader">
                <div>
                  <div className="badge">{task.type.toUpperCase()}</div>
                  <div className="taskTitle">{task.title}</div>
                </div>
                <Pill>{task.difficulty === "advanced" ? "Stretch" : "Core"}</Pill>
              </div>
              <div className="prose" style={{ marginBottom: 10 }}>
                {task.prompt}
              </div>
              <div className="small" style={{ marginBottom: 8 }}>
                Focus on: {task.expectations?.join(" • ")}
              </div>
              <textarea
                className="input codeInput"
                rows={6}
                value={drafts[task.id] != null ? drafts[task.id] : submission?.code || ""}
                placeholder="Paste or type your solution…"
                onChange={(e) => handleChange(task.id, e.target.value)}
              />
              {submission ? (
                <div className="challengeFeedback">
                  <div className="small">Score: {submission.score != null ? `${Math.round(submission.score * 100)}%` : "Pending review"}</div>
                  {evaluation?.feedback ? <div className="prose">{evaluation.feedback}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {submitError ? <div className="small" style={{ color: "#fb7185", marginBottom: 8 }}>{submitError}</div> : null}

      <div className="btnRow">
        <Button variant="primary" onClick={() => onSubmit(pendingSolutions || [])} disabled={!pendingSolutions?.length || submitting}>
          {submitting ? "Reviewing…" : "Submit for review"}
        </Button>
        <div className="small" style={{ color: "rgba(231,234,242,0.75)" }}>AI reviewer checks topic alignment, clarity, and edge cases.</div>
      </div>
    </Card>
  );
}

function WeeklyChallengeLockedCard() {
  return (
    <Card className="flowCard challengeCard" title="Weekly challenge">
      <div className="prose">
        Weekly challenge unlocks every Friday. AI will gather your week’s topics and serve fresh coding prompts—check back at the end of the week.
      </div>
    </Card>
  );
}

function mdBold(value) {
  return String(value || "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function isAssessmentComplete(questions, answers) {
  return questions.every((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === "mcq") return typeof a.choiceIndex === "number";
    if (q.type === "short") return (a.text || "").trim().length > 0;
    return false;
  });
}
