> **อัปเกรดรุ่น LINE/Countdown/ลงทะเบียนผู้รับผิดชอบ:** อ่าน [LINE-SETUP.md](LINE-SETUP.md) เพิ่มเติม ขั้นตอนด้านล่างคือการติดตั้ง Vercel พื้นฐานก่อนมี LINE

# เปิดใช้งานบน Vercel

โค้ดพร้อม build และทดสอบจำลองแล้ว แต่ **ยังไม่ได้ deploy บน Vercel** เพราะ environment นี้ไม่มีสิทธิ์ Vercel และไม่มีเครื่องมือควบคุมแท็บเบราว์เซอร์ของผู้ใช้ การเห็นลิงก์แท็บไม่ให้สิทธิ์เข้าถึงบัญชี

## 1. อัปเดต Google Apps Script ก่อน

โปรเจกต์ที่ผู้ใช้ระบุ: https://script.google.com/home/projects/15VbP07ucC7rHOz_4VB6QNOGwsPisW8wWt57CYaiYC_oOfBmFTt62YDih/edit

- เปลี่ยนเนื้อหา **Code.gs** เป็นเวอร์ชันล่าสุดใน repo นี้ (เพิ่ม `doPost` สำหรับ Vercel); ไม่ต้องสร้าง Sheet ใหม่ ไม่ต้องเปลี่ยน Script Properties หรือรัน setup ซ้ำ
- Save → Deploy → Manage deployments → เลือก Web app เดิม → Edit → New version → Deploy
- Execute as: **Me (dh.satun@gmail.com)**; Who has access: **Anyone**
- การอัปเดต deployment เดิมคง URL เดิมไว้ หากสร้าง deployment ใหม่ต้องเปลี่ยน URL ใน Vercel ด้วย

Web app ที่ผู้ใช้ส่งมา:

```text
https://script.google.com/macros/s/AKfycbxKtPWBI6PV4iuN2GgJuqQeRbZvdaHPi-_Mf-RV3zDBa1sZD-NDlZ1fJqoJtGfGfYwKQg/exec
```

Spreadsheet ที่ผู้ใช้ส่งมา: https://docs.google.com/spreadsheets/d/1AG7Vm9Cc_m8z7NvQb1epbE9L37YT-dgimmT3Nndc9o0/edit

Backend ใช้ `SPREADSHEET_ID` และ `DRIVE_FOLDER_ID` ที่สร้างไว้ใน Script Properties เดิม กรุณาตรวจว่า SPREADSHEET_ID ตรงกับ Sheet นี้ก่อนใช้งานจริง ไม่ควรคัดลอกทับหรือสร้างข้อมูลใหม่โดยไม่ตรวจสอบ

## 2. Import repo ใน Vercel

1. เข้า https://vercel.com/new ด้วยบัญชี Vercel ที่ต้องการใช้
2. Import GitHub repo **Akpmootu/moph_stn_sport** สาขา **main** (หากไม่พบ ให้ให้สิทธิ์ Vercel GitHub App เข้าถึง repo นี้)
3. ตั้ง Project Name: **moph-stn-sport**; Framework Preset: **Other**; Root Directory: โฟลเดอร์หลัก ไม่เลือก `apps-script`
4. Build command: `npm run build`; Output directory: `public`; Node.js: **24.x**; ไม่ต้องเพิ่ม Install command หรือ Framework
5. เพิ่ม Environment Variable ชื่อ **GOOGLE_APPS_SCRIPT_URL** ค่าเป็น URL `/exec` ด้านบน สำหรับ Production (และ Preview หากต้องการทดสอบ Preview)
6. กด Deploy หลังสำเร็จคัดลอก Production URL จาก Vercel มาใช้ตรวจรับจริง

URL ที่ต้องการใช้: `https://moph-stn-sport.vercel.app` ขึ้นกับว่าชื่อว่างหรือมีเจ้าของอยู่แล้ว **ยังไม่ได้จองหรือยืนยัน URL นี้** ชื่อโฮสต์ไม่รองรับ `_` จึงใช้ `-` และเตรียม path `/moph_stn_sport` ให้เข้าหน้าเดียวกันได้ เช่น `https://<โดเมนจริง>/moph_stn_sport`

ทุก push main หลังเชื่อม repo จะทำให้ Vercel build/deploy อัตโนมัติตามการตั้งค่าโปรเจกต์ เปลี่ยนค่า environment แล้วต้อง Redeploy จึงมีผล

## 3. ตรวจรับ

- เปิดหน้าเว็บจริงแล้วรอข้อความ “กำลังเชื่อมต่อ Google…” หายไป ตรวจว่ามี 7 ประเภทกีฬา และข่าวจาก Google Sheets
- ส่งใบสมัครทดสอบหนึ่งรายการ ตรวจเลขอ้างอิงและแถวใหม่ใน Registrations จากนั้นโหลดเว็บอีกเครื่องเพื่อทดสอบการอ่านผลและข่าว
- อย่าทดสอบด้วยข้อมูลส่วนบุคคลจริงก่อนตรวจรับสำเร็จ ลบข้อมูลทดสอบหลังเสร็จ
- คะแนน ข่าว และภาพที่ผู้ดูแลเพิ่มผ่าน Google ต้องอ่านได้บนเว็บ Vercel หลังโหลดใหม่
- เปิด `/moph_stn_sport` ตรวจว่ารูปและเมนูใช้งานได้
- หากเกิด 502: ตรวจการอัปเดต Code.gs, deployment version, Execute as Me, สิทธิ์ Anyone และ URL ต้องเป็น `/exec` ไม่ใช่หน้า editor หรือ `/dev`
- หากเกิด 503: ตรวจค่า `GOOGLE_APPS_SCRIPT_URL` และ Redeploy Vercel

## การจัดการข้อมูลและความเป็นส่วนตัว

หน้า Vercel เป็นเว็บสาธารณะ อ่านโปรแกรม/ข่าว/คะแนน/ภาพ และส่งใบสมัครได้เท่านั้น ไม่รับคำสั่งจัดการคะแนน ข่าว หรืออ่านรายชื่อผู้สมัครผ่าน `/api/google` แม้ส่ง RPC เอง

ผู้ดูแลใช้ Apps Script URL `/dev` หรือ deployment ส่วนตัวตาม README เดิมเพื่อตรวจบัญชี Google ไม่เพิ่มรหัสผ่านหลังบ้านและไม่ใส่ credential ของ Google ลง Vercel

รูปข่าวใหม่เก็บใน Drive ข้อความและใบสมัครเก็บใน Sheets โลโก้/มาสคอตบน Vercel เป็นไฟล์สำเนาจากดีไซน์ใน repo สำหรับโหลดหน้าเว็บ ส่วนไฟล์ต้นฉบับที่ setup สร้างใน Drive ยังคงอยู่ ไม่มีการย้ายข้อมูลไปฐานข้อมูลอื่น

## ทดสอบก่อน deploy

```sh
npm run check
npm test
npm run build
# ต้องมี Playwright และ Chromium ตาม README
node tests/vercel-browser.cjs
```

การทดสอบจำลองไม่ยืนยันว่า Google deployment ปัจจุบันรองรับ doPost หรือ Vercel account มีสิทธิ์ deploy แล้ว
