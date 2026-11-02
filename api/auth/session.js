const auth=require('../../lib/auth.cjs');const {googleCall}=require('../../lib/google.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();
 const user=auth.session(req);if(!user)return res.status(200).json({user:null});
 try{return res.status(200).json({user:await googleCall('getLineUser',[],user.sub)})}catch{return res.status(503).json({error:'ตรวจสอบสิทธิ์กับ Google ไม่สำเร็จ'})}
};
