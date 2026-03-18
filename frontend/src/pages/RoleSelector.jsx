import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value:"STUDENT", label:"Student",    desc:"Apply for outings, track approvals, view your QR codes", color:"var(--accent)",  bg:"var(--accent-dim)",  bd:"rgba(129,140,248,0.2)" },
  { value:"WARDEN",  label:"Warden",     desc:"Review requests, approve outings, monitor campus",       color:"var(--purple)",  bg:"rgba(192,132,252,0.08)", bd:"rgba(192,132,252,0.2)" },
  { value:"GUARD",   label:"Gate Guard", desc:"Verify student QR codes, manage gate entry & exit",      color:"var(--green)",   bg:"rgba(52,211,153,0.08)",  bd:"rgba(52,211,153,0.2)" },
];

const RoleIcon = ({ role }) => {
  const icons = {
    STUDENT: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>,
    WARDEN: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M3 7l9-4 9 4"/><path d="M6 21V11m12 10V11"/></svg>,
    GUARD: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return icons[role] || null;
};

export default function RoleSelector() {
  const { setUserRole } = useAuth();
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden",padding:20}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,rgba(129,140,248,0.04) 0%,transparent 60%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",background:"var(--bg-2)",border:"1px solid var(--border-2)",borderRadius:16,padding:"36px 36px",width:"100%",maxWidth:480,boxShadow:"0 16px 48px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <div style={{width:34,height:34,borderRadius:8,background:"var(--accent-dim)",border:"1px solid rgba(129,140,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="var(--accent)"/><path d="M12 16L15 19L21 13" stroke="#09090B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{fontSize:14,fontWeight:700,color:"var(--text-1)"}}>SmartOuting</span>
        </div>

        <h1 style={{fontSize:22,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.3px",marginBottom:6}}>How are you using SmartOuting?</h1>
        <p style={{fontSize:14,color:"var(--text-3)",marginBottom:24,lineHeight:1.5}}>Select your role to access your dashboard.</p>

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ROLES.map(r=>(
            <button key={r.value} onClick={()=>setUserRole(r.value)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",border:`1px solid ${r.bd}`,borderRadius:10,cursor:"pointer",textAlign:"left",background:r.bg,transition:"transform 0.15s",width:"100%",fontFamily:"'Inter',sans-serif"}}>
              <div style={{width:36,height:36,borderRadius:8,background:r.bg,border:`1px solid ${r.bd}`,display:"flex",alignItems:"center",justifyContent:"center",color:r.color,flexShrink:0}}>
                <RoleIcon role={r.value} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:r.color,marginBottom:2}}>{r.label}</div>
                <div style={{fontSize:12,color:"var(--text-4)",lineHeight:1.4}}>{r.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:r.color,flexShrink:0}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
