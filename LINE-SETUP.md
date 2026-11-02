# LINE Login และผู้จัดการเว็บไซต์

## สถานะและขอบเขต

โค้ดรองรับ LINE Login, หน้าผู้จัดการ, การอนุมัติ/ปิดสิทธิ์ผู้ใช้, โปรแกรมแข่งขัน, คะแนน, ข่าวพร้อมภาพ/แก้ไขข่าวเดิม และประวัติผู้รับผิดชอบแล้ว แต่ **ยังไม่ได้สร้าง LINE Channel หรือทดสอบกับบัญชี LINE จริง** เจ้าของต้องสร้าง Channel และตั้งค่าใน Google/Vercel ก่อน ระบบจะปฏิเสธการเข้าจัดการหากยังตั้งค่าไม่ครบ ไม่มีบัญชีทดลองหรือรหัสผ่านสำรองที่ข้ามสิทธิ์ได้

เว็บหลัก: https://mophstnsport.vercel.app

เพื่ออัปเกรดโดยไม่ทำให้การสมัครเดิมหยุดทำงาน หน้าเว็บจะใช้แบบฟอร์มเดิมเมื่อ Backend ยังไม่ส่ง `teams` และเปลี่ยนเป็นแบบฟอร์มผู้รับผิดชอบเมื่ออัปเดต Google Backend สำเร็จแล้ว Countdown ยังทำงานจากกำหนดการเดิมได้ระหว่างนี้

## 1. อัปเดต Google Apps Script โดยไม่ลบข้อมูลเดิม

ในโปรเจกต์เดิม:

- อัปเดต `Code.gs`, `Index.html` และเพิ่ม Script ชื่อ **Management** จาก `apps-script/Management.gs`
- เพิ่ม HTML ชื่อ **Features** จาก `apps-script/Features.html`
- คง `Seed.gs` และ `appsscript.json` เดิม หรือซิงก์ทุกไฟล์ผ่าน clasp ตาม README
- เรียก **setupGoogleStorage** ด้วย `dh.satun@gmail.com` หนึ่งครั้งเพื่อเพิ่มตาราง `Events`, `Users`, `CoordinatorLog`, `AuditLog` ไม่ลบข้อมูลเดิม ไม่เปลี่ยนหัวคอลัมน์ของตารางเก่า
- ตาราง Events เติมจากกำหนดการต้นฉบับ พ.ย.–ธ.ค. 2569 เวลา 13:00 ประเทศไทย ครั้งแรกเท่านั้น ไม่เปลี่ยนปีอัตโนมัติ หากเปลี่ยนกำหนดให้แก้จากหน้าผู้จัดการหลังตั้งค่า LINE เสร็จ
- Project Settings → Script Properties → เพิ่ม **GOOGLE_BRIDGE_SECRET** เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร (แนะนำสุ่ม 32 bytes หรือมากกว่า) เก็บค่าเดียวกันไว้ตั้งใน Vercel ห้ามใส่ในโค้ดหรือส่งแชต
- Deploy → Manage deployments → Edit deployment เดิม → New version → Deploy โดยยัง Execute as Me และ Anyone

ก่อนอัปเดตควรสำรอง Spreadsheet ปัจจุบัน การรัน setup ซ้ำคงข้อมูลเดิมไว้ ตาราง Registrations เดิมยังคงอยู่ แบบฟอร์มใหม่จะเขียนลง CoordinatorLog แทน ไม่แปลงประวัติสมัครแข่งขันเดิมเป็นผู้รับผิดชอบโดยพลการ

## 2. สร้าง LINE Login Channel

1. เข้าสู่ https://developers.line.biz/console/ ด้วย LINE ของเจ้าของ เลือกหรือสร้าง Provider ของผู้จัด
2. Create a new channel → **LINE Login** (ไม่ใช่ Messaging API)
3. ตั้งชื่อ/คำอธิบายช่อง เช่น `Satun Sports 2570` และเลือก App type: **Web app** ระบุอีเมลผู้ติดต่อ นโยบายความเป็นส่วนตัว และเงื่อนไขตามที่ LINE ขอ
4. ในแท็บ LINE Login เปิด Web app และตั้ง **Callback URL** ให้ตรงทุกตัวอักษร:

```text
https://mophstnsport.vercel.app/api/auth/callback
```

5. ใช้ scope **openid profile** เท่านั้น ไม่ต้องขอ email หรือ Messaging API
6. ใน Basic settings คัดลอก Channel ID และ Channel Secret ไปใส่ใน Vercel ตามขั้นตอนถัดไป **ไม่ต้องส่ง Channel Secret ในแชต**
7. ตอน Channel ยัง Developing เฉพาะผู้ที่มีสิทธิ์ใน Channel จะล็อกอินได้ ให้ทดสอบด้วยบัญชีที่เป็นผู้ดูแล/Tester ก่อน เมื่อต้องการให้ผู้จัดการคนอื่นใช้ จึงตั้ง Channel เป็น Published ตามเงื่อนไขของ LINE การ Published Channel ไม่ได้ให้สิทธิ์จัดการเว็บแก่ทุกคน เพราะเว็บยังอนุมัติผู้ใช้แยกต่างหาก

## 3. ตั้ง Vercel Environment Variables

Project → Settings → Environment Variables → ตั้งสำหรับ **Production**:

| ชื่อ | ค่า |
|---|---|
| APP_BASE_URL | `https://mophstnsport.vercel.app` ไม่มี `/` ต่อท้าย |
| LINE_CHANNEL_ID | Channel ID จาก LINE |
| LINE_CHANNEL_SECRET | Channel Secret จาก LINE (เก็บเป็น sensitive) |
| SESSION_SECRET | ค่าสุ่มใหม่อย่างน้อย 32 ตัวอักษร ใช้ลงนาม cookie |
| GOOGLE_BRIDGE_SECRET | ค่าเดียวกับ Script Properties ใน Google (เก็บเป็น sensitive) |
| GOOGLE_APPS_SCRIPT_URL | URL `/exec` ของ deployment เดิม |

ให้ `SESSION_SECRET` และ `GOOGLE_BRIDGE_SECRET` เป็นคนละค่า ตัวอย่างสร้างค่าสุ่มบนเครื่องที่เชื่อถือได้: `openssl rand -hex 32` สร้างแยกสองครั้ง แล้ววางลงช่องตั้งค่าอย่างปลอดภัย ไม่ commit `.env` และไม่ส่งค่าในแชต

Save แล้ว **Redeploy** Vercel จึงมีผล ไม่ใช้ Channel Secret หรือรหัส session ฝังใน HTML หากใช้ Preview ต้องตั้งค่าโดเมนและ callback ของ Preview ให้ตรงด้วย ไม่ควรนำ production cookie ไปใช้หลายโดเมน

## 4. ตั้งเจ้าของเว็บไซต์ครั้งแรก

1. เปิด `https://mophstnsport.vercel.app/#manager` → เข้าสู่ระบบด้วย LINE
2. ครั้งแรกจะขึ้น `viewer / pending` และแสดง LINE User ID ของตัวเอง ระบบเพิ่มแถวใน Sheet **Users** แล้ว แต่ยังแก้เว็บไซต์ไม่ได้
3. เจ้าของ Spreadsheet เปิด Sheet **Users** ตรวจชื่อและ **LINE User ID ของตัวเอง** ให้ตรง แล้วเปลี่ยนเฉพาะคอลัมน์ `role` เป็น `owner` และ `status` เป็น `active` ในแถวนั้น
4. โหลดหน้าเว็บใหม่ เจ้าของจะเห็นหน้าจัดการข้อมูลและจัดการผู้ใช้ นี่เป็นขั้นตอน bootstrap ครั้งเดียว ไม่แต่งตั้งผู้ที่ล็อกอินคนแรกเป็น owner โดยอัตโนมัติ
5. ให้ผู้จัดการคนอื่นล็อกอินจนเกิดรายการ `pending` จากนั้น owner อนุมัติ `manager + active` ผ่านหน้าเว็บ โดยยืนยันตัวบุคคลจาก LINE User ID ไม่ใช่ชื่อโปรไฟล์อย่างเดียว

| Role / Status | สิทธิ์ |
|---|---|
| viewer, pending หรือ disabled | ดูสถานะตัวเอง อ่านเว็บสาธารณะ แก้ข้อมูลไม่ได้ |
| manager + active | จัดการกีฬา รายการแข่ง คะแนน ข่าว/ภาพ และแก้ผู้รับผิดชอบโดยเพิ่ม log ใหม่ |
| owner + active | สิทธิ์ manager พร้อมจัดการบัญชีผู้ใช้และอ่าน audit log |

ห้ามแก้ role/status ตัวเองผ่านหน้าเว็บเพื่อป้องกันปิดสิทธิ์เจ้าของคนสุดท้าย หากทุกบัญชีถูกปิด ให้เจ้าของ Google Sheet กู้คืนแถวที่ถูกต้องด้วยตนเอง การแก้สิทธิ์มีผลต่อคำสั่งจัดการถัดไป แม้ session เดิมยังไม่หมดอายุ

## 5. ตรวจรับกับบริการจริง

- ทดสอบ LINE Login สำเร็จ, ยกเลิกการล็อกอิน, cookie หมดอายุ และ Logout
- บัญชีใหม่ต้อง pending; owner เท่านั้นที่อนุมัติผู้ใช้ได้ ผู้ที่ไม่มีสิทธิ์เรียก `/api/manage` เองต้องถูกปฏิเสธ
- ทดลองปิดบัญชี manager แล้วตรวจว่าคำสั่งถัดไปถูกปฏิเสธ
- แก้วันเวลา/สถานะเป็น live ตรวจ countdown/ผลบนเครื่องอื่นหลังโหลดใหม่ หรือรอรอบอัปเดต 60 วินาที
- เพิ่มคะแนนและข่าวพร้อมรูป ตรวจ Sheets/Drive และ AuditLog
- ลงทะเบียนทีม/กีฬาเดิมสองครั้งแบบตั้งใจ ต้องมีสองเลขอ้างอิงและสอง log; การกด retry ของคำขอเดิมต้องไม่สร้างแถวซ้ำ
- เพิ่มผู้รับผิดชอบมากกว่าหนึ่งคน แล้วดาวน์โหลด PNG/JPG เปิดภาพตรวจชื่อ เบอร์ ทีม กีฬา และมาสคอต
- แก้ผู้รับผิดชอบจากหน้าจัดการ ต้องเพิ่มแถว action=`update` ใน CoordinatorLog โดยคงแถวเดิมไว้

## การออกแบบและข้อจำกัด

- OAuth ใช้ state, nonce, PKCE และตรวจ ID token กับ LINE ฝั่งเซิร์ฟเวอร์ ไม่เก็บ access token/Channel Secret ในเบราว์เซอร์
- Session เป็น cookie `HttpOnly; Secure; SameSite=Lax` อายุ 8 ชั่วโมง ลงนาม HMAC; คำสั่งเขียนตรวจ Origin และสิทธิ์ปัจจุบันจาก Google ทุกครั้ง
- Vercel ลงนามคำสั่งจัดการด้วย HMAC และ Google ตรวจเวลา/nonce ป้องกัน replay ไม่เปิด admin methods ผ่าน public API
- ข้อมูลผู้รับผิดชอบและผู้ใช้ไม่อยู่ใน public data; ผู้ส่งได้รับเฉพาะข้อมูลของใบยืนยันที่เพิ่งส่ง ห้ามแชร์ภาพที่มีเบอร์โทรโดยไม่ตรวจผู้รับ
- CoordinatorLog เก็บ snapshot เต็มทุกรายการ ไม่มีการทับประวัติจากแอป แต่เจ้าของ Google Sheet ยังแก้ไฟล์โดยตรงได้ จึงไม่ใช่ audit log ที่กันการปลอมแปลงโดยเจ้าของระบบ
- ไม่มี CAPTCHA ในแบบฟอร์มสาธารณะ และ CacheService ป้องกัน replay เป็น best effort ภายใต้ quota ของ Google ไม่เหมาะกับการใช้งานปริมาณสูงโดยไม่เพิ่มมาตรการ
- วันที่รายการเดิมเป็นปี 2569 ตามดีไซน์ แม้ชื่อโครงการเป็น 2570 ผู้จัดสามารถเปลี่ยนกำหนดจากหน้าจัดการ ไม่ควรนับถอยหลังเป็นการแข่งขันที่กำลัง live โดยอาศัยเวลาอย่างเดียว
