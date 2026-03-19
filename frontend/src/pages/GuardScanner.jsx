import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { outingAPI } from "../utils/api";
import { useToast } from "../components/Toast";

function formatDT(dt) { if(!dt)return"\u2014"; return new Date(dt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}); }

export default function GuardScanner() {
  const {user,logout}=useAuth();
  const {toast}=useToast();
  const [outingId,setOutingId]=useState("");
  const [scanResult,setScanResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [recentScans,setRecentScans]=useState([]);
  const [showScanner,setShowScanner]=useState(false);

  useEffect(()=>{
    if(!showScanner) return;
    let html5QrcodeScanner=null;
    const init=async()=>{
      try{
        const{Html5QrcodeScanner}=await import('html5-qrcode');
        html5QrcodeScanner=new Html5QrcodeScanner("qr-reader",{fps:10,qrbox:{width:250,height:250}},false);
        html5QrcodeScanner.render((text)=>{
          const match=text.match(/ID:(\d+)/);
          if(match){const id=match[1];setOutingId(id);toast(`Scanned ID: ${id}`,"success");fetchOutingById(id);setShowScanner(false);html5QrcodeScanner?.clear();}
          else toast("Invalid QR format","warn");
        },(e)=>console.debug("Scan:",e));
      }catch{toast("Camera access denied","error");setShowScanner(false);}
    };
    init();
    return()=>html5QrcodeScanner?.clear().catch(()=>{});
  },[showScanner,toast]);

  const fetchOutingById=async(id)=>{
    const sid=id||outingId;
    if(!sid.trim())return toast("Enter outing ID","warn");
    setLoading(true);setScanResult(null);
    try{const d=await outingAPI.getById(Number(sid));setScanResult({type:"preview",data:d});}
    catch(e){toast("Not found: "+e.message,"error");}
    finally{setLoading(false);}
  };

  const handleScan=async()=>{
    if(!scanResult?.data?.id)return;setScanning(true);
    try{const r=await outingAPI.scan(scanResult.data.id);toast(`${r.studentName} marked OUT`,"success");setRecentScans(p=>[{...r,scannedAt:new Date(),eventType:"OUT"},...p.slice(0,9)]);setScanResult({type:"success",data:r});setOutingId("");}
    catch(e){toast(e.message||"Scan failed","error");if((e.message||"").includes("NOT approved"))setScanResult(p=>({...p,error:"NOT approved to leave!"}));}
    finally{setScanning(false);}
  };

  const handleReturn=async()=>{
    if(!scanResult?.data?.id)return;setScanning(true);
    try{const r=await outingAPI.returnIn(scanResult.data.id);toast(`${r.studentName} marked RETURNED`,"success");setRecentScans(p=>[{...r,scannedAt:new Date(),eventType:"IN"},...p.slice(0,9)]);setScanResult({type:"returned",data:r});setOutingId("");}
    catch(e){toast(e.message||"Return failed","error");}
    finally{setScanning(false);}
  };

  const statusColor={PENDING:"#F0A500",APPROVED:"#00B894",OUT:"#2DD4BF",OVERDUE:"#E74C3C",RETURNED:"#8A8A8A"};
  const todayScans = recentScans.length;

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes ripple { to{transform:scale(2.5);opacity:0} }
        ::placeholder { color:#999 !important; }
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
      `}</style>

      {/* Scanner modal */}
      {showScanner&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20}}>
          <div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:480,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{color:"var(--text-1)",fontSize:18,fontWeight:700}}>Scan QR Code</h3>
              <button onClick={()=>setShowScanner(false)} style={{width:30,height:30,borderRadius:8,background:"var(--bg-3)",border:"1px solid var(--border-2)",color:"var(--text-2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>&times;</button>
            </div>
            <div id="qr-reader" style={{width:"100%",borderRadius:10}}></div>
            <p style={{color:"var(--text-3)",fontSize:13,marginTop:14,textAlign:"center"}}>Point camera at student's QR code</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{width:260,background:"var(--sidebar-bg)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"24px 16px",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 8px",marginBottom:20}}>
            <div style={{width:36,height:36,borderRadius:10,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M16 2L28 8V16C28 22.627 22.627 28 16 30C9.373 28 4 22.627 4 16V8L16 2Z" fill="#fff"/><path d="M12 16L15 19L21 13" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>SmartOuting</div>
              <div style={{fontSize:11,color:"#55efc4",marginTop:1}}>Guard Panel</div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"rgba(0,184,148,0.06)",borderRadius:10,border:"1px solid rgba(0,184,148,0.12)",marginBottom:20}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#fd79a8,#e84393)",color:"#fff",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{user?.name?.[0]?.toUpperCase()||"G"}</div>
            <div>
              <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{user?.name}</div>
              <div style={{color:"#55efc4",fontSize:12,marginTop:1}}>Gate Guard</div>
            </div>
          </div>

          {/* Session stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
            <div style={{padding:"12px",background:"rgba(0,184,148,0.06)",borderRadius:8,border:"1px solid rgba(0,184,148,0.10)"}}>
              <div style={{fontSize:10,color:"var(--sidebar-text)",opacity:0.6,textTransform:"uppercase",letterSpacing:"0.3px"}}>Scans</div>
              <div style={{fontSize:22,fontWeight:800,color:"#55efc4",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{todayScans}</div>
            </div>
            <div style={{padding:"12px",background:"rgba(45,212,191,0.06)",borderRadius:8,border:"1px solid rgba(45,212,191,0.10)"}}>
              <div style={{fontSize:10,color:"var(--sidebar-text)",opacity:0.6,textTransform:"uppercase",letterSpacing:"0.3px"}}>Session</div>
              <div style={{fontSize:22,fontWeight:800,color:"#5EEAD4",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#55efc4",display:"inline-block",marginRight:6,verticalAlign:"middle"}}/>ON
              </div>
            </div>
          </div>

          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",padding:16,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--sidebar-text)",textTransform:"uppercase",letterSpacing:"0.4px",opacity:0.6,marginBottom:2}}>How to verify</div>
            {["Click 'Scan QR' button","Point camera at QR code","System extracts ID","Click 'Mark OUT' to exit","Click 'Mark IN' when return"].map((step,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{width:20,height:20,borderRadius:"50%",background:"var(--sidebar-active)",color:"#2DD4BF",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
                <span style={{fontSize:12,color:"var(--sidebar-text)",opacity:0.8}}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:8,border:"1px solid rgba(231,76,60,0.15)",background:"rgba(231,76,60,0.05)",color:"#E74C3C",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sign Out
        </button>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,background:"var(--bg)",padding:"36px 44px",overflow:"auto"}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"var(--text-1)",marginBottom:4}}>Gate Scanner</h1>
        <p style={{color:"var(--text-3)",fontSize:14,marginBottom:28}}>Scan QR or enter ID manually to verify students</p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:700}}>
          {/* QR Scan Card */}
          <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,padding:"32px 28px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",animation:"fadeIn 0.3s ease"}}>
            <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#00b894,#55efc4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",position:"relative"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <h3 style={{fontSize:16,fontWeight:700,color:"var(--text-1)",marginBottom:6}}>Scan QR Code</h3>
            <p style={{color:"var(--text-3)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Use camera to scan student's approved QR code</p>
            <button onClick={()=>setShowScanner(true)} style={{width:"100%",padding:"13px 24px",background:"linear-gradient(135deg,#00b894,#55efc4)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,184,148,0.25)",transition:"all 0.2s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:8}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Open Scanner
            </button>
          </div>

          {/* Manual Lookup Card */}
          <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,padding:"32px 28px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",animation:"fadeIn 0.3s ease 0.1s",animationFillMode:"both"}}>
            <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#2DD4BF,#5EEAD4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 style={{fontSize:16,fontWeight:700,color:"var(--text-1)",marginBottom:6}}>Manual Lookup</h3>
            <p style={{color:"var(--text-3)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Enter outing ID to fetch student details</p>
            <div style={{display:"flex",gap:8}}>
              <input value={outingId} onChange={e=>setOutingId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchOutingById()} placeholder="ID" type="number"
                style={{flex:1,padding:"12px 14px",background:"var(--bg-3)",border:"1.5px solid var(--border-2)",borderRadius:10,color:"var(--text-1)",fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",outline:"none",textAlign:"center",letterSpacing:"3px"}} />
              <button onClick={fetchOutingById} disabled={loading} style={{padding:"12px 20px",background:"var(--accent)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {loading?"...":"Lookup"}
              </button>
            </div>
          </div>
        </div>

        {/* RESULT CARD */}
        {scanResult&&(
          <div style={{marginTop:24,maxWidth:700,background:"#fff",border:`1.5px solid ${scanResult.type==="success"?"rgba(0,184,148,0.25)":scanResult.error?"rgba(231,76,60,0.25)":"var(--border)"}`,borderRadius:16,padding:28,boxShadow:"0 4px 20px rgba(0,0,0,0.06)",animation:"fadeIn 0.25s ease"}}>
            {scanResult.error?(
              <div style={{textAlign:"center",padding:"16px 0"}}>
                <div style={{width:52,height:52,borderRadius:14,background:"rgba(231,76,60,0.08)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <div style={{color:"#E74C3C",fontWeight:700,fontSize:16}}>{scanResult.error}</div>
                <p style={{color:"var(--text-3)",fontSize:13,marginTop:6}}>This student is not approved to leave campus</p>
              </div>
            ):(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:16,borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"var(--accent)",color:"#fff",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{scanResult.data.studentName?.[0]?.toUpperCase()||"?"}</div>
                    <div>
                      <div style={{color:"var(--text-1)",fontSize:18,fontWeight:800}}>{scanResult.data.studentName}</div>
                      <div style={{color:"var(--text-3)",fontSize:13,marginTop:2}}>ID: {scanResult.data.studentId} &bull; Outing #{scanResult.data.id}</div>
                    </div>
                  </div>
                  <span style={{padding:"6px 16px",borderRadius:99,fontSize:12,fontWeight:700,background:`${statusColor[scanResult.data.status]}15`,color:statusColor[scanResult.data.status],border:`1.5px solid ${statusColor[scanResult.data.status]}30`}}>{scanResult.data.status}</span>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                  {[{l:"Destination",v:scanResult.data.destination,icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>},
                    {l:"Reason",v:scanResult.data.reason,icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
                    {l:"Out Date",v:formatDT(scanResult.data.outDate),icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
                    {l:"Return Date",v:formatDT(scanResult.data.returnDate),icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  ].map(({l,v,icon})=>(
                    <div key={l} style={{padding:"12px 14px",background:"var(--bg)",borderRadius:10,border:"1px solid var(--border)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        {icon}
                        <span style={{fontSize:11,fontWeight:600,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.3px"}}>{l}</span>
                      </div>
                      <div style={{fontSize:14,color:"var(--text-1)",fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* AI Flag if present */}
                {scanResult.data.aiFlag && (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:scanResult.data.aiFlag==="MEDICAL_EMERGENCY"?"rgba(231,76,60,0.06)":scanResult.data.aiFlag==="URGENT"?"rgba(243,156,18,0.06)":scanResult.data.aiFlag==="SUSPICIOUS"?"rgba(108,92,231,0.06)":"rgba(0,184,148,0.06)",borderRadius:10,border:`1px solid ${scanResult.data.aiFlag==="MEDICAL_EMERGENCY"?"rgba(231,76,60,0.15)":scanResult.data.aiFlag==="URGENT"?"rgba(243,156,18,0.15)":scanResult.data.aiFlag==="SUSPICIOUS"?"rgba(108,92,231,0.15)":"rgba(0,184,148,0.15)"}`,marginBottom:16}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={scanResult.data.aiFlag==="MEDICAL_EMERGENCY"?"#E74C3C":scanResult.data.aiFlag==="URGENT"?"#F39C12":scanResult.data.aiFlag==="SUSPICIOUS"?"#6C5CE7":"#00B894"} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <div>
                      <span style={{fontSize:12,fontWeight:700,color:scanResult.data.aiFlag==="MEDICAL_EMERGENCY"?"#E74C3C":scanResult.data.aiFlag==="URGENT"?"#F39C12":scanResult.data.aiFlag==="SUSPICIOUS"?"#6C5CE7":"#00B894"}}>AI: {scanResult.data.aiFlag}</span>
                      {scanResult.data.urgencyScore!=null && <span style={{fontSize:11,color:"var(--text-3)",marginLeft:8}}>Score: {scanResult.data.urgencyScore}</span>}
                    </div>
                  </div>
                )}

                {scanResult.type==="success"&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",background:"rgba(0,184,148,0.06)",border:"1px solid rgba(0,184,148,0.15)",borderRadius:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"#00B894",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div><div style={{color:"#00B894",fontWeight:700,fontSize:15}}>Successfully Marked OUT</div><div style={{color:"var(--text-3)",fontSize:12,marginTop:2}}>Parent notification email sent</div></div>
                  </div>
                )}
                {scanResult.type==="returned"&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",background:"rgba(45,212,191,0.06)",border:"1px solid rgba(45,212,191,0.12)",borderRadius:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"#2DD4BF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div><div style={{color:"#2DD4BF",fontWeight:700,fontSize:15}}>Successfully Marked RETURNED</div><div style={{color:"var(--text-3)",fontSize:12,marginTop:2}}>Student is back on campus</div></div>
                  </div>
                )}
                {scanResult.type==="preview"&&(
                  <div style={{display:"flex",gap:10}}>
                    {scanResult.data.status==="APPROVED"&&<button onClick={handleScan} disabled={scanning} style={{flex:1,padding:"14px",background:"linear-gradient(135deg,#00b894,#55efc4)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,184,148,0.25)"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:6}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      {scanning?"Processing...":"Mark OUT (Exit Campus)"}
                    </button>}
                    {(scanResult.data.status==="OUT"||scanResult.data.status==="OVERDUE")&&<button onClick={handleReturn} disabled={scanning} style={{flex:1,padding:"14px",background:"var(--accent)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(45,212,191,0.25)"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:6}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      {scanning?"Processing...":"Mark IN (Return to Campus)"}
                    </button>}
                    {!["APPROVED","OUT","OVERDUE"].includes(scanResult.data.status)&&(
                      <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:"rgba(240,165,0,0.06)",border:"1px solid rgba(240,165,0,0.15)",borderRadius:10}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span style={{fontSize:13,color:"#D4880F"}}>Status: <strong>{scanResult.data.status}</strong> — Cannot process</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Recent scans */}
        {recentScans.length>0&&(
          <div style={{marginTop:24,maxWidth:700,background:"#fff",border:"1px solid var(--border)",borderRadius:14,padding:22,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"var(--text-2)",textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:14}}>Recent Scans</h2>
            {recentScans.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<recentScans.length-1?"1px solid var(--border)":"none"}}>
                <div style={{width:30,height:30,borderRadius:8,background:s.eventType==="IN"?"rgba(45,212,191,0.08)":"rgba(0,184,148,0.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {s.eventType==="IN"
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00B894" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  }
                </div>
                <span style={{color:"var(--text-1)",fontWeight:600,fontSize:13}}>{s.studentName}</span>
                <span style={{color:"var(--text-3)",fontSize:12}}>{s.destination}</span>
                <span style={{marginLeft:"auto",padding:"4px 10px",borderRadius:6,background:s.eventType==="IN"?"rgba(45,212,191,0.08)":"rgba(0,184,148,0.08)",color:s.eventType==="IN"?"#2DD4BF":"#00B894",fontSize:11,fontWeight:600}}>{s.eventType} &bull; {s.scannedAt?.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
