const fs=require('node:fs');const vm=require('node:vm');
for(const file of ['Code.gs','Seed.gs'])new vm.Script(fs.readFileSync('apps-script/'+file,'utf8'),{filename:file});
const html=fs.readFileSync('apps-script/Index.html','utf8');
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script);
JSON.parse(fs.readFileSync('apps-script/appsscript.json','utf8'));
if(html.includes('localStorage'))throw Error('Browser persistence is not allowed');
if(!html.includes('id="articleImage"'))throw Error('Missing image input');
console.log('Apps Script, browser JavaScript and manifest checks passed');
