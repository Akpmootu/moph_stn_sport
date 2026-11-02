const auth=require('../lib/auth.cjs');const {googleCall}=require('../lib/google.cjs');
const allowed=new Set(['getManagementData','saveScore','publishNews','saveEvent','saveSport','updateNews','updateLineUser','updateCoordinator']);
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 try{if(!auth.sameOrigin(req))return res.status(403).json({ok:false,error:'Invalid origin'})}catch{return res.status(503).json({ok:false,error:'ยังไม่ได้ตั้งค่า LINE Login'})}
 const user=auth.session(req);if(!user)return res.status(401).json({ok:false,error:'กรุณาเข้าสู่ระบบ LINE'});
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({ok:false,error:'Invalid JSON'})}
 if(!body||!allowed.has(body.method)||!Array.isArray(body.args)||body.args.length>1||Buffer.byteLength(JSON.stringify(body))>2900000)return res.status(400).json({ok:false,error:'Invalid operation'});
 try{return res.status(200).json({ok:true,data:await googleCall(body.method,body.args,user.sub)})}catch(error){return res.status(403).json({ok:false,error:error.message})}
};
