import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { outingAPI } from "../utils/api";
import { useToast } from "../components/Toast";

const STATUS_COLORS = {
  PENDING:  { bg: "rgba(251,191,36,0.10)",  color: "#fbbf24", border: "rgba(251,191,36,0.20)" },
  APPROVED: { bg: "rgba(52,211,153,0.10)",  color: "var(--green)", border: "rgba(52,211,153,0.20)" },
  OUT:      { bg: "rgba(129,140,248,0.10)", color: "var(--accent)", border: "rgba(129,140,248,0.20)" },
  OVERDUE:  { bg: "rgba(251,113,133,0.10)", color: "var(--red)", border: "rgba(251,113,133,0.20)" },
  RETURNED: { bg: "rgba(113,113,122,0.10)", color: "var(--text-3)", border: "rgba(113,113,122,0.20)" },
};

const FLAG_COLORS = {
  MEDICAL_EMERGENCY: "var(--red)", URGENT: "var(--orange)", ROUTINE: "var(--green)", SUSPICIOUS: "var(--purple)",
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function formatDT(dt) {
  if (!dt) return "\u2014";
  try { return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return "\u2014"; }
}

export default function StudentPortal() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("apply");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const minDT = new Date(now.getTime() + 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    studentId: user?.name || "",
    studentName: user?.name || "",
    parentEmail: "",
    reason: "",
    destination: "",
    outDate: "",
    returnDate: "",
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const loadHistory = async (id) => {
    const searchId = id || form.studentId;
    if (!searchId.trim()) return toast("Enter a Student ID to search", "warn");
    setHistoryLoading(true);
    try {
      const data = await outingAPI.getStudentHistory(searchId.trim());
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      toast("Could not load history: " + err.message, "error");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const switchToHistory = () => {
    setTab("history");
    loadHistory(user?.name);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    const required = ["studentId", "studentName", "parentEmail", "reason", "destination", "outDate", "returnDate"];
    for (const f of required) {
      if (!form[f]) return toast(`${f.replace(/([A-Z])/g, " $1")} is required`, "warn");
    }
    if (!form.parentEmail.includes("@")) return toast("Invalid parent email", "warn");
    if (new Date(form.outDate) >= new Date(form.returnDate))
      return toast("Return date must be after out date", "warn");

    setSubmitting(true);
    try {
      await outingAPI.apply({
        ...form,
        outDate: new Date(form.outDate).toISOString(),
        returnDate: new Date(form.returnDate).toISOString(),
      });
      toast("Outing request submitted successfully!", "success");
      setForm((p) => ({ ...p, reason: "", destination: "", outDate: "", returnDate: "", parentEmail: "" }));
      switchToHistory();
    } catch (err) {
      const msg = err.message || "Submission failed";
      if (msg.includes("active") || msg.includes("approved") || msg.includes("APPROVED"))
        toast("You already have an active or approved outing request.", "warn");
      else if (msg.includes("banned") || msg.includes("Denied") || msg.includes("overdue") || msg.includes("blacklist"))
        toast("You are banned due to overdue outings. Contact the warden.", "error");
      else
        toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)" />
                <path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={styles.brandName}>SmartOuting</div>
              <div style={styles.brandRole}>Student Portal</div>
            </div>
          </div>

          <div style={styles.userCard}>
            <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "S"}</div>
            <div>
              <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>Student</div>
            </div>
          </div>

          <nav style={styles.nav}>
            {[
              { id: "apply",   label: "Apply for Outing", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
              { id: "history", label: "My Requests",       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === "history" ? switchToHistory() : setTab(item.id)}
                style={{ ...styles.navBtn, ...(tab === item.id ? styles.navBtnActive : {}) }}
              >
                <span style={{display:"flex",color:tab===item.id?"var(--accent)":"var(--text-4)"}}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* APPLY TAB */}
        {tab === "apply" && (
          <div style={styles.content}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Apply for Outing</h1>
              <p style={styles.pageDesc}>Submit a new outing request. AI will analyse your request automatically.</p>
            </div>

            <form onSubmit={handleApply} style={styles.formCard}>
              <div style={styles.formGrid}>
                <Field label="Student ID" name="studentId" value={form.studentId} onChange={handleChange} placeholder="Your student ID" />
                <Field label="Full Name"  name="studentName" value={form.studentName} onChange={handleChange} placeholder="Your full name" />
                <Field label="Parent / Guardian Email" name="parentEmail" value={form.parentEmail} onChange={handleChange} type="email" placeholder="parent@email.com" span={2} />
                <Field label="Destination" name="destination" value={form.destination} onChange={handleChange} placeholder="Where are you going?" span={2} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={styles.fieldLabel}>Reason for Outing</label>
                  <textarea
                    name="reason" value={form.reason} onChange={handleChange}
                    placeholder="Describe why you need to go out in detail..."
                    rows={3} style={styles.textarea}
                  />
                </div>
                <Field label="Out Date & Time"    name="outDate"    value={form.outDate}    onChange={handleChange} type="datetime-local" min={minDT} />
                <Field label="Return Date & Time" name="returnDate" value={form.returnDate} onChange={handleChange} type="datetime-local" min={minDT} />
              </div>

              <div style={styles.formFooter}>
                <div style={styles.aiNote}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                    Your request will be <strong style={{ color: "var(--accent)" }}>AI-analysed</strong> for urgency.
                  </span>
                </div>
                <button type="submit" disabled={submitting} style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div style={styles.content}>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>My Requests</h1>
                <p style={styles.pageDesc}>{history.length} total request(s)</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  placeholder="Student ID..."
                  style={styles.searchInput}
                />
                <button onClick={() => loadHistory()} style={styles.searchBtn} disabled={historyLoading}>
                  {historyLoading ? "..." : "Search"}
                </button>
              </div>
            </div>

            {historyLoading && (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 28, height: 28, border: "2px solid var(--border-2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-3)", fontSize: 13 }}>Loading requests...</p>
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div style={styles.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" style={{marginBottom:12}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 15 }}>No requests found</div>
                <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Apply for your first outing or check your Student ID.</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((o) => (
                <div key={o.id} style={styles.historyCard}>
                  <div style={styles.historyTop}>
                    <div>
                      <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 14 }}>#{o.id} \u2014 {o.destination}</div>
                      <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{o.reason}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <StatusBadge status={o.status} />
                      {o.aiFlag && (
                        <span style={{ fontSize: 11, color: FLAG_COLORS[o.aiFlag] || "var(--text-3)", fontWeight: 500 }}>
                          {o.aiFlag} (Score: {o.urgencyScore})
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={styles.historyMeta}>
                    <span>Out: {formatDT(o.outDate)}</span>
                    <span>Return: {formatDT(o.returnDate)}</span>
                    {o.wardenComment && <span>&quot;{o.wardenComment}&quot;</span>}
                  </div>
                  {o.qrCodeUrl && (o.status === "APPROVED") && (
                    <div style={{ marginTop: 12, padding: 14, background: "rgba(52,211,153,0.06)", borderRadius: 8, border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Approved \u2014 Show this QR to the guard</div>
                      <img src={o.qrCodeUrl} alt="QR Code" style={{ width: 110, height: 110, borderRadius: 6, background: "white", padding: 4 }} />
                      <div style={{ color: "var(--text-4)", fontSize: 11, marginTop: 6 }}>Outing ID: #{o.id}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        input, textarea, select { color-scheme: dark; }
        textarea::placeholder, input::placeholder { color: var(--text-4); }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, span, min }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
      <label style={styles.fieldLabel}>{label}</label>
      <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} min={min} style={styles.formInput} />
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', sans-serif" },
  sidebar: { width: 248, background: "var(--bg-2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 14px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 },
  sideTop: { display: "flex", flexDirection: "column", gap: 20 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "0 6px" },
  brandIcon: { width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)", border: "1px solid rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandName: { fontSize: 14, fontWeight: 700, color: "var(--text-1)" },
  brandRole: { fontSize: 11, color: "var(--text-4)", marginTop: 1 },
  userCard: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-3)", borderRadius: 8, border: "1px solid var(--border)" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "var(--accent-2)", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 7, border: "1px solid transparent", background: "none", color: "var(--text-3)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%", fontFamily: "'Inter', sans-serif" },
  navBtnActive: { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(129,140,248,0.15)", fontWeight: 600 },
  logoutBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 7, border: "1px solid var(--border-2)", background: "none", color: "var(--text-4)", fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "'Inter', sans-serif" },
  main: { flex: 1, overflow: "auto", padding: "28px 36px" },
  content: { maxWidth: 840, margin: "0 auto", animation: "fadeIn 0.3s ease" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.3px" },
  pageDesc: { color: "var(--text-3)", fontSize: 14, marginTop: 4 },
  formCard: { background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  fieldLabel: { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 },
  formInput: { width: "100%", padding: "10px 12px", background: "var(--bg-3)", border: "1px solid var(--border-3)", borderRadius: 7, color: "var(--text-1)", fontSize: 14, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" },
  textarea: { width: "100%", padding: "10px 12px", resize: "vertical", background: "var(--bg-3)", border: "1px solid var(--border-3)", borderRadius: 7, color: "var(--text-1)", fontSize: 14, outline: "none" },
  formFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" },
  aiNote: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--accent-dim)", border: "1px solid rgba(129,140,248,0.12)", borderRadius: 7, flex: 1 },
  submitBtn: { padding: "11px 22px", background: "var(--accent-2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  searchInput: { padding: "8px 12px", background: "var(--bg-3)", border: "1px solid var(--border-3)", borderRadius: 7, color: "var(--text-1)", fontSize: 13, outline: "none", width: 180 },
  searchBtn: { padding: "8px 16px", background: "var(--accent-dim)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 7, color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "var(--bg-2)", borderRadius: 12, border: "1px dashed var(--border-2)" },
  historyCard: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", transition: "border-color 0.2s", animation: "fadeIn 0.3s ease" },
  historyTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  historyMeta: { display: "flex", gap: 18, marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-3)" },
};
