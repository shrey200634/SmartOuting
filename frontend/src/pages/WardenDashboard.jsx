import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { outingAPI } from "../utils/api";
import { useToast } from "../components/Toast";

const STATUS_STYLES = {
  PENDING:  { bg: "rgba(251,191,36,0.10)", color: "#fbbf24", border: "rgba(251,191,36,0.20)" },
  APPROVED: { bg: "rgba(52,211,153,0.10)", color: "#34d399", border: "rgba(52,211,153,0.20)" },
  OUT:      { bg: "rgba(129,140,248,0.10)", color: "var(--accent)", border: "rgba(129,140,248,0.20)" },
  OVERDUE:  { bg: "rgba(251,113,133,0.10)", color: "#fb7185", border: "rgba(251,113,133,0.20)" },
  RETURNED: { bg: "rgba(113,113,122,0.10)", color: "var(--text-3)", border: "rgba(113,113,122,0.20)" },
};

const AI_FLAG_INFO = {
  MEDICAL_EMERGENCY: { color: "var(--red)", bg: "rgba(251,113,133,0.08)" },
  URGENT:            { color: "var(--orange)", bg: "rgba(249,115,22,0.08)" },
  ROUTINE:           { color: "var(--green)", bg: "rgba(52,211,153,0.08)" },
  SUSPICIOUS:        { color: "var(--purple)", bg: "rgba(192,132,252,0.08)" },
};

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

function AiChip({ flag, score }) {
  if (!flag) return null;
  const info = AI_FLAG_INFO[flag] || { color: "var(--text-3)", bg: "rgba(113,113,122,0.08)" };
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: info.bg, color: info.color }}>
      {flag} &middot; {score}
    </span>
  );
}

function formatDT(dt) {
  if (!dt) return "\u2014";
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function WardenDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState(null);
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState(null);
  const [commentFocused, setCommentFocused] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await outingAPI.getAll();
      setOutings(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      toast("Failed to load requests: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    if (!comment.trim()) return toast("Please enter an approval comment", "warn");
    setApproving(id);
    try {
      await outingAPI.approve(id, comment.trim());
      toast("Outing approved! QR code generated.", "success");
      setComment("");
      setSelected(null);
      load();
    } catch (err) {
      toast("Approval failed: " + err.message, "error");
    } finally {
      setApproving(null);
    }
  };

  const filtered = outings.filter((o) => {
    const matchFilter = filter === "ALL" || o.status === filter;
    const matchSearch = !search || o.studentName?.toLowerCase().includes(search.toLowerCase()) || o.studentId?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    return matchFilter && matchSearch;
  });

  const stats = {
    total: outings.length,
    pending: outings.filter((o) => o.status === "PENDING").length,
    approved: outings.filter((o) => o.status === "APPROVED").length,
    out: outings.filter((o) => o.status === "OUT").length,
    overdue: outings.filter((o) => o.status === "OVERDUE").length,
  };

  const FILTERS = ["ALL", "PENDING", "APPROVED", "OUT", "OVERDUE", "RETURNED"];

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)" />
                <path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={styles.brandName}>SmartOuting</div>
              <div style={styles.brandRole}>Warden Panel</div>
            </div>
          </div>

          <div style={styles.userCard}>
            <div style={{ ...styles.avatar, background: "var(--purple)" }}>
              {user?.name?.[0]?.toUpperCase() || "W"}
            </div>
            <div>
              <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ color: "var(--purple)", fontSize: 12, marginTop: 2 }}>Warden</div>
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsBlock}>
            {[
              { label: "Total", value: stats.total, color: "var(--text-2)" },
              { label: "Pending", value: stats.pending, color: "#fbbf24" },
              { label: "Approved", value: stats.approved, color: "var(--green)" },
              { label: "Out Now", value: stats.out, color: "var(--accent)" },
              { label: "Overdue", value: stats.overdue, color: "var(--red)" },
            ].map((s) => (
              <div key={s.label} style={styles.statItem}>
                <span style={{ color: "var(--text-4)", fontSize: 11 }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700, fontSize: 16, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={load} style={styles.refreshBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
          <button onClick={logout} style={styles.logoutBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Outing Requests</h1>
            <p style={styles.subtitle}>{stats.pending} pending approval &bull; {stats.overdue} overdue</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID..."
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div style={styles.filterRow}>
          {FILTERS.map((f) => {
            const count = f === "ALL" ? outings.length : outings.filter((o) => o.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterChip,
                  ...(filter === f ? styles.filterChipActive : {}),
                }}
              >
                {f} {count > 0 && <span style={{ opacity: 0.6, fontSize: 10 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinnerLarge} />
            <p style={{ color: "var(--text-3)", marginTop: 14 }}>Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" style={{marginBottom:12}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{ color: "var(--text-1)", fontWeight: 600 }}>No requests found</div>
            <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Try adjusting your filter or search</div>
          </div>
        ) : (
          <div style={styles.table}>
            {/* Header */}
            <div style={styles.tableHeader}>
              {["ID", "Student", "Destination & Reason", "AI Analysis", "Dates", "Status", "Actions"].map((h) => (
                <div key={h} style={styles.th}>{h}</div>
              ))}
            </div>

            {filtered.map((o) => (
              <div key={o.id} style={{ ...styles.tableRow, ...(selected?.id === o.id ? styles.tableRowSelected : {}) }}>
                <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13 }}>#{o.id}</div>

                <div>
                  <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 13 }}>{o.studentName}</div>
                  <div style={{ color: "var(--text-4)", fontSize: 11, marginTop: 2 }}>{o.studentId}</div>
                </div>

                <div>
                  <div style={{ color: "var(--text-1)", fontSize: 13, fontWeight: 500 }}>{o.destination}</div>
                  <div style={{ color: "var(--text-4)", fontSize: 11, marginTop: 3, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.reason}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <AiChip flag={o.aiFlag} score={o.urgencyScore} />
                </div>

                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  <div>Out: {formatDT(o.outDate)}</div>
                  <div style={{ marginTop: 3 }}>Return: {formatDT(o.returnDate)}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Badge status={o.status} />
                  {o.wardenComment && (
                    <span style={{ fontSize: 10, color: "var(--text-4)", fontStyle: "italic" }}>
                      &quot;{o.wardenComment.slice(0, 30)}{o.wardenComment.length > 30 ? "..." : ""}&quot;
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {o.status === "PENDING" && (
                    <button
                      onClick={() => { setSelected(o === selected ? null : o); setComment(""); }}
                      style={styles.approveBtn}
                    >
                      {selected?.id === o.id ? "Cancel" : "Approve"}
                    </button>
                  )}
                  {o.qrCodeUrl && (
                    <button onClick={() => setSelected(selected?.id === o.id ? null : o)} style={styles.viewBtn}>
                      QR Code
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approve Panel */}
        {selected && selected.status === "PENDING" && (
          <div style={styles.approvePanel}>
            <div style={styles.approvePanelHeader}>
              <div>
                <h3 style={{ color: "var(--text-1)", fontWeight: 700, fontSize: 15 }}>
                  Approve Request #{selected.id}
                </h3>
                <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>
                  {selected.studentName} &bull; {selected.destination}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", fontSize: 18 }}>&times;</button>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
                Approval Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setCommentFocused(true)}
                onBlur={() => setCommentFocused(false)}
                placeholder="Add your comment for the student..."
                rows={3}
                style={{
                  ...styles.commentBox,
                  borderColor: commentFocused ? "var(--accent)" : "var(--border-3)",
                  boxShadow: commentFocused ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => handleApprove(selected.id)}
                disabled={approving === selected.id}
                style={{
                  ...styles.confirmBtn,
                  opacity: approving === selected.id ? 0.7 : 1,
                }}
              >
                {approving === selected.id ? "Approving..." : "Confirm Approval & Generate QR"}
              </button>
              <button onClick={() => setSelected(null)} style={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}

        {/* QR View Panel */}
        {selected && selected.qrCodeUrl && selected.status !== "PENDING" && (
          <div style={styles.approvePanel}>
            <div style={styles.approvePanelHeader}>
              <div>
                <h3 style={{ color: "var(--green)", fontWeight: 700, fontSize: 15 }}>
                  QR Code \u2014 Request #{selected.id}
                </h3>
                <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>{selected.studentName}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", fontSize: 18 }}>&times;</button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <img src={selected.qrCodeUrl} alt="QR" style={{ width: 160, height: 160, background: "white", padding: 8, borderRadius: 10 }} />
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        input, textarea { color-scheme: dark; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder, input::placeholder { color: var(--text-4); }
      `}</style>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', sans-serif" },
  sidebar: {
    width: 240, background: "var(--bg-2)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "20px 14px", position: "sticky", top: 0, height: "100vh", flexShrink: 0,
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10, padding: "0 6px", marginBottom: 18 },
  brandIcon: {
    width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)",
    border: "1px solid rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandName: { fontSize: 14, fontWeight: 700, color: "var(--text-1)" },
  brandRole: { fontSize: 11, color: "var(--text-4)", marginTop: 1 },
  userCard: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
    background: "var(--bg-3)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 18,
  },
  avatar: {
    width: 32, height: 32, borderRadius: "50%", color: "#fff", fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  statsBlock: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 },
  statItem: {
    display: "flex", flexDirection: "column", gap: 2, padding: "9px 10px",
    background: "var(--bg-3)", borderRadius: 7, border: "1px solid var(--border)",
  },
  refreshBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "8px 12px", borderRadius: 7, border: "1px solid var(--border-2)",
    background: "transparent", color: "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  logoutBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(251,113,133,0.15)",
    background: "rgba(251,113,133,0.05)", color: "var(--red)", fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  main: { flex: 1, padding: "28px 32px", overflow: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.3px" },
  subtitle: { color: "var(--text-3)", fontSize: 13, marginTop: 4 },
  searchInput: {
    padding: "8px 12px", background: "var(--bg-3)",
    border: "1px solid var(--border-3)", borderRadius: 7,
    color: "var(--text-1)", fontSize: 13, outline: "none", width: 200,
  },
  filterRow: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 },
  filterChip: {
    padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border-2)",
    background: "transparent", color: "var(--text-3)", fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
  },
  filterChipActive: {
    background: "var(--accent-dim)", border: "1px solid rgba(129,140,248,0.2)", color: "var(--accent)",
  },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0" },
  spinnerLarge: {
    width: 30, height: 30, border: "2px solid var(--border-2)",
    borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  empty: {
    textAlign: "center", padding: "60px 20px", background: "var(--bg-2)",
    borderRadius: 12, border: "1px dashed var(--border-2)",
  },
  table: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 12, overflow: "hidden",
  },
  tableHeader: {
    display: "grid", gridTemplateColumns: "50px 130px 1fr 130px 150px 100px 100px",
    gap: 14, padding: "10px 18px",
    background: "var(--bg-3)", borderBottom: "1px solid var(--border)",
  },
  th: { fontSize: 10, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.5px" },
  tableRow: {
    display: "grid", gridTemplateColumns: "50px 130px 1fr 130px 150px 100px 100px",
    gap: 14, padding: "13px 18px", borderBottom: "1px solid var(--border)",
    alignItems: "center", animation: "fadeIn 0.2s ease", transition: "background 0.15s",
  },
  tableRowSelected: { background: "rgba(129,140,248,0.03)" },
  approveBtn: {
    padding: "6px 12px", background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.2)", borderRadius: 6,
    color: "var(--green)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  viewBtn: {
    padding: "5px 10px", background: "var(--accent-dim)",
    border: "1px solid rgba(129,140,248,0.15)", borderRadius: 6,
    color: "var(--accent)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  approvePanel: {
    marginTop: 18, background: "var(--bg-2)", border: "1px solid var(--border-2)",
    borderRadius: 12, padding: 20, animation: "fadeIn 0.2s ease",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  approvePanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  commentBox: {
    width: "100%", padding: "10px 12px", marginTop: 6, resize: "vertical",
    background: "var(--bg-3)", border: "1px solid var(--border-3)",
    borderRadius: 7, color: "var(--text-1)", fontSize: 14, outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  confirmBtn: {
    padding: "10px 20px", background: "var(--green)",
    border: "none", borderRadius: 7, color: "#09090B", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  cancelBtn: {
    padding: "10px 16px", background: "transparent",
    border: "1px solid var(--border-3)", borderRadius: 7,
    color: "var(--text-3)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
};
