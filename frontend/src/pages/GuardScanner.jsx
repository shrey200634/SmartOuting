import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { outingAPI } from "../utils/api";
import { useToast } from "../components/Toast";

function formatDT(dt) {
  if (!dt) return "\u2014";
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function GuardScanner() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [outingId, setOutingId] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!showScanner) return;

    let html5QrcodeScanner = null;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            const match = decodedText.match(/ID:(\d+)/);
            if (match) {
              const id = match[1];
              setOutingId(id);
              toast(`Scanned ID: ${id}`, "success");
              fetchOutingById(id);
              setShowScanner(false);
              html5QrcodeScanner?.clear();
            } else {
              toast("Invalid QR format", "warn");
            }
          },
          (error) => console.debug("Scan error:", error)
        );
      } catch (error) {
        toast("Camera access denied", "error");
        setShowScanner(false);
      }
    };

    initScanner();
    return () => html5QrcodeScanner?.clear().catch(() => {});
  }, [showScanner, toast]);

  const fetchOutingById = async (id) => {
    const searchId = id || outingId;
    if (!searchId.trim()) return toast("Enter outing ID", "warn");

    setLoading(true);
    setScanResult(null);
    try {
      const data = await outingAPI.getById(Number(searchId));
      setScanResult({ type: "preview", data });
    } catch (err) {
      toast("Not found: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanResult?.data?.id) return;
    setScanning(true);
    try {
      const result = await outingAPI.scan(scanResult.data.id);
      toast(`${result.studentName} marked OUT`, "success");
      setRecentScans(p => [{ ...result, scannedAt: new Date(), eventType: "OUT" }, ...p.slice(0, 9)]);
      setScanResult({ type: "success", data: result });
      setOutingId("");
    } catch (err) {
      toast(err.message || "Scan failed", "error");
      if ((err.message || "").includes("NOT approved")) {
        setScanResult(p => ({ ...p, error: "NOT approved to leave!" }));
      }
    } finally {
      setScanning(false);
    }
  };

  const handleReturn = async () => {
    if (!scanResult?.data?.id) return;
    setScanning(true);
    try {
      const result = await outingAPI.returnIn(scanResult.data.id);
      toast(`${result.studentName} marked RETURNED`, "success");
      setRecentScans(p => [{ ...result, scannedAt: new Date(), eventType: "IN" }, ...p.slice(0, 9)]);
      setScanResult({ type: "returned", data: result });
      setOutingId("");
    } catch (err) {
      toast(err.message || "Return failed", "error");
    } finally {
      setScanning(false);
    }
  };

  const statusColor = {
    PENDING: "#fbbf24", APPROVED: "var(--green)", OUT: "var(--accent)", OVERDUE: "var(--red)", RETURNED: "var(--text-3)",
  };

  return (
    <div style={styles.layout}>
      {/* Scanner Modal */}
      {showScanner && (
        <div style={styles.scannerOverlay}>
          <div style={styles.scannerModal}>
            <div style={styles.scannerHeader}>
              <h3 style={{ color: "var(--text-1)", fontSize: 16, fontWeight: 600 }}>Scan QR Code</h3>
              <button onClick={() => setShowScanner(false)} style={styles.closeBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div id="qr-reader" style={{ width: "100%", borderRadius: 10 }}></div>
            <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14, textAlign: "center" }}>
              Point camera at student's QR code
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)" />
                <path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={styles.brandName}>SmartOuting</div>
              <div style={{ fontSize: 11, color: "var(--green)", marginTop: 1 }}>Guard Panel</div>
            </div>
          </div>

          <div style={styles.userCard}>
            <div style={{ ...styles.avatar, background: "var(--green)" }}>
              {user?.name?.[0]?.toUpperCase() || "G"}
            </div>
            <div>
              <div style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ color: "var(--green)", fontSize: 12, marginTop: 2 }}>Gate Guard</div>
            </div>
          </div>

          <div style={styles.instructions}>
            <div style={styles.instructTitle}>How to verify</div>
            {[
              "Click 'Scan QR' button",
              "Point camera at QR code",
              "System extracts ID",
              "Click 'Mark OUT' to exit",
              "Click 'Mark IN' when return",
            ].map((step, i) => (
              <div key={i} style={styles.instructStep}>
                <span style={styles.instructNum}>{i + 1}</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Gate Scanner</h1>
          <p style={styles.pageSub}>Scan QR or enter ID manually</p>
        </div>

        <div style={styles.scanCard}>
          <div style={styles.scanIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>

          <h2 style={styles.scanTitle}>Verify Student</h2>
          <p style={styles.scanSub}>Scan QR code or enter outing ID</p>

          <button onClick={() => setShowScanner(true)} style={styles.qrScanBtn}>
            Scan QR Code
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.inputRow}>
            <input
              value={outingId}
              onChange={(e) => setOutingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOutingById()}
              placeholder="e.g. 42"
              type="number"
              style={styles.scanInput}
            />
            <button onClick={fetchOutingById} disabled={loading} style={styles.fetchBtn}>
              {loading ? "..." : "Lookup"}
            </button>
          </div>

          {/* RESULT */}
          {scanResult && (
            <div style={{
              ...styles.resultCard,
              borderColor: scanResult.type === "success" ? "rgba(52,211,153,0.2)"
                : scanResult.error ? "rgba(251,113,133,0.2)" : "rgba(129,140,248,0.15)",
            }}>
              {scanResult.error ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" style={{marginBottom:8}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <div style={{ color: "var(--red)", fontWeight: 600, fontSize: 14 }}>{scanResult.error}</div>
                </div>
              ) : (
                <>
                  <div style={styles.resultHeader}>
                    <div>
                      <div style={{ color: "var(--text-1)", fontSize: 16, fontWeight: 700 }}>
                        {scanResult.data.studentName}
                      </div>
                      <div style={{ color: "var(--text-4)", fontSize: 12, marginTop: 2 }}>ID: {scanResult.data.studentId}</div>
                    </div>
                    <span style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: `${statusColor[scanResult.data.status]}12`,
                      color: statusColor[scanResult.data.status],
                      border: `1px solid ${statusColor[scanResult.data.status]}30`,
                    }}>
                      {scanResult.data.status}
                    </span>
                  </div>

                  <div style={styles.resultGrid}>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>Destination</div>
                      <div style={styles.resultValue}>{scanResult.data.destination}</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>Reason</div>
                      <div style={styles.resultValue}>{scanResult.data.reason}</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>Out Date</div>
                      <div style={styles.resultValue}>{formatDT(scanResult.data.outDate)}</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>Return Date</div>
                      <div style={styles.resultValue}>{formatDT(scanResult.data.returnDate)}</div>
                    </div>
                  </div>

                  {scanResult.type === "success" && (
                    <div style={styles.successBanner}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--green)", fontWeight: 600, fontSize: 13 }}>Marked OUT</div>
                        <div style={{ color: "var(--text-4)", fontSize: 12, marginTop: 2 }}>Parent email sent</div>
                      </div>
                    </div>
                  )}

                  {scanResult.type === "returned" && (
                    <div style={styles.returnedBanner}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13 }}>Marked RETURNED</div>
                        <div style={{ color: "var(--text-4)", fontSize: 12, marginTop: 2 }}>Student back on campus</div>
                      </div>
                    </div>
                  )}

                  {scanResult.type === "preview" && (
                    <>
                      {scanResult.data.status === "APPROVED" && (
                        <button onClick={handleScan} disabled={scanning} style={styles.markOutBtn}>
                          {scanning ? "Processing..." : "Mark OUT (Exit)"}
                        </button>
                      )}

                      {(scanResult.data.status === "OUT" || scanResult.data.status === "OVERDUE") && (
                        <button onClick={handleReturn} disabled={scanning} style={styles.markInBtn}>
                          {scanning ? "Processing..." : "Mark IN (Return)"}
                        </button>
                      )}

                      {!["APPROVED", "OUT", "OVERDUE"].includes(scanResult.data.status) && (
                        <div style={styles.warningBanner}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span style={{ fontSize: 13, color: "var(--amber)", flex: 1 }}>
                            Status: <strong>{scanResult.data.status}</strong> \u2014 Cannot process
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Recent scans */}
        {recentScans.length > 0 && (
          <div style={styles.recentSection}>
            <h2 style={styles.recentTitle}>Recent Scans</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentScans.map((s, i) => (
                <div key={i} style={styles.recentItem}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.eventType === "IN" ? "var(--accent)" : "var(--green)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-1)", fontWeight: 600, fontSize: 13 }}>{s.studentName}</span>
                  <span style={{ color: "var(--text-4)", fontSize: 12 }}>{s.destination}</span>
                  <span style={{ marginLeft: "auto", color: s.eventType === "IN" ? "var(--accent)" : "var(--green)", fontSize: 11, fontWeight: 500 }}>
                    {s.eventType} &bull; {s.scannedAt?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        input { color-scheme: dark; }
        input::placeholder { color: var(--text-4); }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', sans-serif" },
  sidebar: {
    width: 252, background: "var(--bg-2)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "20px 14px", position: "sticky", top: 0, height: "100vh", flexShrink: 0,
  },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "0 6px", marginBottom: 18 },
  brandIcon: {
    width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)",
    border: "1px solid rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 14, fontWeight: 700, color: "var(--text-1)" },
  userCard: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
    background: "rgba(52,211,153,0.05)", borderRadius: 8, border: "1px solid rgba(52,211,153,0.12)", marginBottom: 20,
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%", color: "#09090B", fontWeight: 700, fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  instructions: {
    background: "var(--bg-3)", borderRadius: 8,
    border: "1px solid var(--border)", padding: 14, display: "flex", flexDirection: "column", gap: 8,
  },
  instructTitle: { fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 },
  instructStep: { display: "flex", alignItems: "flex-start", gap: 8 },
  instructNum: {
    width: 18, height: 18, borderRadius: "50%", background: "var(--accent-dim)",
    border: "1px solid rgba(129,140,248,0.15)", color: "var(--accent)", fontSize: 10, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "9px 14px", borderRadius: 7, border: "1px solid rgba(251,113,133,0.12)",
    background: "rgba(251,113,133,0.04)", color: "var(--red)", fontSize: 13,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  main: { flex: 1, padding: "32px 40px", overflow: "auto" },
  pageHeader: { marginBottom: 28 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "var(--text-1)" },
  pageSub: { color: "var(--text-3)", fontSize: 14, marginTop: 4 },
  scanCard: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 14, padding: "36px 32px", textAlign: "center", maxWidth: 560,
    animation: "fadeIn 0.3s ease",
  },
  scanIconWrap: { width: 56, height: 56, borderRadius: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  scanTitle: { fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 },
  scanSub: { color: "var(--text-3)", fontSize: 14, marginBottom: 24 },
  qrScanBtn: {
    width: "100%", maxWidth: 360, margin: "0 auto", padding: "14px 28px",
    background: "var(--green)",
    border: "none", borderRadius: 8, color: "#09090B", fontSize: 14, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", cursor: "pointer",
  },
  divider: { display: "flex", alignItems: "center", gap: 14, margin: "20px 0" },
  dividerLine: { flex: 1, height: 1, background: "var(--border-2)" },
  dividerText: { color: "var(--text-4)", fontSize: 12, fontWeight: 500 },
  inputRow: { display: "flex", gap: 10, justifyContent: "center" },
  scanInput: {
    padding: "12px 18px", background: "var(--bg-3)",
    border: "1px solid var(--border-3)", borderRadius: 8,
    color: "var(--text-1)", fontSize: 18, fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace", outline: "none", width: 160,
    textAlign: "center", letterSpacing: "2px",
  },
  fetchBtn: {
    padding: "12px 22px", background: "var(--bg-3)",
    border: "1px solid var(--border-3)", borderRadius: 8, color: "var(--text-2)", fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  scannerOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, padding: 20,
  },
  scannerModal: {
    background: "var(--bg-2)", border: "1px solid var(--border-2)",
    borderRadius: 14, padding: 20, maxWidth: 480, width: "100%",
    boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
  },
  scannerHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: "var(--bg-3)", border: "1px solid var(--border-2)",
    color: "var(--text-3)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  resultCard: {
    marginTop: 24, background: "var(--bg-3)", border: "1px solid",
    borderRadius: 10, padding: 20, textAlign: "left", animation: "fadeIn 0.2s ease",
  },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  resultItem: { display: "flex", flexDirection: "column", gap: 3 },
  resultLabel: { fontSize: 10, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.4px" },
  resultValue: { fontSize: 13, color: "var(--text-2)" },
  markOutBtn: {
    width: "100%", marginTop: 16, padding: "13px 22px",
    background: "var(--green)",
    border: "none", borderRadius: 8, color: "#09090B", fontSize: 14, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", cursor: "pointer",
  },
  markInBtn: {
    width: "100%", marginTop: 16, padding: "13px 22px",
    background: "var(--accent)",
    border: "none", borderRadius: 8, color: "#09090B", fontSize: 14, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", cursor: "pointer",
  },
  successBanner: {
    marginTop: 14, display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", background: "rgba(52,211,153,0.06)",
    border: "1px solid rgba(52,211,153,0.15)", borderRadius: 8,
  },
  returnedBanner: {
    marginTop: 14, display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", background: "var(--accent-dim)",
    border: "1px solid rgba(129,140,248,0.15)", borderRadius: 8,
  },
  warningBanner: {
    marginTop: 14, display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 14px", background: "rgba(251,191,36,0.05)",
    border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8,
  },
  recentSection: {
    marginTop: 28, background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 20, maxWidth: 560,
  },
  recentTitle: {
    fontSize: 13, fontWeight: 600, color: "var(--text-3)",
    textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 12,
  },
  recentItem: {
    display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
    borderBottom: "1px solid var(--border)",
  },
};
