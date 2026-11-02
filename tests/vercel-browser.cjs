const {chromium}=require('playwright');const fs=require('node:fs');const vm=require('node:vm');const http=require('node:http');const assert=require('node:assert/strict');const handler=require('../api/google');
(async()=>{
 const data=vm.runInNewContext(fs.readFileSync('apps-script/Seed.gs','utf8')+';({sports:SEED_SPORTS,articles:SEED_NEWS,scores:[],isAdmin:false})');
 const originalFetch=global.fetch;const originalEndpoint=process.env.GOOGLE_APPS_SCRIPT_URL;process.env.GOOGLE_APPS_SCRIPT_URL='https://script.google.com/macros/s/testdeployment/exec';let failRegistration=false,failPublic=false;
 global.fetch=async(url,options)=>{
   const body=JSON.parse(options.body);
   if(body.method==='getPublicData'){if(failPublic)throw Error('unavailable');return {ok:true,json:async()=>({ok:true,data})}}
   if(body.method==='registerParticipant')return {ok:true,json:async()=>failRegistration?{ok:false,error:'ลองใหม่ภายหลัง'}:{ok:true,data:{id:'vercel-reg-123'}}};
   throw Error('unexpected operation');
 };
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/api/google'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);req.body=JSON.parse(Buffer.concat(chunks).toString());
   res.status=n=>{res.statusCode=n;return res};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};return handler(req,res);
  }
  const file=req.url.startsWith('/assets/')?'public'+req.url:'public/index.html';res.setHeader('Content-Type',file.endsWith('.webp')?'image/webp':'text/html; charset=utf-8');res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/moph_stn_sport');await page.waitForFunction(()=>document.querySelectorAll('.sportcard').length===7);assert.ok(await page.locator('#connectionStatus').isHidden());assert.ok(await page.locator('[data-route="admin"]').first().isHidden());
  await page.locator('[data-route="register"]').first().click();
  async function fill(){await page.selectOption('#regSport','futsal');await page.selectOption('#regType','ทีม');await page.fill('#regAgency','สสจ.');await page.fill('#regName','ผู้สมัคร');await page.fill('#regPhone','0812345678');await page.check('#regConsent')}
  await fill();await page.locator('#registrationForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('vercel-reg-123'));assert.equal(await page.inputValue('#regName'),'');
  failRegistration=true;await fill();await page.locator('#registrationForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('ลองใหม่'));assert.equal(await page.inputValue('#regName'),'ผู้สมัคร');
  failPublic=true;await page.goto(base);await page.waitForFunction(()=>document.querySelector('#connectionStatus').textContent.includes('เชื่อมต่อ Google ไม่สำเร็จ'));assert.ok(await page.locator('#registrationForm [type="submit"]').isDisabled());assert.deepEqual(errors,[]);
  console.log('Vercel browser smoke passed: public data, alias path, registration success/failure, missing Google service status (mock upstream)');
 }finally{if(browser)await browser.close();server.close();global.fetch=originalFetch;if(originalEndpoint===undefined)delete process.env.GOOGLE_APPS_SCRIPT_URL;else process.env.GOOGLE_APPS_SCRIPT_URL=originalEndpoint}
})().catch(e=>{console.error(e);process.exitCode=1});
