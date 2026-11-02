const fs=require('node:fs');
fs.mkdirSync('public',{recursive:true});
const bridge=`<script>
// Adapter for the public Vercel site; the Apps Script version uses Google's native RPC.
window.SATUN_VERCEL=true;
window.google={script:{get run(){let success=()=>{},failure=()=>{};const runner=new Proxy({},{get:(_,key)=>{
if(key==='withSuccessHandler')return fn=>{success=fn;return runner};
if(key==='withFailureHandler')return fn=>{failure=fn;return runner};
return (...args)=>fetch(['getPublicData','getNewsImage','registerCoordinator','registerParticipant'].includes(key)?'/api/google':'/api/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:key,args})})
.then(async response=>{const result=await response.json();if(!result.ok)throw new Error(result.error||'Google connection failed');return result.data})
.then(data=>{if(key==='getPublicData')document.getElementById('connectionStatus').hidden=true;success(data)}).catch(error=>{if(key==='getPublicData'){const status=document.getElementById('connectionStatus');status.hidden=false;status.textContent='เชื่อมต่อ Google ไม่สำเร็จ: '+error.message+' — กรุณาโหลดหน้าใหม่เพื่อลองอีกครั้ง'}failure(error)});
}});return runner;}}};
</script>`;
let html=fs.readFileSync('apps-script/Index.html','utf8');
html=html.replace('<body>', '<body><div id="connectionStatus" role="status" style="position:relative;padding:12px 20px;background:#102745;color:white;text-align:center">กำลังเชื่อมต่อ Google…</div>');
html=html.replace('<!-- FEATURES -->',fs.readFileSync('apps-script/Features.html','utf8'));
html=html.replace('<script>',bridge+'\n<script>');
html=html.replace("const valid=['home','schedule','results','news','register','admin','manager']", "const valid=['home','schedule','results','news','register','manager']");
// Absolute asset paths work at both / and /moph_stn_sport.
html=html.replaceAll('src="assets/','src="/assets/');
fs.writeFileSync('public/index.html',html);
fs.cpSync('assets','public/assets',{recursive:true});
console.log('Built Vercel public website in public/');
