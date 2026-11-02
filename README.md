# กีฬา สา’สุข สตูล 2570 — Google Sheets / Google Drive

นำดีไซน์จาก ZIP มาใช้ โดยคงรูปแบบหน้าเว็บเดิม เพิ่ม Google Apps Script เป็น backend รองรับทั้งโฮสต์หน้าเว็บบน Google และ Vercel โดยไม่ต้องใช้ฐานข้อมูลภายนอก

## สถานะ

- ผู้ใช้ส่งลิงก์ Spreadsheet และ Apps Script Web app แล้ว แต่ environment ยังถูกนโยบายเครือข่ายบล็อก Google จึงยังไม่ได้ตรวจรับกับบริการจริง
- เพิ่มหน้าเว็บและ API สำหรับ Vercel แล้ว ดู [ขั้นตอน Vercel](VERCEL-SETUP.md); ยังไม่มีหลักฐานการ deploy Vercel สำเร็จ
- บัญชีเจ้าของ: `dh.satun@gmail.com` ต้องอนุญาต Google ด้วยตนเองครั้งแรก ไม่ต้องส่งรหัสผ่านหรือ token ให้ผู้พัฒนา
- ทดสอบ backend และ browser ด้วย Google จำลองแล้ว การทดสอบกับ Google จริงอยู่ในขั้นตอนด้านล่าง
- ชื่องานเป็น 2570 แต่โปรแกรมต้นฉบับเป็น พ.ย.–ธ.ค. 2569 (2026) คงข้อมูลตามไฟล์ต้นฉบับ ไม่ได้เลื่อนปีโดยพลการ

## ติดตั้งและสร้าง Sheet/Drive อัตโนมัติ

1. เข้าบัญชี `dh.satun@gmail.com` แล้วไป https://script.google.com สร้าง New project ชื่อ `Satun Sports 2570`
2. วางไฟล์ `apps-script/Code.gs` ในไฟล์ Code.gs; สร้างไฟล์ Script ชื่อ Seed และวาง `apps-script/Seed.gs`; สร้างไฟล์ HTML ชื่อ Index แล้ววาง `apps-script/Index.html`
3. ใน Project Settings เปิด “Show appsscript.json manifest file in editor” แล้วใช้เนื้อหาจาก `apps-script/appsscript.json`
4. Save แล้วเลือกฟังก์ชัน **setupGoogleStorage** และกด Run อนุญาตสิทธิ์ Sheets, Drive และอีเมลด้วยบัญชีเจ้าของ ฟังก์ชันนี้สร้างโฟลเดอร์และ Spreadsheet ให้เอง ไม่ต้องสร้างล่วงหน้า
5. ดู Execution log เพื่อรับลิงก์ Spreadsheet และโฟลเดอร์ รูปโลโก้และมาสคอตจะถูกเก็บใน Drive เช่นเดียวกับภาพข่าว ข้อมูลต้นแบบกีฬาและข่าวจะถูกเติมลง Sheets
6. เรียก setupGoogleStorage อีกครั้งได้โดยไม่สร้างทรัพยากรซ้ำหรือทับข้อมูลที่มีอยู่ ห้ามลบ Script Properties เพื่อเริ่มใหม่หากยังต้องการข้อมูลเดิม

Script Properties เก็บ `SPREADSHEET_ID`, `DRIVE_FOLDER_ID`, `ASSET_logo`, `ASSET_mascot` โดยอัตโนมัติ ไม่ใช่รหัสผ่าน ไม่ต้องใส่ในหน้าเว็บ และไม่ควรแชร์ Sheet/โฟลเดอร์เป็นสาธารณะ

## เปิดใช้งานเว็บบน Google

สำหรับ Vercel ให้ใช้ [VERCEL-SETUP.md](VERCEL-SETUP.md) แล้วกลับมาตรวจรับข้อมูลจริง

- Deploy → New deployment → Web app → Execute as: **Me (dh.satun@gmail.com)** → Who has access: **Anyone** สำหรับเว็บไซต์สาธารณะ จากนั้นเปิด URL `/exec`
- การจัดการคะแนน ข่าว รูปภาพ และการอ่านข้อมูลผู้สมัคร ตรวจ `Session.getActiveUser().getEmail()` ฝั่งเซิร์ฟเวอร์ ต้องตรงกับเจ้าของเท่านั้น ไม่อาศัยการซ่อนเมนู
- Google อาจไม่ส่ง active email ให้ Web App สาธารณะ ระบบจะปฏิเสธการจัดการในกรณีนั้น ให้เจ้าของใช้ **Deploy → Test deployments → Web app → URL `/dev`** (เฉพาะผู้มีสิทธิ์แก้ไขสคริปต์) หรือสร้าง deployment แยกที่ Who has access: **Only myself** สำหรับจัดการ ห้ามเปลี่ยนโค้ดให้ข้ามการตรวจบัญชี
- `/dev` ใช้โค้ดล่าสุดที่บันทึก `/exec` ใช้เวอร์ชัน deployment เมื่อต้องเผยแพร่โค้ดใหม่ใช้ Manage deployments → Edit → New version
- อย่าเลือก Execute as “User accessing the web app” สำหรับเว็บสาธารณะ เพราะผู้สมัครไม่ควรต้องมีสิทธิ์เข้าถึง Sheet ของเจ้าของ

## ข้อมูลที่เก็บ

| Sheet | ข้อมูล | สิทธิ์ผ่านเว็บ |
|---|---|---|
| Sports | ประเภทกีฬา สี ไอคอน วันแข่งขัน (dates เป็น JSON เช่น `[[11,17]]`) | อ่านสาธารณะ แก้ไขใน Sheet โดยเจ้าของ |
| News | ข่าว ประกาศ รายงาน และรหัสภาพ Drive | อ่านสาธารณะ เขียนโดยเจ้าของ |
| Scores | คะแนนตาม eventKey | อ่านสาธารณะ เขียนโดยเจ้าของ |
| Registrations | ใบสมัครและข้อมูลติดต่อ | ส่งใบสมัครสาธารณะ อ่านโดยเจ้าของ |
| Media | ดัชนีไฟล์ภาพข่าว | ภายใน backend |

ภาพข่าวรองรับ JPG/PNG/WebP ไม่เกิน 2 MB ตรวจลายเซ็นไฟล์ฝั่งเซิร์ฟเวอร์และให้ดึงได้เฉพาะภาพที่อ้างอิงในข่าวที่เผยแพร่ ไม่ใช้ลิงก์ Drive สาธารณะ ข้อมูลไม่ได้เก็บใน localStorage การส่งสำเร็จแสดงเลขอ้างอิงหลัง Sheets บันทึกจริงเท่านั้น หากส่งล้มเหลวแบบฟอร์มจะยังคงอยู่

การเปลี่ยน Sports/News ใน Sheet จะแสดงหลังโหลดหน้าใหม่ ห้ามเปลี่ยนหัวคอลัมน์ ภาพและข่าวที่เผยแพร่ถือเป็นข้อมูลสาธารณะ ส่วนรายชื่อผู้สมัครไม่ถูกส่งใน getPublicData

## ตรวจรับบน Google จริงหลังอนุญาตสิทธิ์

1. Run setupGoogleStorage สองครั้ง ตรวจว่ามี Spreadsheet และโฟลเดอร์อย่างละหนึ่งชุด
2. เปิดเว็บสาธารณะ ตรวจปฏิทิน ข่าว โลโก้ มาสคอต และส่งใบสมัครทดสอบ ตรวจว่ามีแถวใหม่ใน Registrations และมีเลขอ้างอิง
3. เปิดเว็บด้วยผู้ใช้ทั่วไป/Incognito ตรวจว่าอ่านรายชื่อผู้สมัครหรือแก้คะแนน/ข่าวไม่ได้ แม้เรียก RPC โดยตรง
4. เปิดเว็บสำหรับเจ้าของ บันทึกคะแนน เปิดเว็บสาธารณะใหม่และตรวจคะแนนตรงกัน
5. เพิ่มข่าวพร้อมภาพ ตรวจไฟล์ใหม่ในโฟลเดอร์และแถว Media/News และเปิดอ่านภาพจาก Incognito
6. ใช้ข้อมูลทดสอบในการตรวจรับและลบแถวทดสอบใน Sheet โดยเจ้าของเมื่อเสร็จ

## ทดสอบใน cloud/local

ใช้ checkout เดิม ไม่จำเป็นต้องสร้าง Git worktree ไม่มีแพ็กเกจ runtime ที่ต้องติดตั้งสำหรับ Apps Script

```sh
cd /workspace/moph_stn_sport
npm run check
npm test
```

Browser smoke (Google RPC จำลอง ต้องมี Playwright และ Chromium):

```sh
# หากเครื่องยังไม่มี Playwright
npm install --no-save --package-lock=false playwright@1.62.1
CHROMIUM_PATH=/usr/bin/chromium node tests/browser-smoke.cjs
```

ทดสอบจำลองไม่ยืนยันสิทธิ์ OAuth, quota หรือ deployment ของ Google จริง ห้ามอ้างว่าเชื่อมบัญชีสำเร็จก่อนทำรายการตรวจรับด้านบน

## ขอบเขตและข้อจำกัด

- เหมาะกับงานกีฬาขนาดเล็กตาม quota ของ Apps Script/Sheets; ไม่ใช่ระบบฐานข้อมูล transaction สำหรับผู้ใช้จำนวนมาก
- แบบฟอร์มสาธารณะมี validation และป้องกันการส่งซ้ำหมายเลขโทรศัพท์/กีฬา 5 นาทีแบบ best effort ผ่าน CacheService ยังไม่มี CAPTCHA หรือการยืนยันเบอร์ หากมี spam ต้องเพิ่มการป้องกันก่อนรับจำนวนมาก
- บัญชีผู้ดูแลเดียวตามที่ระบุ ยังไม่มีบทบาทกรรมการรายกีฬา ไม่มีระบบแก้/ลบข่าวผ่าน UI เจ้าของจัดการผ่าน Sheet/Drive ได้
- การอัปโหลด Drive และเขียน Sheet ไม่ใช่ transaction เดียวกัน ควรตรวจรายการ Media ที่ไม่มีข่าวหากเกิด API failure ระหว่างบันทึก
- เจ้าของต้องกำหนดระยะเวลาเก็บข้อมูลผู้สมัครและช่องทางแจ้งลบให้เหมาะสมก่อนเปิดรับสมัครจริง

`DESIGN-README.md` คือเอกสารจาก ZIP ต้นฉบับสำหรับอ้างอิง ส่วนขั้นตอนใช้งานปัจจุบันให้ใช้ README นี้

## ซิงก์โค้ดจาก GitHub ไป Google Apps Script (ทางเลือก)

หากไม่ต้องการวางโค้ดทีละไฟล์ ใช้ Google clasp บนเครื่องของเจ้าของบัญชี:

1. เปิด Apps Script API ใน https://script.google.com/home/usersettings
2. ติดตั้ง `npm install -g @google/clasp` แล้วใช้ `clasp login` ลงชื่อเข้าบัญชีเจ้าของในเบราว์เซอร์
3. คัดลอก `.clasp.json.example` เป็น `.clasp.json` แล้วใส่ Script ID จาก Project Settings ของโปรเจกต์ Google ที่สร้างไว้
4. เรียก `clasp push` จากโฟลเดอร์ repo เพื่อนำไฟล์ใน `apps-script` ขึ้น Google (ตรวจโปรเจกต์ปลายทางก่อนใช้)
5. เปิด Google Apps Script เรียก `setupGoogleStorage` แล้วทำขั้นตอน Deploy/ตรวจรับตามคู่มือด้านบน

ไฟล์ `.clasp.json` และข้อมูลล็อกอินถูก ignore ไม่ commit เข้า GitHub; GitHub Actions ตรวจ syntax และ backend tests เท่านั้น ไม่ deploy Google หรือสร้าง Sheet ให้เอง
