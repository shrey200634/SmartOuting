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
    width:"100%", padding:"12px 14px 12px 42px", borderRadius:8,
    border: `1px solid ${active===name ? "var(--accent)" : "var(--border-3)"}`,
    background: active===name ? "rgba(129,140,248,0.04)" : "var(--bg-3)",
    boxShadow: active===name ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
    color:"var(--text-1)", fontSize:14, outline:"none", transition:"all 0.2s",
  });

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        input { color-scheme:dark; }
        ::placeholder { color: var(--text-4) !important; }

        .login-grid {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(ellipse 60% 50% at 25% 50%, rgba(129,140,248,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 75% 30%, rgba(192,132,252,0.03) 0%, transparent 60%);
        }

        .lp { opacity:0; transform:translateY(20px); transition:opacity 0.6s ease,transform 0.6s ease; }
        .rp { opacity:0; transform:translateY(20px); transition:opacity 0.6s ease 0.1s,transform 0.6s ease 0.1s; }
        .lp.in,.rp.in { opacity:1; transform:translateY(0); }

        .s1 { opacity:0; animation:fadeUp 0.5s ease 0.2s forwards; }
        .s2 { opacity:0; animation:fadeUp 0.5s ease 0.28s forwards; }
        .s3 { opacity:0; animation:fadeUp 0.5s ease 0.36s forwards; }
        .s4 { opacity:0; animation:fadeUp 0.5s ease 0.42s forwards; }
        .s5 { opacity:0; animation:fadeUp 0.5s ease 0.48s forwards; }
        .s6 { opacity:0; animation:fadeUp 0.5s ease 0.54s forwards; }

        .pri-btn {
          width:100%; padding:12px; border:none; border-radius:8px;
          background: var(--accent-2);
          color:#fff; font-size:14px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition: background 0.2s, transform 0.15s;
        }
        .pri-btn:hover:not(:disabled) { background:#4F46E5; }
        .pri-btn:active:not(:disabled) { transform:scale(0.98); }

        .sec-btn {
          width:100%; padding:11px; border:1px solid var(--border-3);
          border-radius:8px; background:transparent;
          color:var(--text-2); font-size:14px; font-weight:500;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.2s;
        }
        .sec-btn:hover { border-color:var(--accent); color:var(--accent); }

        @keyframes fadeUp { to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="login-grid" />

      {/* LEFT PANEL */}
      <div className={`lp ${mounted?"in":""}`} style={{
        flex:"0 0 50%", position:"relative", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 64px",
        borderRight:"1px solid var(--border)",
      }}>
        {/* Brand */}
        <div className="s1" style={{display:"flex",alignItems:"center",gap:10,marginBottom:48}}>
          <div style={{width:36,height:36,borderRadius:8,background:"var(--accent-dim)",border:"1px solid rgba(129,140,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)"/>
              <path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{fontSize:15,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.3px"}}>SmartOuting</span>
        </div>

        {/* Eyebrow */}
        <div className="s2" style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:16,height:2,background:"var(--accent)",borderRadius:2}}/>
          <span style={{fontSize:11,fontWeight:600,color:"var(--text-3)",letterSpacing:"1.5px",textTransform:"uppercase"}}>Campus Exit Management</span>
        </div>

        {/* Headline */}
        <h1 className="s3" style={{fontSize:42,fontWeight:800,color:"var(--text-1)",lineHeight:1.15,letterSpacing:"-1.5px",marginBottom:16}}>
          Every exit,<br/>tracked &{" "}
          <span style={{color:"var(--accent)"}}>secured.</span>
        </h1>

        <p className="s4" style={{fontSize:15,color:"var(--text-3)",lineHeight:1.7,maxWidth:380,marginBottom:36}}>
          Smart approvals, real-time QR gate scanning, and instant parent notifications — all in one place.
        </p>

        {/* Stats row */}
        <div className="s5" style={{display:"flex",gap:0,background:"var(--bg-2)",border:"1px solid var(--border-2)",borderRadius:10,overflow:"hidden",marginBottom:28}}>
          {[{v:"AI",l:"Urgency Detection"},{v:"QR",l:"Gate Scanning"},{v:"24/7",l:"Monitoring"}].map((s,i)=>(
            <div key={s.v} style={{flex:1,padding:"14px 16px",textAlign:"center",borderRight:i<2?"1px solid var(--border-2)":"none"}}>
              <div style={{fontSize:15,fontWeight:700,color:"var(--accent)",marginBottom:2,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--text-4)",fontWeight:500,letterSpacing:"0.2px"}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Role pills */}
        <div className="s6" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {label:"Students",   c:"var(--accent)", b:"var(--accent-dim)", bd:"rgba(129,140,248,0.2)"},
            {label:"Wardens",    c:"var(--purple)",  b:"rgba(192,132,252,0.08)", bd:"rgba(192,132,252,0.2)"},
            {label:"Gate Guards", c:"var(--green)",  b:"rgba(52,211,153,0.08)", bd:"rgba(52,211,153,0.2)"},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,background:r.b,border:`1px solid ${r.bd}`,color:r.c}}>
              {r.label}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`rp ${mounted?"in":""}`} style={{flex:1,position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 48px"}}>
        <div style={{width:"100%",maxWidth:380}}>

          {/* Form header */}
          <div className="s2" style={{marginBottom:28}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:6,background:"var(--bg-3)",border:"1px solid var(--border-2)",color:"var(--text-3)",fontSize:11,fontWeight:500,marginBottom:16}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"var(--green)"}}/>
              Secure Portal
            </div>
            <h2 style={{fontSize:24,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.5px",marginBottom:6}}>Welcome back</h2>
            <p style={{fontSize:14,color:"var(--text-3)",lineHeight:1.5}}>Sign in with your registered name</p>
          </div>

          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Username */}
            <div className="s3" style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--text-2)"}}>Full Name</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:active==="username"?"var(--accent)":"var(--text-4)",transition:"color 0.2s",display:"flex"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <input name="username" value={form.username} onChange={handleChange}
                  onFocus={()=>setActive("username")} onBlur={()=>setActive("")}
                  placeholder="e.g. Rahul Sharma" autoComplete="username"
                  style={inp("username")}/>
              </div>
            </div>

            {/* Password */}
            <div className="s4" style={{display:"flex",flexDirection:"column",gap:6}}>
              <label style={{fontSize:13,fontWeight:500,color:"var(--text-2)"}}>Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:active==="password"?"var(--accent)":"var(--text-4)",transition:"color 0.2s",display:"flex"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handleChange}
                  onFocus={()=>setActive("password")} onBlur={()=>setActive("")}
                  placeholder="Your password" autoComplete="current-password"
                  style={{...inp("password"),paddingRight:42}}/>
                <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",borderRadius:6,color:"var(--text-4)"}}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="s5" style={{marginTop:4}}>
              <button type="submit" disabled={loading} className="pri-btn" style={{opacity:loading?0.7:1}}>
                {loading
                  ? <><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/> Signing in...</>
                  : <>Sign In <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="s6" style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0 14px"}}>
            <span style={{flex:1,height:"1px",background:"var(--border-2)"}}/>
            <span style={{fontSize:12,color:"var(--text-4)"}}>or</span>
            <span style={{flex:1,height:"1px",background:"var(--border-2)"}}/>
          </div>

          <div className="s6">
            <button onClick={onSwitchToRegister} className="sec-btn">
              Create account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
