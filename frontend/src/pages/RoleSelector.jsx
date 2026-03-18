import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value:"STUDENT", label:"Student",   icon:"🎓", desc:"Apply for outings, track approvals, view your QR codes", color:"var(--accent)",  bg:"rgba(45,212,191,0.07)",  bd:"rgba(45,212,191,0.2)" },
  { value:"WARDEN",  label:"Warden",    icon:"🏛️", desc:"Review requests, approve outings, monitor campus",       color:"var(--purple)",  bg:"rgba(167,139,250,0.07)", bd:"rgba(167,139,250,0.2)" },
  { value:"GUARD",   label:"Gate Guard",icon:"🛡️", desc:"Verify student QR codes, manage gate entry & exit",      color:"var(--green)",   bg:"rgba(34,197,94,0.07)",   bd:"rgba(34,197,94,0.2)" },
];

export default function RoleSelector() {
  const { setUserRole } = useAuth();
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative",overflow:"hidden",padding:20}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(45,212,191,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.03) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,rgba(45,212,191,0.05) 0%,transparent 60%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",background:"var(--bg-2)",border:"1px solid var(--border-2)",borderRadius:20,padding:"44px 40px",width:"100%",maxWidth:520,boxShadow:"0 24px 60px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <div style={{width:38,height:38,borderRadius:10,background:"var(--accent-dim)",border:"1px solid rgba(45,212,191,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="url(#rsg)"/><path d="M12 16L15 19L21 13" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="rsg" x1="4" y1="2" x2="28" y2="30"><stop stopColor="#2DD4BF"/><stop offset="1" stopColor="#14B8A6"/></linearGradient></defs></svg>
          </div>
          <span style={{fontSize:15,fontWeight:800,color:"var(--text-1)"}}>SmartOuting</span>
        </div>

        <h1 style={{fontSize:24,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.5px",marginBottom:8}}>How are you using SmartOuting?</h1>
        <p style={{fontSize:14,color:"var(--text-3)",marginBottom:28,lineHeight:1.6}}>Select your role to access your dashboard.</p>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {ROLES.map(r=>(
            <button key={r.value} onClick={()=>setUserRole(r.value)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",border:`1.5px solid ${r.bd}`,borderRadius:12,cursor:"pointer",textAlign:"left",background:r.bg,transition:"transform 0.15s,box-shadow 0.15s",width:"100%"}}>
              <span style={{fontSize:22}}>{r.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:r.color,marginBottom:3}}>{r.label}</div>
                <div style={{fontSize:12,color:"var(--text-4)",lineHeight:1.4}}>{r.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{color:r.color,flexShrink:0}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
