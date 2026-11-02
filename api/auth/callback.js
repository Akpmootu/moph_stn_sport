const auth=require('../../lib/auth.cjs');const {googleCall}=require('../../lib/google.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();
 try{
  const c=auth.config(),url=new URL(req.url,c.origin),pending=auth.verify(auth.cookies(req).satun_oauth);
  res.setHeader('Set-Cookie',auth.cookie('satun_oauth','',0));
  if(!pending||pending.kind!=='oauth'||url.searchParams.get('state')!==pending.state||!url.searchParams.get('code')||url.searchParams.has('error'))throw Error('LINE Login ถูกยกเลิกหรือหมดเวลา กรุณาลองใหม่');
  const tokenResponse=await fetch('https://api.line.me/oauth2/v2.1/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:c.origin+'/api/auth/callback',client_id:c.clientId,client_secret:c.clientSecret,code_verifier:pending.verifier}),signal:AbortSignal.timeout(12000)});
  const token=await tokenResponse.json();if(!tokenResponse.ok||!token.id_token)throw Error('LINE token exchange failed');
  const verification=await fetch('https://api.line.me/oauth2/v2.1/verify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({id_token:token.id_token,client_id:c.clientId,nonce:pending.nonce}),signal:AbortSignal.timeout(12000)});
  const identity=await verification.json();if(!verification.ok||identity.iss!=='https://access.line.me'||String(identity.aud)!==c.clientId||typeof identity.sub!=='string'||!identity.sub||identity.nonce!==pending.nonce||!Number.isFinite(identity.exp)||identity.exp*1000<=Date.now())throw Error('LINE identity verification failed');
  await googleCall('loginLineUser',[{id:identity.sub,name:String(identity.name||'LINE user').slice(0,120),picture:String(identity.picture||'').slice(0,1000)}],identity.sub);
  res.setHeader('Set-Cookie',[auth.cookie('satun_oauth','',0),auth.cookie('satun_session',auth.sign({kind:'session',sub:identity.sub,exp:Date.now()+8*3600000}),8*3600)]);
  return auth.redirect(res,c.origin+'/#manager');
 }catch{
  return auth.redirect(res,'/?line_login=failed#manager');
 }
};
