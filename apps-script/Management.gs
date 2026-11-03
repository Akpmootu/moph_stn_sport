// New tables are additive. Run setupGoogleStorage once after uploading this version.
const TEAM_COLORS=[
 {id:'red',name:'สีแดง',agency:'สสจ.สตูล, สสอ.เมือง',color:'#dc3545'},
 {id:'purple',name:'สีม่วง',agency:'รพ.สตูล',color:'#8b5cf6'},
 {id:'pink',name:'สีชมพู',agency:'รพ.ควนโดน, สสอ.ควนโดน',color:'#ec4899'},
 {id:'yellow',name:'สีเหลือง',agency:'รพ.ท่าแพ, สสอ.ท่าแพ',color:'#eab308'},
 {id:'sky',name:'สีฟ้า',agency:'รพ.ทุ่งหว้า, สสอ.ทุ่งหว้า',color:'#38bdf8'},
 {id:'green',name:'สีเขียว',agency:'รพ.มะนัง, สสอ.มะนัง',color:'#22c55e'},
 {id:'orange',name:'สีส้ม',agency:'รพ.ละงู, สสอ.ละงู',color:'#f97316'},
 {id:'blue',name:'สีน้ำเงิน',agency:'รพ.ควนกาหลง, สสอ.ควนกาหลง',color:'#2563eb'}
];
let lineActor_=null;
function lineUser_(){return rows_('Users').find(u=>u.id===lineActor_)}
function requireOwner_(){
 if(lineActor_){const user=lineUser_();if(!user||user.status!=='active'||user.role!=='owner')throw new Error('เฉพาะเจ้าของเว็บไซต์เท่านั้น');}
 else requireAdmin_();
}
function upsert_(name,key,obj){
 const index=rows_(name).findIndex(row=>row[key]===obj[key]);
 if(index<0)return append_(name,obj);
 const row=TABLES[name].map(k=>{const v=obj[k]??'';return typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v});
 const range=db_().getSheetByName(name).getRange(index+2,1,1,row.length);range.setNumberFormat('@');range.setValues([row]);
}
function audit_(action,target){append_('AuditLog',{id:Utilities.getUuid(),actor:lineActor_||OWNER_EMAIL,action,target,created:new Date().toISOString()})}
function publicEvents_(){
 const sheet=db_().getSheetByName('Events');
 if(sheet&&sheet.getLastRow()>1)return rows_('Events');
 return rows_('Sports').flatMap(s=>JSON.parse(s.dates).map(([m,d])=>({eventKey:`${s.id}-${m}-${d}`,sport:s.id,startsAt:`2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T13:00:00+07:00`,venue:'รอประกาศสถานที่',status:'scheduled',label:s.name})));
}
function contacts_(contacts){
 if(!Array.isArray(contacts)||contacts.length<1||contacts.length>10)throw new Error('กรุณาระบุผู้รับผิดชอบ 1–10 คน');
 return contacts.map(contact=>{const name=text_(contact.name,100),phone=text_(contact.phone,15);if(!/^[0-9+\- ]{9,15}$/.test(phone)||phone.replace(/\D/g,'').length<9)throw new Error('เบอร์โทรไม่ถูกต้อง');return {name,phone}});
}
function registerCoordinator(data){
 if(!data||data.consent!==true)throw new Error('กรุณายืนยันข้อมูลและยินยอมให้เก็บข้อมูลเพื่อประสานงาน');
 const team=text_(data.team,20),sport=text_(data.sport,30),requestId=text_(data.requestId,80);
 if(!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId)||!TEAM_COLORS.some(t=>t.id===team)||!rows_('Sports').some(s=>s.id===sport))throw new Error('ทีม กีฬา หรือรหัสคำขอไม่ถูกต้อง');
 const contacts=JSON.stringify(contacts_(data.contacts));
 return locked_(()=>{
  const previous=rows_('CoordinatorLog').find(r=>r.requestId===requestId);
  if(previous){if(previous.team!==team||previous.sport!==sport||previous.contacts!==contacts)throw new Error('รหัสคำขอถูกใช้แล้ว');return {id:previous.id,team,sport,contacts:JSON.parse(contacts),created:previous.created};}
  const occupied=coordinatorAssignments_().find(row=>row.team===team&&row.sport===sport);
  if(occupied)throw new Error('รายการนี้ลงทะเบียนแล้ว กรุณาประสานงานกับ '+occupied.names.join(', '));
  const record={id:Utilities.getUuid(),requestId,team,sport,contacts,created:new Date().toISOString(),action:'create',actor:'public'};
  append_('CoordinatorLog',record);return {...record,contacts:JSON.parse(contacts)};
 });
}
function signedRequest_(envelope){
 const secret=PropertiesService.getScriptProperties().getProperty('GOOGLE_BRIDGE_SECRET');
 if(!secret||secret.length<32||typeof envelope.payload!=='string'||typeof envelope.signature!=='string')throw new Error('การเชื่อมต่อผู้จัดการยังไม่พร้อม');
 const expected=Utilities.base64Encode(Utilities.computeHmacSha256Signature(envelope.payload,secret));
 let difference=expected.length^envelope.signature.length;for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^(envelope.signature.charCodeAt(i)||0);
 if(difference)throw new Error('Invalid signature');
 const request=JSON.parse(envelope.payload);
 if(typeof request.actor!=='string'||!request.actor||request.actor.length>100||typeof request.nonce!=='string'||!/^[a-f0-9]{48}$/.test(request.nonce)||!Number.isFinite(request.timestamp)||Math.abs(Date.now()-request.timestamp)>300000||!Array.isArray(request.args)||request.args.length>1)throw new Error('Expired or invalid request');
 locked_(()=>{const cache=CacheService.getScriptCache(),key='nonce:'+request.nonce;if(cache.get(key))throw new Error('Request replayed');cache.put(key,'1',600)});
 lineActor_=request.actor;
 try{
  if(request.method==='loginLineUser')return loginLineUser_(request.args[0]);
  if(request.method==='getLineUser')return lineUser_()||null;
  requireAdmin_();
  const methods={getManagementData,saveScore,publishNews,saveEvent,saveSport,updateNews,updateLineUser,updateCoordinator};
  if(!Object.prototype.hasOwnProperty.call(methods,request.method))throw new Error('Unsupported management operation');
  const result=methods[request.method](...request.args);
  if(request.method!=='getManagementData')locked_(()=>audit_(request.method,String(request.args[0]?.id||request.args[0]?.eventKey||'content')));
  return result;
 }finally{lineActor_=null}
}
function loginLineUser_(data){
 if(!data||data.id!==lineActor_)throw new Error('Identity mismatch');
 return locked_(()=>{
  const existing=lineUser_(),now=new Date().toISOString();
  const user={id:lineActor_,lineName:text_(data.name,120),picture:text_(data.picture,1000,false),role:existing?.role||'viewer',status:existing?.status||'pending',created:existing?.created||now,updated:now};
  upsert_('Users','id',user);return user;
 });
}
function getManagementData(){requireAdmin_();const user=lineActor_?lineUser_():{role:'owner',status:'active'};return {user,events:publicEvents_(),sports:rows_('Sports'),coordinators:rows_('CoordinatorLog'),users:user.role==='owner'?rows_('Users'):[],audit:user.role==='owner'?rows_('AuditLog').slice(-100).reverse():[]}}
function updateLineUser(data){
 requireOwner_();
 if(!data||!['owner','manager','viewer'].includes(data.role)||!['pending','active','disabled'].includes(data.status)||data.id===lineActor_)throw new Error('สิทธิ์ไม่ถูกต้อง หรือกำลังแก้บัญชีตัวเอง');
 return locked_(()=>{const user=rows_('Users').find(u=>u.id===data.id);if(!user)throw new Error('ไม่พบผู้ใช้');upsert_('Users','id',{...user,role:data.role,status:data.status,updated:new Date().toISOString()});return {ok:true}});
}
function saveEvent(data){
 requireAdmin_();const obj={eventKey:text_(data.eventKey,80),sport:text_(data.sport,30),startsAt:text_(data.startsAt,40),venue:text_(data.venue,200,false),status:text_(data.status,20),label:text_(data.label,120)};
 if(!rows_('Sports').some(s=>s.id===obj.sport)||!['scheduled','live','final','postponed','cancelled'].includes(obj.status)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(obj.startsAt)||!Number.isFinite(Date.parse(obj.startsAt))||!/^[a-zA-Z0-9_-]+$/.test(obj.eventKey))throw new Error('วันเวลา สถานะ หรือกีฬาไม่ถูกต้อง');
 return locked_(()=>{upsert_('Events','eventKey',obj);return {ok:true}});
}
function saveSport(data){requireAdmin_();const sport=rows_('Sports').find(s=>s.id===data.id);if(!sport)throw new Error('ไม่พบกีฬา');return locked_(()=>{upsert_('Sports','id',{...sport,name:text_(data.name,100),short:text_(data.short,40)});return {ok:true}})}
function updateCoordinator(data){
 requireAdmin_();const contacts=JSON.stringify(contacts_(data.contacts));
 return locked_(()=>{const original=rows_('CoordinatorLog').filter(r=>r.id===data.id).pop();if(!original)throw new Error('ไม่พบรายการลงทะเบียน');append_('CoordinatorLog',{...original,requestId:Utilities.getUuid(),contacts,created:new Date().toISOString(),action:'update',actor:lineActor_||OWNER_EMAIL});return {ok:true}});
}

function updateNews(data){
 requireAdmin_();const original=rows_('News').find(n=>n.id===data.id);if(!original)throw new Error('ไม่พบข่าว');
 const type=text_(data.type,40);if(!['ข่าว','ประกาศ','รายงานกิจกรรม'].includes(type))throw new Error('หมวดข่าวไม่ถูกต้อง');
 const obj={...original,title:text_(data.title,200),body:text_(data.body,10000),type};
 return locked_(()=>{upsert_('News','id',obj);return {ok:true}});
}

function coordinatorAssignments_(){
 const latest=new Map();
 rows_('CoordinatorLog').forEach(row=>latest.set(row.id,row));
 const assignments=new Map();
 latest.forEach(row=>{
  const key=row.team+':'+row.sport;
  let names=[];try{names=JSON.parse(row.contacts).map(contact=>String(contact.name))}catch{}
  if(!assignments.has(key))assignments.set(key,{team:row.team,sport:row.sport,names:[]});
  const entry=assignments.get(key);
  entry.names=[...new Set(entry.names.concat(names))];
 });
 return [...assignments.values()];
}
