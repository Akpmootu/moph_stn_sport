const OWNER_EMAIL = 'dh.satun@gmail.com';
const TABLES = {
  Sports: ['id','name','short','icon','color','dates'],
  News: ['id','type','title','body','date','tone','art','imageId'],
  Scores: ['eventKey','teamA','teamB','a','b'],
  Registrations: ['id','sport','type','agency','name','phone','team','email','note','created'],
  Media: ['id','name','mimeType','created']
};
function requireAdmin_() {
  if (Session.getActiveUser().getEmail().toLowerCase() !== OWNER_EMAIL) throw new Error('ต้องลงชื่อเข้าใช้ด้วยบัญชีผู้ดูแล '+OWNER_EMAIL);
}
function locked_(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function db_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('เจ้าของระบบต้องเรียก setupGoogleStorage ก่อน');
  return SpreadsheetApp.openById(id);
}
function rows_(name) {
  const values = db_().getSheetByName(name).getDataRange().getValues();
  return values.slice(1).filter(row=>row.some(v=>v!=='')).map(row=>Object.fromEntries(TABLES[name].map((k,i)=>[k, String(row[i] ?? '').replace(/^'(?=[=+@-])/, '')])));
}
function append_(name, obj) {
  const sheet = db_().getSheetByName(name);
  const row = TABLES[name].map(k=>{
    const v = obj[k] ?? '';
    return typeof v === 'string' && /^[=+@-]/.test(v) ? "'"+v : v;
  });
  const target = sheet.getRange(sheet.getLastRow()+1,1,1,row.length);
  target.setNumberFormat('@'); target.setValues([row]);
}
function setupGoogleStorage() {
  requireAdmin_();
  return locked_(()=>{
    const props=PropertiesService.getScriptProperties();
    if (!props.getProperty('DRIVE_FOLDER_ID')) {
      const folder=DriveApp.createFolder('Satun Sports 2570');
      props.setProperty('DRIVE_FOLDER_ID',folder.getId());
    }
    if (!props.getProperty('SPREADSHEET_ID')) {
      const ss=SpreadsheetApp.create('Satun Sports 2570 — ข้อมูลเว็บไซต์');
      props.setProperty('SPREADSHEET_ID',ss.getId());
      DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(props.getProperty('DRIVE_FOLDER_ID')));
    }
    const ss=db_();
    const folder=DriveApp.getFolderById(props.getProperty('DRIVE_FOLDER_ID'));
    for (const [name,base64] of Object.entries(BRAND_ASSETS)) {
      if (!props.getProperty('ASSET_'+name)) {
        const file=folder.createFile(Utilities.newBlob(Utilities.base64Decode(base64),'image/webp',name+'.webp'));
        props.setProperty('ASSET_'+name,file.getId());
      }
    }
    for (const [name,headers] of Object.entries(TABLES)) {
      let sheet=ss.getSheetByName(name);
      if (!sheet) { sheet=ss.insertSheet(name); sheet.appendRow(headers); sheet.setFrozenRows(1); }
      if (sheet.getRange(1,1,1,headers.length).getValues()[0].join('|')!==headers.join('|')) throw new Error('หัวตารางไม่ตรง: '+name);
    }
    if (!rows_('Sports').length) SEED_SPORTS.forEach(s=>append_('Sports',{...s,dates:JSON.stringify(s.dates)}));
    if (!rows_('News').length) SEED_NEWS.forEach(n=>append_('News',n));
    console.log(JSON.stringify({spreadsheet:ss.getUrl(),folder:'https://drive.google.com/drive/folders/'+props.getProperty('DRIVE_FOLDER_ID')}));
    return {spreadsheet:ss.getUrl()};
  });
}
function doGet() {
  let html=HtmlService.createHtmlOutputFromFile('Index').getContent();
  for (const name of ['logo','mascot']) {
    const id=PropertiesService.getScriptProperties().getProperty('ASSET_'+name);
    if (!id) throw new Error('กรุณาเรียก setupGoogleStorage ก่อนเปิดเว็บไซต์');
    const url='data:image/webp;base64,'+Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes());
    html=html.split('assets/'+name+'.webp').join(url);
  }
  return HtmlService.createHtmlOutput(html).setTitle('กีฬา สา’สุข สตูล 2570').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function getPublicData() {
  return {sports:rows_('Sports').map(s=>({...s,dates:JSON.parse(s.dates)})),articles:rows_('News').reverse(),scores:rows_('Scores'),isAdmin:Session.getActiveUser().getEmail().toLowerCase()===OWNER_EMAIL};
}
function text_(value,max,required=true) {
  if (typeof value!=='string' || value.length>max || (required&&!value.trim())) throw new Error('ข้อมูลไม่ครบหรือยาวเกินกำหนด');
  return value.trim();
}
function registerParticipant(data) {
  if (!data || data.consent!==true) throw new Error('กรุณายินยอมให้เก็บข้อมูลเพื่อจัดการแข่งขัน');
  const obj={id:Utilities.getUuid(),created:new Date().toISOString()};
  for (const [k,max] of Object.entries({sport:30,type:20,agency:120,name:100,phone:15,team:120,email:120,note:800})) obj[k]=text_(data[k],max,!['team','email','note'].includes(k));
  if (!rows_('Sports').some(s=>s.id===obj.sport) || !['ทีม','บุคคล'].includes(obj.type) || !/^[0-9+\- ]{9,15}$/.test(obj.phone) || (obj.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email))) throw new Error('กรุณาตรวจสอบประเภทกีฬา เบอร์โทร และอีเมล');
  // Best-effort abuse protection for Apps Script's anonymous public endpoint.
  return locked_(()=>{
    const cache=CacheService.getScriptCache();
    const key='reg:'+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,obj.phone+obj.sport));
    if (cache.get(key)) throw new Error('ส่งรายการนี้แล้ว กรุณารอ 5 นาที');
    append_('Registrations',obj); cache.put(key,'1',300); return {id:obj.id};
  });
}
function getRegistrations() { requireAdmin_(); return rows_('Registrations'); }
function saveScore(data) {
  requireAdmin_();
  const obj={eventKey:text_(data.eventKey,80),teamA:text_(data.teamA,120),teamB:text_(data.teamB,120)};
  const valid=rows_('Sports').some(s=>JSON.parse(s.dates).some(([m,d])=>`${s.id}-${m}-${d}`===obj.eventKey));
  if (!valid) throw new Error('ไม่พบรายการแข่งขัน');
  for (const k of ['a','b']) { if (!Number.isInteger(data[k])||data[k]<0||data[k]>10000) throw new Error('คะแนนไม่ถูกต้อง'); obj[k]=data[k]; }
  return locked_(()=>{
    const existing=rows_('Scores').findIndex(s=>s.eventKey===obj.eventKey);
    if (existing>=0) {
      const row=TABLES.Scores.map(k=>typeof obj[k]==='string'&&/^[=+@-]/.test(obj[k])?"'"+obj[k]:obj[k]);
      const range=db_().getSheetByName('Scores').getRange(existing+2,1,1,row.length);
      range.setNumberFormat('@');range.setValues([row]);
    } else append_('Scores',obj); return {ok:true};
  });
}
function publishNews(data) {
  requireAdmin_();
  const obj={id:Utilities.getUuid(),type:text_(data.type,40),title:text_(data.title,200),body:text_(data.body,10000),date:new Date().toISOString(),tone:'blue',art:'📰',imageId:''};
  if (!['ข่าว','ประกาศ','รายงานกิจกรรม'].includes(obj.type)) throw new Error('หมวดข่าวไม่ถูกต้อง');
  if (data.image) {
    const image=data.image;
    if (!['image/jpeg','image/png','image/webp'].includes(image.mimeType)||typeof image.base64!=='string'||image.base64.length>2800000) throw new Error('ใช้ภาพ JPG, PNG, WebP ขนาดไม่เกิน 2 MB');
    const bytes=Utilities.base64Decode(image.base64);
    const b=bytes.map(v=>(v+256)%256);
    const valid=image.mimeType==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:image.mimeType==='image/png'?b.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
    if (!valid||bytes.length>2*1024*1024) throw new Error('ไฟล์ภาพไม่ถูกต้อง');
    const folder=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));
    const file=folder.createFile(Utilities.newBlob(bytes,image.mimeType,obj.id+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[image.mimeType])));
    obj.imageId=file.getId();
    try { locked_(()=>{append_('Media',{id:file.getId(),name:file.getName(),mimeType:image.mimeType,created:obj.date});append_('News',obj);}); }
    catch(e) { file.setTrashed(true); throw e; }
  } else locked_(()=>append_('News',obj));
  return {id:obj.id};
}
function getNewsImage(id) {
  if (typeof id!=='string'||!rows_('News').some(n=>n.imageId===id)) throw new Error('ไม่พบภาพที่เผยแพร่');
  const file=DriveApp.getFileById(id); const blob=file.getBlob();
  return 'data:'+blob.getContentType()+';base64,'+Utilities.base64Encode(blob.getBytes());
}
