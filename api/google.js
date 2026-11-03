const ALLOWED = new Set(['getPublicData', 'registerParticipant', 'registerCoordinator', 'getNewsImage']);
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  let body;
  try { body=typeof req.body==='string'?JSON.parse(req.body):req.body; }
  catch { return res.status(400).json({ok:false,error:'Invalid JSON'}); }
  if (!body || !ALLOWED.has(body.method) || !Array.isArray(body.args) || body.args.length>1 || Buffer.byteLength(JSON.stringify(body))>12000) {
    return res.status(400).json({ok:false,error:'Invalid public operation'});
  }
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  // A fixed environment endpoint prevents clients from turning this into an open proxy.
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
    return res.status(503).json({ok:false,error:'ยังไม่ได้ตั้งค่า GOOGLE_APPS_SCRIPT_URL ของ Web app ใน Vercel'});
  }
  try {
    if (body.method==='registerCoordinator') {
      const check=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:'getPublicData',args:[]}),redirect:'follow',signal:AbortSignal.timeout(25000)});
      const availability=await check.json();
      if(!check.ok||!availability.ok||!Array.isArray(availability.data?.coordinatorAssignments)) {
        return res.status(503).json({ok:false,error:'ระบบลงทะเบียนรออัปเดต Google Apps Script กรุณาติดต่อผู้จัด'});
      }
    }
    const upstream=await fetch(endpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({method:body.method,args:body.args}),
      redirect:'follow',signal:AbortSignal.timeout(25000)
    });
    if (!upstream.ok) throw new Error('Upstream HTTP error');
    const result=await upstream.json();
    if (typeof result.ok!=='boolean' || (result.ok&&!Object.hasOwn(result,'data'))) throw new Error('Invalid Google API response');
    if (!result.ok) return res.status(400).json({ok:false,error:result.error||'Google ปฏิเสธคำขอ'});
    // Never forward an admin flag or private collections through the public site.
    if (body.method==='getPublicData') {
      if (!Array.isArray(result.data.sports)||!Array.isArray(result.data.articles)||!Array.isArray(result.data.scores)) throw new Error('Invalid public data');
      return res.status(200).json({ok:true,data:{sports:result.data.sports,articles:result.data.articles,scores:result.data.scores,coordinatorAssignments:result.data.coordinatorAssignments,teams:result.data.teams,events:result.data.events,isAdmin:false}});
    }
    return res.status(200).json(result);
  } catch {
    return res.status(502).json({ok:false,error:'เชื่อมต่อ Google ไม่สำเร็จ กรุณาตรวจ URL /exec, Deploy เวอร์ชันล่าสุด และสิทธิ์ Anyone'});
  }
};
