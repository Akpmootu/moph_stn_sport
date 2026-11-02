// Optional: npm install --no-save --package-lock=false playwright@1.62.1
const {chromium}=require('playwright');const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const http=require('node:http');
(async()=>{
 const seeds=vm.runInNewContext(fs.readFileSync('apps-script/Seed.gs','utf8')+';({sports:SEED_SPORTS,articles:SEED_NEWS})');
 const html=fs.readFileSync('apps-script/Index.html','utf8').replaceAll('assets/logo.webp','data:image/webp;base64,'+fs.readFileSync('assets/logo.webp','base64')).replaceAll('assets/mascot.webp','data:image/webp;base64,'+fs.readFileSync('assets/mascot.webp','base64'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({seeds})=>{
    window.calls=[];window.failRegistration=false;window.backend={...seeds,scores:[],isAdmin:true};
    window.google={script:{get run(){let success,failure;const runner=new Proxy({},{get:(_,key)=>key==='withSuccessHandler'?(fn)=>{success=fn;return runner}:key==='withFailureHandler'?(fn)=>{failure=fn;return runner}:(...args)=>setTimeout(()=>{window.calls.push({method:key,args});try{let result;if(key==='getPublicData')result=window.backend;else if(key==='getRegistrations')result=[];else if(key==='registerParticipant'){if(window.failRegistration)throw Error('Sheets unavailable');result={id:'registration-123'}}else if(key==='saveScore'){window.backend.scores=[args[0]];result={ok:true}}else if(key==='publishNews'){window.backend.articles.unshift({...args[0],id:'news123'});result={id:'news123'}}success(result)}catch(e){failure(e)}},0)});return runner}}};
  },{seeds});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.querySelectorAll('.sportcard').length===7);
  await page.locator('[data-route="register"]').first().click();
  async function fill(){await page.selectOption('#regSport','futsal');await page.selectOption('#regType','ทีม');await page.fill('#regAgency','สสจ.');await page.fill('#regName','ผู้สมัคร');await page.fill('#regPhone','0812345678');await page.check('#regConsent')}
  await fill();await page.locator('#registrationForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('registration-123'));assert.equal(await page.inputValue('#regName'),'');
  await fill();await page.evaluate(()=>window.failRegistration=true);await page.locator('#registrationForm [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Sheets unavailable'));assert.equal(await page.inputValue('#regName'),'ผู้สมัคร');
  await page.locator('[data-route="admin"]').first().click();await page.fill('#scoreTeamA','ทีม A');await page.fill('#scoreTeamB','ทีม B');await page.fill('#scoreA','2');await page.fill('#scoreB','1');await page.locator('#scoreForm [type="submit"]').click();await page.waitForFunction(()=>window.backend.scores.length===1);
  await page.fill('#articleTitle','ข่าวทดสอบ');await page.fill('#articleText','เนื้อหาทดสอบ');await page.selectOption('#articleType','รายงานกิจกรรม');await page.locator('#newsForm [type="submit"]').click();await page.waitForFunction(()=>window.backend.articles[0].title==='ข่าวทดสอบ');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-route="home"]').first().click();assert.ok(await page.locator('.hero-mascot').isVisible());assert.deepEqual(errors,[]);
  console.log('Browser smoke passed: load, registration success/failure, score save, news publish, mobile layout (mock Google RPC)');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
