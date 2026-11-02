const {test,afterEach}=require('node:test');
const originalEndpoint=process.env.GOOGLE_APPS_SCRIPT_URL;
afterEach(()=>{if(originalEndpoint===undefined)delete process.env.GOOGLE_APPS_SCRIPT_URL;else process.env.GOOGLE_APPS_SCRIPT_URL=originalEndpoint});
const assert=require('node:assert/strict');const handler=require('../api/google.js');
const ENDPOINT='https://script.google.com/macros/s/deployment123/exec';
function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(data){this.body=data;return this}}}
test('Vercel proxy requires POST, validates payload, denies all admin operations',async()=>{
 let r=response();await handler({method:'GET'},r);assert.equal(r.code,405);
 for(const body of [{method:'getRegistrations',args:[]},{method:'saveScore',args:[{}]},'{bad',{method:'getPublicData',args:'bad'},{method:'registerParticipant',args:[{note:'a'.repeat(13000)}]}]){r=response();await handler({method:'POST',body},r);assert.equal(r.code,400)}
});
test('Vercel reports missing configuration and rejects arbitrary proxy targets',async t=>{
 for(const url of ['', 'https://example.com/exec','https://script.google.com.evil.test/macros/s/123/exec']){process.env.GOOGLE_APPS_SCRIPT_URL=url;const r=response();await handler({method:'POST',body:{method:'getPublicData',args:[]}},r);assert.equal(r.code,503)}
});
test('Vercel forwards public data but strips admin and private fields',async t=>{
 process.env.GOOGLE_APPS_SCRIPT_URL=ENDPOINT;let request;
 t.mock.method(global,'fetch',async(url,options)=>{request={url,options};return {ok:true,json:async()=>({ok:true,data:{sports:[],articles:[],scores:[],isAdmin:true,registrations:[{phone:'private'}]}})}});
 const r=response();await handler({method:'POST',body:{method:'getPublicData',args:[]}},r);
 assert.equal(r.code,200);assert.equal(request.url,ENDPOINT);assert.equal(JSON.parse(request.options.body).method,'getPublicData');assert.equal(r.body.data.isAdmin,false);assert.ok(!('registrations' in r.body.data));assert.equal(r.headers['Cache-Control'],'no-store');
});
test('Vercel preserves registration success and actionable validation errors',async t=>{
 process.env.GOOGLE_APPS_SCRIPT_URL=ENDPOINT;
 t.mock.method(global,'fetch',async()=>({ok:true,json:async()=>({ok:true,data:{id:'reg123'}})}));let r=response();await handler({method:'POST',body:{method:'registerParticipant',args:[{}]}},r);assert.equal(r.body.data.id,'reg123');
 global.fetch=async()=>({ok:true,json:async()=>({ok:false,error:'กรุณาตรวจสอบเบอร์โทร'})});r=response();await handler({method:'POST',body:{method:'registerParticipant',args:[{}]}},r);assert.equal(r.code,400);assert.match(r.body.error,/เบอร์โทร/);
});
test('Vercel handles login HTML, HTTP errors and network failures without leaking details',async t=>{
 process.env.GOOGLE_APPS_SCRIPT_URL=ENDPOINT;
 for(const fn of [async()=>({ok:true,json:async()=>{throw Error('login HTML')}}),async()=>({ok:false}),async()=>{throw Error('private diagnostic')},async()=>({ok:true,json:async()=>({notAnAPI:true})})]){t.mock.method(global,'fetch',fn);const r=response();await handler({method:'POST',body:{method:'getPublicData',args:[]}},r);assert.equal(r.code,502);assert.ok(!JSON.stringify(r.body).includes('private diagnostic'))}
});
