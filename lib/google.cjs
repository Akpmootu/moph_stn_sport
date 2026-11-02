const crypto=require('node:crypto');
function endpoint(){const value=process.env.GOOGLE_APPS_SCRIPT_URL;if(!value||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value))throw Error('ยังไม่ได้ตั้งค่า Google Web app');return value}
async function googleCall(method,args=[],actor){
 let body={method,args};
 if(actor){const secret=process.env.GOOGLE_BRIDGE_SECRET;if(!secret||secret.length<32)throw Error('ยังไม่ได้ตั้งค่า GOOGLE_BRIDGE_SECRET');const payload=JSON.stringify({method,args,actor,timestamp:Date.now(),nonce:crypto.randomBytes(24).toString('hex')});body={payload,signature:crypto.createHmac('sha256',secret).update(payload).digest('base64')};}
 const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'follow',signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Google service unavailable');
 let result;try{result=await response.json()}catch{throw Error('กรุณาอัปเดตและ Deploy Apps Script เวอร์ชันล่าสุด')}
 if(result.ok!==true)throw Error(result.error||'Google ปฏิเสธคำขอ');return result.data;
}
module.exports={googleCall};
