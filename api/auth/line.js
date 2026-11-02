const crypto=require('node:crypto');const auth=require('../../lib/auth.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{const c=auth.config(),state=crypto.randomBytes(24).toString('hex'),nonce=crypto.randomBytes(24).toString('hex'),verifier=crypto.randomBytes(48).toString('base64url');
 res.setHeader('Set-Cookie',auth.cookie('satun_oauth',auth.sign({kind:'oauth',state,nonce,verifier,exp:Date.now()+600000}),600));
 const params=new URLSearchParams({response_type:'code',client_id:c.clientId,redirect_uri:c.origin+'/api/auth/callback',state,scope:'openid profile',nonce,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
 return auth.redirect(res,'https://access.line.me/oauth2/v2.1/authorize?'+params);
 }catch(error){return res.status(503).json({error:error.message})}
};
