import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [active, setActive] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 40); }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return toast("Please fill in all fields", "warn");
    setLoading(true);
    try {
      const u = await login(form.username.trim(), form.password);
      toast(`Welcome back, ${u.name}!`, "success");
    } catch (err) {
      const m = err.message || "";
      if (m.includes("User not found")) toast("No account found with that name.", "error");
      else if (m.includes("Wrong Password") || m.includes("Invalid Access")) toast("Incorrect password. Please try again.", "error");
      else if (m.includes("Cannot connect") || m.includes("Failed to fetch")) toast("Unable to connect. Please try again shortly.", "error");
      else toast("Login failed. Please check your details.", "error");
    } finally { setLoading(false); }
  };

  const inp = (name) => ({
    width:"100%", padding:"13px 14px 13px 44px", borderRadius:10,
    border: `1.5px solid ${active===name ? "var(--accent)" : "var(--border-2)"}`,
    background: active===name ? "rgba(45,212,191,0.04)" : "var(--bg-3)",
    boxShadow: active===name ? "0 0 0 3px rgba(45,212,191,0.1)" : "none",
    color:"var(--text-1)", fontSize:14, outline:"none", transition:"all 0.2s",
  });

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        * { box-sizing:border-box;margin:0;padding:0; }
        input { color-scheme:dark; }
        ::placeholder { color: var(--text-4) !important; }

        /* Geometric background pattern */
        .geo-bg {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(45,212,191,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,212,191,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .geo-bg::after {
          content:''; position:absolute; inset:0;
          background: radial-gradient(ellipse 80% 60% at 20% 50%, rgba(45,212,191,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 80% at 80% 20%, rgba(167,139,250,0.05) 0%, transparent 60%);
        }

        .lp { opacity:0; transform:translateX(-28px); transition:opacity 0.75s cubic-bezier(.22,1,.36,1),transform 0.75s cubic-bezier(.22,1,.36,1); }
        .rp { opacity:0; transform:translateX(28px);  transition:opacity 0.75s cubic-bezier(.22,1,.36,1) 0.1s,transform 0.75s cubic-bezier(.22,1,.36,1) 0.1s; }
        .lp.in,.rp.in { opacity:1; transform:translateX(0); }

        .s1 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.25s forwards; }
        .s2 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.35s forwards; }
        .s3 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.43s forwards; }
        .s4 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.50s forwards; }
        .s5 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.56s forwards; }
        .s6 { opacity:0; transform:translateY(14px); animation:fadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.62s forwards; }

        .pri-btn {
          width:100%; padding:14px; border:none; border-radius:10px;
          background: linear-gradient(135deg, #2DD4BF, #14B8A6);
          color:#0D1117; font-size:14px; font-weight:800;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:9px;
          box-shadow: 0 4px 20px rgba(45,212,191,0.3);
          transition: transform 0.18s, box-shadow 0.18s;
          letter-spacing: 0.2px;
        }
        .pri-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(45,212,191,0.45); }
        .pri-btn:active:not(:disabled) { transform:translateY(0) scale(0.98); }

        .sec-btn {
          width:100%; padding:12px; border:1.5px solid var(--border-2);
          border-radius:10px; background:var(--bg-3);
          color:var(--text-3); font-size:14px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.2s;
        }
        .sec-btn:hover { border-color:var(--accent); color:var(--accent); background:rgba(45,212,191,0.04); }

        .feat-pill { display:flex; align-items:center; gap:7px; padding:7px 14px; border-radius:99px; font-size:11px; font-weight:700; letter-spacing:0.3px; }

        @keyframes fadeUp  { to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>

      <div className="geo-bg" />

      {/* ── LEFT PANEL ── */}
      <div className={`lp ${mounted?"in":""}`} style={{
        flex:"0 0 50%", position:"relative", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 68px",
        borderRight:"1px solid var(--border)",
      }}>
        {/* Brand */}
        <div className="s1" style={{display:"flex",alignItems:"center",gap:11,marginBottom:56}}>
          <div style={{width:40,height:40,borderRadius:11,background:"var(--accent-dim)",border:"1px solid rgba(45,212,191,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="url(#lg)"/>
              <path d="M12 16L15 19L21 13" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lg" x1="4" y1="2" x2="28" y2="30"><stop stopColor="#2DD4BF"/><stop offset="1" stopColor="#14B8A6"/></linearGradient></defs>
            </svg>
          </div>
          <span style={{fontSize:16,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.3px"}}>SmartOuting</span>
        </div>

        {/* Eyebrow */}
        <div className="s2" style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <div style={{width:20,height:1.5,background:"var(--accent)",borderRadius:2}}/>
          <span style={{fontSize:10,fontWeight:700,color:"var(--accent)",letterSpacing:"2.5px",textTransform:"uppercase"}}>Campus Exit Management</span>
        </div>

        {/* Headline */}
        <h1 className="s3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:46,fontWeight:800,color:"var(--text-1)",lineHeight:1.1,letterSpacing:"-2px",marginBottom:18}}>
          Every exit,<br/>tracked &{" "}
          <span style={{
            background:"linear-gradient(135deg,#2DD4BF 0%,#A78BFA 100%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            backgroundClip:"text",
            animation:"shimmer 3s linear infinite",
            display:"inline-block",
          }}>secured.</span>
        </h1>

        <p className="s4" style={{fontSize:15,color:"var(--text-3)",lineHeight:1.75,maxWidth:380,marginBottom:36}}>
          AI-driven approvals, real-time QR gate scanning, and instant parent notifications.
        </p>

        {/* Stats row */}
        <div className="s5" style={{display:"flex",gap:0,background:"var(--bg-2)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:32}}>
          {[{v:"AI",l:"Urgency Detection"},{v:"QR",l:"Gate Scanning"},{v:"24/7",l:"Monitoring"}].map((s,i)=>(
            <div key={s.v} style={{flex:1,padding:"15px 18px",textAlign:"center",borderRight:i<2?"1px solid var(--border)":"none"}}>
              <div style={{fontSize:17,fontWeight:800,color:"var(--accent)",marginBottom:3,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--text-4)",fontWeight:600,letterSpacing:"0.3px"}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Role pills */}
        <div className="s6" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {icon:"🎓",label:"Students",   c:"var(--accent)",  b:"rgba(45,212,191,0.1)",  bd:"rgba(45,212,191,0.2)"},
            {icon:"🏛️",label:"Wardens",   c:"var(--purple)",  b:"rgba(167,139,250,0.1)", bd:"rgba(167,139,250,0.2)"},
            {icon:"🛡️",label:"Gate Guards",c:"var(--green)",  b:"rgba(34,197,94,0.1)",   bd:"rgba(34,197,94,0.2)"},
          ].map(r=>(
            <div key={r.label} className="feat-pill" style={{background:r.b,border:`1px solid ${r.bd}`,color:r.c}}>
              <span style={{fontSize:12}}>{r.icon}</span>{r.label}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{width:1,flexShrink:0,zIndex:2,background:"linear-gradient(to bottom,transparent,var(--border) 20%,var(--border) 80%,transparent)"}}/>

      {/* ── RIGHT PANEL ── */}
      <div className={`rp ${mounted?"in":""}`} style={{flex:1,position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 52px"}}>
        <div style={{width:"100%",maxWidth:380}}>

          {/* Form header */}
          <div className="s2" style={{marginBottom:32}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 12px",borderRadius:8,background:"var(--bg-3)",border:"1px solid var(--border-2)",color:"var(--text-3)",fontSize:11,fontWeight:600,marginBottom:18,letterSpacing:"0.3px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"var(--accent)",animation:"pulse 2s ease-in-out infinite"}}/>
              SECURE PORTAL
            </div>
            <h2 style={{fontSize:28,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.8px",marginBottom:6}}>Welcome back</h2>
            <p style={{fontSize:14,color:"var(--text-3)",lineHeight:1.6}}>Sign in with your registered name to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Username */}
            <div className="s3" style={{display:"flex",flexDirection:"column",gap:7}}>
              <label style={{fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase"}}>Full Name</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:active==="username"?"var(--accent)":"var(--text-4)",transition:"color 0.2s",display:"flex"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <input name="username" value={form.username} onChange={handleChange}
                  onFocus={()=>setActive("username")} onBlur={()=>setActive("")}
                  placeholder="e.g. Rahul Sharma" autoComplete="username"
                  style={inp("username")}/>
                {form.username && (
                  <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:18,height:18,borderRadius:"50%",background:"rgba(34,197,94,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="s4" style={{display:"flex",flexDirection:"column",gap:7}}>
              <label style={{fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase"}}>Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:active==="password"?"var(--accent)":"var(--text-4)",transition:"color 0.2s",display:"flex"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handleChange}
                  onFocus={()=>setActive("password")} onBlur={()=>setActive("")}
                  placeholder="Your password" autoComplete="current-password"
                  style={{...inp("password"),paddingRight:46}}/>
                <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",borderRadius:6,color:"var(--text-4)"}}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="s5">
              <button type="submit" disabled={loading} className="pri-btn" style={{opacity:loading?0.8:1}}>
                {loading
                  ? <><span style={{width:16,height:16,border:"2.5px solid rgba(13,17,23,0.3)",borderTopColor:"#0D1117",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/> Signing in...</>
                  : <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="s6" style={{display:"flex",alignItems:"center",gap:12,margin:"22px 0 16px"}}>
            <span style={{flex:1,height:"1px",background:"var(--border)"}}/>
            <span style={{fontSize:11,color:"var(--text-4)",letterSpacing:"0.5px"}}>don't have an account?</span>
            <span style={{flex:1,height:"1px",background:"var(--border)"}}/>
          </div>

          <div className="s6">
            <button onClick={onSwitchToRegister} className="sec-btn">
              Create account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
