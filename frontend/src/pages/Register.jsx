import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const ROLES = [
  { value:"STUDENT", label:"Student",    icon:"🎓", desc:"Apply for campus outings & track requests",  color:"var(--accent)",  bg:"rgba(45,212,191,0.07)",  bd:"rgba(45,212,191,0.25)"  },
  { value:"WARDEN",  label:"Warden",     icon:"🏛️", desc:"Review, approve & monitor student activity", color:"var(--purple)",  bg:"rgba(167,139,250,0.07)", bd:"rgba(167,139,250,0.25)" },
  { value:"GUARD",   label:"Gate Guard", icon:"🛡️", desc:"Verify QR codes at campus entry & exit",     color:"var(--green)",   bg:"rgba(34,197,94,0.07)",   bd:"rgba(34,197,94,0.25)"  },
];

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const { toast }    = useToast();

  // step 1 = role selection, step 2 = account details
  const [step, setStep]         = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm]         = useState({ name:"", email:"", password:"", confirmPassword:"" });
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const proceedToDetails = () => {
    if (!selectedRole) return toast("Please select your role to continue", "warn");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.name.trim())                              return toast("Name is required", "warn");
    if (!form.email.trim() || !form.email.includes("@")) return toast("Valid email required", "warn");
    if (form.password.length < 6)                      return toast("Password must be at least 6 characters", "warn");
    if (form.password !== form.confirmPassword)        return toast("Passwords do not match", "error");
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: selectedRole.value });
      toast("Account created! Sign in with your full name.", "success");
      setTimeout(() => onSwitchToLogin(), 1200);
    } catch (err) {
      const m = err.message || "";
      if (m.toLowerCase().includes("exist") || m.toLowerCase().includes("duplicate") || m.includes("1062"))
        toast("An account with this email already exists.", "error");
      else if (m.includes("Cannot connect") || m.includes("Failed to fetch"))
        toast("Cannot connect to server. Please try again.", "error");
      else toast(m || "Registration failed.", "error");
    } finally { setLoading(false); }
  };

  const pwStrength = () => { const l = form.password.length; if(!l) return 0; if(l<4) return 1; if(l<6) return 2; if(l<10) return 3; return 4; };
  const strColors = ["", "#F87171", "#FB923C", "#FBBF24", "#22C55E"];

  const inp = (name) => ({
    width:"100%", padding:"12px 14px 12px 42px",
    background: focused===name ? "rgba(45,212,191,0.04)" : "var(--bg-3)",
    border: `1.5px solid ${focused===name ? "var(--accent)" : "var(--border-2)"}`,
    boxShadow: focused===name ? "0 0 0 3px rgba(45,212,191,0.1)" : "none",
    borderRadius:10, color:"var(--text-1)", fontSize:14, outline:"none", transition:"all 0.2s",
  });

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative",overflow:"hidden",padding:20}}>
      <style>{`
        * { box-sizing:border-box;margin:0;padding:0; }
        input { color-scheme:dark; }
        ::placeholder { color:var(--text-4) !important; }
        .geo-r { position:absolute;inset:0;background-image:linear-gradient(rgba(45,212,191,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.03) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;z-index:0; }
        .geo-r::after { content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 50%,rgba(45,212,191,0.05) 0%,transparent 60%); }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pri { padding:13px 20px;background:linear-gradient(135deg,#2DD4BF,#14B8A6);border:none;border-radius:10px;color:#0D1117;font-size:14px;font-weight:800;cursor:pointer;width:100%;box-shadow:0 4px 18px rgba(45,212,191,0.3);transition:transform 0.15s,box-shadow 0.15s;font-family:'Plus Jakarta Sans',sans-serif; }
        .pri:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 8px 28px rgba(45,212,191,0.4); }
        .pri:disabled { opacity:0.7;cursor:not-allowed; }
        .back { padding:13px 18px;background:var(--bg-3);border:1.5px solid var(--border-2);border-radius:10px;color:var(--text-3);font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif; }
        .rc { display:flex;align-items:center;gap:14px;padding:14px 18px;border:1.5px solid;border-radius:12px;cursor:pointer;text-align:left;background:transparent;transition:all 0.2s;width:100%;font-family:'Plus Jakarta Sans',sans-serif; }
        .rc:hover { transform:translateY(-1px); }
      `}</style>
      <div className="geo-r"/>

      <div style={{position:"relative",zIndex:1,background:"var(--bg-2)",border:"1px solid var(--border-2)",borderRadius:20,padding:"44px 40px",width:"100%",maxWidth:460,boxShadow:"0 24px 60px rgba(0,0,0,0.5)",animation:"cardIn 0.55s cubic-bezier(.34,1.26,.64,1)"}}>

        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <div style={{width:38,height:38,borderRadius:10,background:"var(--accent-dim)",border:"1px solid rgba(45,212,191,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="url(#rg)"/>
              <path d="M12 16L15 19L21 13" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="rg" x1="4" y1="2" x2="28" y2="30"><stop stopColor="#2DD4BF"/><stop offset="1" stopColor="#14B8A6"/></linearGradient></defs>
            </svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.3px"}}>SmartOuting</div>
            <div style={{fontSize:10,color:"var(--text-4)",marginTop:1}}>Secure Campus Management</div>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:24}}>
          {[{n:1,label:"Choose Role"},{n:2,label:"Your Details"}].map(({n,label},i) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{
                width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,transition:"all 0.3s",
                background: step>=n ? "var(--accent)" : "var(--bg-3)",
                color:      step>=n ? "#0D1117"       : "var(--text-4)",
                border:     step>=n ? "none"          : "1px solid var(--border-2)",
              }}>
                {step>n
                  ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0D1117" strokeWidth="2" strokeLinecap="round"/></svg>
                  : n}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:step>=n?"var(--text-2)":"var(--text-4)"}}>{label}</span>
              {i<1 && <div style={{width:28,height:1.5,background:step>n?"var(--accent)":"var(--border-2)",margin:"0 2px",borderRadius:2,transition:"background 0.3s"}}/>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Role Selection ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 style={{fontSize:22,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.5px",marginBottom:4}}>Who are you?</h1>
            <p style={{fontSize:13,color:"var(--text-3)",marginBottom:24,lineHeight:1.5}}>Select your role to get the right experience</p>

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r)}
                  className="rc"
                  style={{
                    borderColor: selectedRole?.value===r.value ? r.bd : "var(--border-2)",
                    background:  selectedRole?.value===r.value ? r.bg : "transparent",
                    boxShadow:   selectedRole?.value===r.value ? `0 0 0 1px ${r.bd}` : "none",
                  }}
                >
                  <span style={{fontSize:22}}>{r.icon}</span>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:14,fontWeight:700,color:selectedRole?.value===r.value?r.color:"var(--text-1)",marginBottom:2,transition:"color 0.2s"}}>{r.label}</div>
                    <div style={{fontSize:12,color:"var(--text-4)",lineHeight:1.4}}>{r.desc}</div>
                  </div>
                  {selectedRole?.value===r.value && (
                    <div style={{width:20,height:20,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#0D1117" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={proceedToDetails}
              className="pri"
              style={{ opacity: selectedRole ? 1 : 0.45, cursor: selectedRole ? "pointer" : "default" }}
            >
              {selectedRole ? `Continue as ${selectedRole.label} →` : "Select a role to continue"}
            </button>

            <div style={{textAlign:"center",marginTop:20}}>
              <span style={{color:"var(--text-4)",fontSize:13}}>Already have an account? </span>
              <button onClick={onSwitchToLogin} style={{background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer"}}>Sign in</button>
            </div>
          </>
        )}

        {/* ── STEP 2: Account Details ─────────────────────────────────────────── */}
        {step === 2 && (
          <>
            {/* Role badge — click to go back */}
            <button
              onClick={() => setStep(1)}
              style={{
                display:"flex",alignItems:"center",gap:10,width:"100%",marginBottom:20,
                padding:"10px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",
                background: selectedRole.bg,
                border: `1.5px solid ${selectedRole.bd}`,
              }}
            >
              <span style={{fontSize:18}}>{selectedRole.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:selectedRole.color}}>Registering as {selectedRole.label}</div>
                <div style={{fontSize:11,color:"var(--text-4)",marginTop:1}}>Click to change role</div>
              </div>
              <span style={{color:"var(--text-4)",fontSize:16,lineHeight:1}}>‹</span>
            </button>

            <h1 style={{fontSize:22,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.5px",marginBottom:4}}>Create your account</h1>
            <p style={{fontSize:13,color:"var(--text-3)",marginBottom:24,lineHeight:1.5}}>Fill in your details below</p>

            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Full Name */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7}}>Full Name</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:focused==="name"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused("")}
                    placeholder="John Doe"
                    style={inp("name")}
                  />
                </div>
                <p style={{fontSize:11,color:"var(--text-4)",marginTop:5}}>⚠ This name will be used to sign in</p>
              </div>

              {/* Email */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7}}>Email Address</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:focused==="email"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder="john@example.com"
                    style={inp("email")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7}}>Password</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:focused==="password"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    placeholder="Min. 6 characters"
                    style={{...inp("password"), paddingRight:44}}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4,color:"var(--text-4)",display:"flex"}}>
                    {showPass
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {form.password && (
                  <div style={{display:"flex",gap:3,marginTop:6}}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{flex:1,height:3,borderRadius:99,background:pwStrength()>=i?strColors[pwStrength()]:"var(--bg-4)",transition:"background 0.3s"}}/>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:7}}>Confirm Password</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none",display:"flex"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused("")}
                    placeholder="Re-enter password"
                    style={{
                      ...inp("confirm"),
                      borderColor: form.confirmPassword && form.password !== form.confirmPassword
                        ? "var(--red)"
                        : focused==="confirm" ? "var(--accent)" : "var(--border-2)",
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={() => setStep(1)} className="back">← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="pri" style={{flex:1}}>
                  {loading
                    ? <span style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                        <span style={{width:15,height:15,border:"2px solid rgba(13,17,23,0.3)",borderTopColor:"#0D1117",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
                        Creating...
                      </span>
                    : "Create Account"
                  }
                </button>
              </div>
            </div>

            <div style={{textAlign:"center",marginTop:20}}>
              <span style={{color:"var(--text-4)",fontSize:13}}>Already have an account? </span>
              <button onClick={onSwitchToLogin} style={{background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer"}}>Sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
