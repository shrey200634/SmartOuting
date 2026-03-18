import { useState, useCallback, useEffect } from "react";

let _addToast = null;

export function useToast() {
  const toast = useCallback((msg, type = "info") => {
    if (_addToast) _addToast(msg, type);
  }, []);
  return { toast };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  _addToast = (msg, type) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const icons = { success: "✓", error: "✕", info: "◆", warn: "⚠" };
  const colors = {
    success: "linear-gradient(135deg, #059669, #047857)",
    error:   "linear-gradient(135deg, #dc2626, #b91c1c)",
    info:    "linear-gradient(135deg, #2DD4BF, #0D9488)",
    warn:    "linear-gradient(135deg, #d97706, #b45309)",
  };

  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => remove(t.id)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "13px 18px",
            background: colors[t.type] || colors.info,
            borderRadius: 12, color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            cursor: "pointer",
            animation: "toastIn 0.35s cubic-bezier(.34,1.56,.64,1)",
            maxWidth: 360,
          }}
        >
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
            {icons[t.type] || "◆"}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px) scale(0.85); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
