const auth=require('../../lib/auth.cjs');
module.exports=(req,res)=>{res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).end();try{if(!auth.sameOrigin(req))return res.status(403).end();res.setHeader('Set-Cookie',auth.cookie('satun_session','',0));return res.status(200).json({ok:true})}catch{return res.status(503).json({error:'LINE Login is not configured'})}};
