const vm=require('node:vm');const fs=require('node:fs');
function harness(){
  const sheets=new Map(),props=new Map(),files=new Map(),cache=new Map();let email='dh.satun@gmail.com',counter=0;
  function sheet(){const rows=[];return {rows,appendRow:r=>rows.push(r),setFrozenRows:()=>{},getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(r=>[...r])}),getRange:(r,c,h,w)=>({getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),setNumberFormat:()=>{},setValues:values=>values.forEach((row,i)=>{rows[r-1+i]=[...row]})})}}
  const ss={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=sheet();sheets.set(n,s);return s},getId:()=> 'sheet1',getUrl:()=> 'https://docs.google.com/spreadsheets/d/sheet1'};
  function file(blob){const id='file'+ ++counter;const f={getId:()=>id,getName:()=>blob.name,getBlob:()=>blob,moveTo:()=>{},setTrashed:()=>files.delete(id)};files.set(id,f);return f}
  const folder={getId:()=> 'folder1',createFile:file};
  const context={ContentService:{MimeType:{JSON:'application/json'},createTextOutput:value=>({value,setMimeType(){return this}})},console:{log:()=>{}},Session:{getActiveUser:()=>({getEmail:()=>email})},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},SpreadsheetApp:{create:()=>ss,openById:()=>ss},DriveApp:{createFolder:()=>folder,getFolderById:()=>folder,getFileById:id=>files.get(id)||{moveTo:()=>{}}},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},Utilities:{getUuid:()=> 'uuid'+ ++counter,base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:b=>Buffer.from(b).toString('base64'),base64EncodeWebSafe:b=>Buffer.from(String(b)).toString('base64url'),computeHmacSha256Signature:(payload,secret)=>[...require('node:crypto').createHmac('sha256',secret).update(payload).digest()],computeDigest:(_,s)=>s,DigestAlgorithm:{SHA_256:'SHA_256'},newBlob:(bytes,mime,name)=>({name,getBytes:()=>bytes,getContentType:()=>mime})}};
  vm.createContext(context);for(const f of ['Seed.gs','Code.gs','Management.gs'])vm.runInContext(fs.readFileSync('apps-script/'+f,'utf8'),context);
  return {api:context,sheets,props,files,as:e=>email=e};
}

module.exports={harness};
