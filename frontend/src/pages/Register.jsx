import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const ROLES = [
  { value:"STUDENT", label:"Student",    desc:"Apply for campus outings & track requests",  color:"var(--accent)",  bg:"var(--accent-dim)",  bd:"rgba(129,140,248,0.2)"  },
  { value:"WARDEN",  label:"Warden",     desc:"Review, approve & monitor student activity", color:"var(--purple)",  bg:"rgba(192,132,252,0.08)", bd:"rgba(192,132,252,0.2)" },
  { value:"GUARD",   label:"Gate Guard",  desc:"Verify QR codes at campus entry & exit",     color:"var(--green)",   bg:"rgba(52,211,153,0.08)",  bd:"rgba(52,211,153,0.2)"  },
];

const RoleIcon = ({ role, size = 18 }) => {
  const icons = {
    STUDENT: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>,
    WARDEN: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M3 7l9-4 9 4"/><path d="M6 21V11m12 10V11"/></svg>,
    GUARD: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return icons[role] || null;
};

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const { toast }    = useToast();

  const [step, setStep]             = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm]             = useState({ name:"", email:"", password:"", confirmPassword:"" });
  const [loading, setLoading]       = useState(false);
  const [focused, setFocused]       = useState("");
  const [showPass, setShowPass]     = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const proceedToDetails = () => {
    if (!selectedRole) return toast("Please select your role to continue", "warn");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.name.trim())                               return toast("Name is required", "warn");
    if (!form.email.trim() || !form.email.includes("@")) return toast("Valid email required", "warn");
    if (form.password.length < 6)                        return toast("Password must be at least 6 characters", "warn");
    if (form.password !== form.confirmPassword)          return toast("Passwords do not match", "error");
    setLoading(true);
    try {
      await register({ name:form.name.trim(), email:form.email.trim().toLowerCase(), password:form.password, role:selectedRole.value });
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

  const pwStrength = () => { const l=form.password.length; if(!l)return 0; if(l<4)return 1; if(l<6)return 2; if(l<10)return 3; return 4; };
  const strColors = ["","var(--red)","var(--orange)","var(--amber)","var(--green)"];

  const inp = (name) => ({
    width:"100%", padding:"11px 14px 11px 40px",
    background: focused===name ? "rgba(129,140,248,0.04)" : "var(--bg-3)",
    border: `1px solid ${focused===name ? "var(--accent)" : "var(--border-3)"}`,
    boxShadow: focused===name ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
    borderRadius:8, color:"var(--text-1)", fontSize:14, outline:"none", transition:"all 0.2s",
  });

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden",padding:20}}>
      <style>{`
        input { color-scheme:dark; }
        ::placeholder { color:var(--text-4) !important; }
        .reg-bg { position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 40%,rgba(129,140,248,0.04) 0%,transparent 60%);pointer-events:none;z-index:0; }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pri { padding:11px 20px;background:var(--accent-2);border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:background 0.2s;font-family:'Inter',sans-serif; }
        .pri:hover:not(:disabled) { background:#4F46E5; }
        .pri:disabled { opacity:0.6;cursor:not-allowed; }
        .back { padding:11px 16px;background:transparent;border:1px solid var(--border-3);border-radius:8px;color:var(--text-2);font-size:14px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif; }
        .back:hover { border-color:var(--accent);color:var(--accent); }
        .rc { display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid;border-radius:10px;cursor:pointer;text-align:left;background:transparent;transition:all 0.15s;width:100%;font-family:'Inter',sans-serif; }
        .rc:hover { transform:translateY(-1px); }
      `}</style>
      <div className="reg-bg"/>

      <div style={{position:"relative",zIndex:1,background:"var(--bg-2)",border:"1px solid var(--border-2)",borderRadius:16,padding:"36px 36px",width:"100%",maxWidth:440,boxShadow:"0 16px 48px rgba(0,0,0,0.4)",animation:"cardIn 0.4s ease"}}>

        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
          <div style={{width:34,height:34,borderRadius:8,background:"var(--accent-dim)",border:"1px solid rgba(129,140,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)"/>
              <path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)"}}>SmartOuting</div>
            <div style={{fontSize:11,color:"var(--text-4)",marginTop:1}}>Campus Management</div>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:22}}>
          {[{n:1,label:"Choose Role"},{n:2,label:"Your Details"}].map(({n,label},i) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,transition:"all 0.3s",
                background:step>=n?"var(--accent-2)":"var(--bg-3)",
                color:step>=n?"#fff":"var(--text-4)",
                border:step>=n?"none":"1px solid var(--border-2)"}}>
                {step>n ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg> : n}
              </div>
              <span style={{fontSize:12,fontWeight:500,color:step>=n?"var(--text-2)":"var(--text-4)"}}>{label}</span>
              {i<1 && <div style={{width:24,height:1.5,background:step>n?"var(--accent)":"var(--border-2)",margin:"0 4px",borderRadius:2,transition:"background 0.3s"}}/>}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h1 style={{fontSize:20,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.3px",marginBottom:4}}>Who are you?</h1>
            <p style={{fontSize:13,color:"var(--text-3)",marginBottom:20,lineHeight:1.5}}>Select your role to get the right experience</p>

            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setSelectedRole(r)} className="rc"
                  style={{borderColor:selectedRole?.value===r.value?r.bd:"var(--border-2)",background:selectedRole?.value===r.value?r.bg:"transparent"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:selectedRole?.value===r.value?r.bg:"var(--bg-3)",border:`1px solid ${selectedRole?.value===r.value?r.bd:"var(--border-2)"}`,display:"flex",alignItems:"center",justifyContent:"center",color:selectedRole?.value===r.value?r.color:"var(--text-4)",flexShrink:0}}>
                    <RoleIcon role={r.value} size={16} />
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:selectedRole?.value===r.value?r.color:"var(--text-1)",marginBottom:2}}>{r.label}</div>
                    <div style={{fontSize:12,color:"var(--text-4)",lineHeight:1.4}}>{r.desc}</div>
                  </div>
                  {selectedRole?.value===r.value && (
                    <div style={{width:18,height:18,borderRadius:"50%",background:"var(--accent-2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={proceedToDetails} className="pri" style={{opacity:selectedRole?1:0.4,cursor:selectedRole?"pointer":"default"}}>
              {selectedRole ? `Continue as ${selectedRole.label}` : "Select a role to continue"}
            </button>

            <div style={{textAlign:"center",marginTop:18}}>
              <span style={{color:"var(--text-4)",fontSize:13}}>Already have an account? </span>
              <button onClick={onSwitchToLogin} style={{background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sign in</button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <button onClick={() => setStep(1)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",marginBottom:18,padding:"10px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",background:selectedRole.bg,border:`1px solid ${selectedRole.bd}`}}>
              <div style={{width:28,height:28,borderRadius:6,background:selectedRole.bg,border:`1px solid ${selectedRole.bd}`,display:"flex",alignItems:"center",justifyContent:"center",color:selectedRole.color}}>
                <RoleIcon role={selectedRole.value} size={14} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:selectedRole.color}}>Registering as {selectedRole.label}</div>
                <div style={{fontSize:11,color:"var(--text-4)",marginTop:1}}>Click to change role</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:"var(--text-4)"}}><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <h1 style={{fontSize:20,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.3px",marginBottom:4}}>Create your account</h1>
            <p style={{fontSize:13,color:"var(--text-3)",marginBottom:22,lineHeight:1.5}}>Fill in your details below</p>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Full Name</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:focused==="name"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input name="name" value={form.name} onChange={handleChange} onFocus={()=>setFocused("name")} onBlur={()=>setFocused("")} placeholder="John Doe" style={inp("name")}/>
                </div>
                <p style={{fontSize:11,color:"var(--text-4)",marginTop:4}}>This name will be used to sign in</p>
              </div>

              <div>
                <label style={{display:"block",fontSize:13,fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Email Address</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:focused==="email"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")} placeholder="john@example.com" style={inp("email")}/>
                </div>
              </div>

              <div>
                <label style={{display:"block",fontSize:13,fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Password</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:focused==="password"?"var(--accent)":"var(--text-4)",pointerEvents:"none",display:"flex",transition:"color 0.2s"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handleChange} onFocus={()=>setFocused("password")} onBlur={()=>setFocused("")} placeholder="Min. 6 characters" style={{...inp("password"),paddingRight:42}}/>
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4,color:"var(--text-4)",display:"flex"}}>
                    {showPass
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {form.password && (
                  <div style={{display:"flex",gap:3,marginTop:6}}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{flex:1,height:2,borderRadius:99,background:pwStrength()>=i?strColors[pwStrength()]:"var(--bg-4)",transition:"background 0.3s"}}/>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{display:"block",fontSize:13,fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Confirm Password</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none",display:"flex"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} onFocus={()=>setFocused("confirm")} onBlur={()=>setFocused("")} placeholder="Re-enter password"
                    style={{...inp("confirm"),borderColor:form.confirmPassword&&form.password!==form.confirmPassword?"var(--red)":focused==="confirm"?"var(--accent)":"var(--border-3)"}}/>
                </div>
              </div>

              <div style={{display:"flex",gap:10,marginTop:2}}>
                <button onClick={()=>setStep(1)} className="back">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="pri" style={{flex:1}}>
                  {loading
                    ? <span style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                        <span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
                        Creating...
                      </span>
                    : "Create Account"
                  }
                </button>
              </div>
            </div>

            <div style={{textAlign:"center",marginTop:18}}>
              <span style={{color:"var(--text-4)",fontSize:13}}>Already have an account? </span>
              <button onClick={onSwitchToLogin} style={{background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
