const crypto=require('node:crypto');
function config(){const {LINE_CHANNEL_ID,LINE_CHANNEL_SECRET,SESSION_SECRET,APP_BASE_URL}=process.env;if(!LINE_CHANNEL_ID||!LINE_CHANNEL_SECRET||!SESSION_SECRET||SESSION_SECRET.length<32||!APP_BASE_URL||!/^https:\/\/[^/]+$/.test(APP_BASE_URL))throw Error('ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาติดต่อผู้ดูแลเว็บไซต์');return {clientId:LINE_CHANNEL_ID,clientSecret:LINE_CHANNEL_SECRET,secret:SESSION_SECRET,origin:APP_BASE_URL}}
function sign(value){const payload=Buffer.from(JSON.stringify(value)).toString('base64url');return payload+'.'+crypto.createHmac('sha256',config().secret).update(payload).digest('base64url')}
function verify(token){if(typeof token!=='string'||token.length>6000)return null;const [payload,signature,extra]=token.split('.');if(!payload||!signature||extra)return null;const expected=crypto.createHmac('sha256',config().secret).update(payload).digest('base64url');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;try{const value=JSON.parse(Buffer.from(payload,'base64url').toString());return Number.isFinite(value.exp)&&value.exp>Date.now()?value:null}catch{return null}}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(pair=>{const at=pair.indexOf('=');return [pair.slice(0,at).trim(),pair.slice(at+1)]}))}
function cookie(name,value,seconds){return `${name}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`}
function session(req){try{const value=verify(cookies(req).satun_session);return value?.kind==='session'&&typeof value.sub==='string'?value:null}catch{return null}}
function sameOrigin(req){return req.headers.origin===config().origin}
function redirect(res,url){res.statusCode=302;res.setHeader('Location',url);return res.end()}
module.exports={config,sign,verify,cookies,cookie,session,sameOrigin,redirect};
