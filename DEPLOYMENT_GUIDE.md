# 🚀 FreezeFood Deployment Guide - ฟรี 100%

## ภาพรวม
เว็บไซต์นี้จะ deploy ฟรีโดยใช้:
- **Frontend**: Vercel (ฟรีตลอด)
- **Backend**: Render (ฟรีตลอด - มี sleep mode)
- **Database**: Railway MySQL (ฟรี 5GB)

**ค่าใช้จ่ายรวม: 0 บาท!** 🎉

---

## ขั้นตอนที่ 1: Deploy Database (Railway) - 5 นาที

### 1.1 สร้าง MySQL Database
1. ไปที่: https://railway.app/
2. Sign in with GitHub
3. คลิก "New Project"
4. เลือก "Deploy MySQL"
5. รอให้สร้างเสร็จ (~1 นาที)

### 1.2 คัดลอก Database Credentials
1. คลิกที่ MySQL service ที่สร้างไว้
2. ไปที่ Tab "Variables"
3. คัดลอกข้อมูลเหล่านี้:
   - `MYSQLHOST` (เช่น: caboose.proxy.rlwy.net)
   - `MYSQLPORT` (เช่น: 12712)
   - `MYSQLUSER` (มักเป็น root)
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE` (มักเป็น railway)

### 1.3 Import Database
**วิธีที่ 1: ใช้ MySQL Workbench (แนะนำ)**
1. ดาวน์โหลด: https://dev.mysql.com/downloads/workbench/
2. สร้าง Connection ใหม่:
   - Host: [MYSQLHOST จาก Railway]
   - Port: [MYSQLPORT จาก Railway]
   - Username: root
   - Password: [MYSQLPASSWORD จาก Railway]
3. เชื่อมต่อ
4. File → Run SQL Script → เลือก `database_setup.sql`
5. เลือก Default Schema เป็น `railway`
6. Run

**วิธีที่ 2: Command Line**
```bash
cd D:\Front-end-Freeze-food-main
mysql -h [MYSQLHOST] -P [MYSQLPORT] -u root -p railway < database_setup.sql
# ใส่ password เมื่อถูกถาม
```

---

## ขั้นตอนที่ 2: Deploy Backend (Render) - 5 นาที

### 2.1 สร้าง Web Service
1. ไปที่: https://render.com/
2. Sign in with GitHub
3. คลิก "New +" → "Web Service"
4. เชื่อมต่อ Repository: `Adison6621651196/frozenfood`
5. คลิก "Connect"

### 2.2 ตั้งค่า Service
```
Name: freezefood-backend
Region: Singapore (หรือใกล้คุณที่สุด)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node index.js
Instance Type: Free
```

### 2.3 ตั้งค่า Environment Variables
คลิก "Advanced" → เพิ่ม Environment Variables:

```bash
NODE_ENV=production
PORT=3000

# จาก Railway
DB_HOST=[MYSQLHOST จาก Railway]
DB_PORT=[MYSQLPORT จาก Railway]
DB_USER=root
DB_PASSWORD=[MYSQLPASSWORD จาก Railway]
DB_NAME=railway

# รอใส่ทีหลัง (หลัง deploy Frontend)
FRONTEND_URL=http://localhost:4200
```

### 2.4 Deploy
1. คลิก "Create Web Service"
2. รอ 3-5 นาที ให้ build เสร็จ
3. คัดลอก Backend URL ที่ได้ (เช่น: `https://freezefood-backend.onrender.com`)

### 2.5 ทดสอบ Backend
เปิดเบราว์เซอร์ไปที่:
```
https://freezefood-backend.onrender.com/api/products
```
ควรเห็น Array ของสินค้า (หรือ `[]` ถ้ายังไม่มีข้อมูล)

---

## ขั้นตอนที่ 3: Deploy Frontend (Vercel) - 5 นาที

### 3.1 อัพเดท API URL
1. แก้ไขไฟล์: `freezefood/src/environments/environment.prod.ts`
2. เปลี่ยน apiUrl เป็น Backend URL ที่ได้จาก Render:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://freezefood-backend.onrender.com/api'
};
```
3. Commit และ Push:
```bash
git add .
git commit -m "Update production API URL"
git push origin main
```

### 3.2 Deploy บน Vercel
**วิธีที่ 1: ผ่าน Dashboard (ง่ายที่สุด)**
1. ไปที่: https://vercel.com/
2. Sign in with GitHub
3. คลิก "Add New..." → "Project"
4. เลือก Repository: `Adison6621651196/frozenfood`
5. คลิก "Import"
6. ตั้งค่า:
   - Framework Preset: Other
   - Root Directory: `freezefood`
   - Build Command: `npm run build`
   - Output Directory: `dist/freezefood`
7. คลิก "Deploy"
8. รอ 2-3 นาที

**วิธีที่ 2: ผ่าน CLI**
```bash
npm install -g vercel
vercel login
cd D:\Front-end-Freeze-food-main
vercel --prod
```

### 3.3 คัดลอก Frontend URL
หลัง deploy สำเร็จ จะได้ URL เช่น: `https://freezefood.vercel.app`

---

## ขั้นตอนที่ 4: เชื่อมต่อ Frontend กับ Backend

### 4.1 อัพเดท Backend CORS
1. กลับไปที่ Render Dashboard
2. เลือก `freezefood-backend` service
3. ไปที่ "Environment"
4. แก้ไข `FRONTEND_URL`:
```
FRONTEND_URL=https://freezefood.vercel.app
```
(ใส่ URL จริงที่ได้จาก Vercel)
5. คลิก "Save Changes"
6. Render จะ redeploy อัตโนมัติ (รอ 1-2 นาที)

---

## ขั้นตอนที่ 5: ทดสอบระบบ 🎯

### 5.1 เปิดเว็บไซต์
เปิด: `https://freezefood.vercel.app` (URL ของคุณ)

### 5.2 ทดสอบฟีเจอร์
- ✅ หน้าแรกโหลดได้
- ✅ ดูรายการสินค้า
- ✅ สมัครสมาชิก
- ✅ เข้าสู่ระบบ
- ✅ เพิ่มสินค้าในตะกร้า
- ✅ สั่งซื้อสินค้า (PromptPay QR)
- ✅ Admin Panel

---

## 💡 เพิ่มเติม: ป้องกัน Backend Sleep

Render free plan จะทำให้ backend sleep หลัง 15 นาที ไม่ใช้งาน

### ใช้ UptimeRobot (ฟรี)
1. ไปที่: https://uptimerobot.com/
2. Sign up (ฟรี)
3. Add New Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: FreezeFood Backend
   - URL: `https://freezefood-backend.onrender.com/api/products`
   - Monitoring Interval: 5 minutes
4. Save

UptimeRobot จะ ping backend ทุก 5 นาที ทำให้ไม่ sleep!

---

## 📊 สรุปค่าใช้จ่าย

| Service | Plan | ราคา | ข้อจำกัด |
|---------|------|------|----------|
| **Vercel** | Free | ฟรีตลอด | 100GB bandwidth/เดือน |
| **Render** | Free | ฟรีตลอด | Sleep หลัง 15 นาที ไม่ใช้งาน |
| **Railway** | Free | ฟรี 5GB | 500 hours/เดือน |
| **UptimeRobot** | Free | ฟรี 50 monitors | Check ทุก 5 นาที |

**รวมทั้งหมด: 0 บาท ตลอดชีพ!** 🎉

---

## 🔄 Auto Deployment

ทั้ง Vercel และ Render รองรับ Auto Deploy:
- Push code ขึ้น GitHub
- จะ deploy อัตโนมัติทันที!

```bash
git add .
git commit -m "Update something"
git push origin main
# Vercel & Render จะ deploy เอง!
```

---

## 🐛 Troubleshooting

### ปัญหา: Backend ไม่เชื่อมต่อ Database
- เช็ค Environment Variables ใน Render
- เช็ค Database ยังทำงานอยู่ไหมใน Railway
- ดู Logs ใน Render Dashboard

### ปัญหา: Frontend ไม่เชื่อม Backend
- เช็ค CORS settings
- เช็ค `environment.prod.ts` มี API URL ถูกต้องไหม
- เช็ค Console ในเบราว์เซอร์ (F12)

### ปัญหา: Backend Sleep
- ตั้งค่า UptimeRobot ตามด้านบน
- หรือรอ 30-60 วินาทีให้ backend wake up

---

## ✅ Checklist

### Database (Railway)
- [ ] สร้าง MySQL service แล้ว
- [ ] Import database_setup.sql แล้ว
- [ ] เก็บ credentials ไว้

### Backend (Render)
- [ ] Deploy สำเร็จแล้ว
- [ ] ตั้งค่า Environment Variables ครบ
- [ ] ทดสอบ API endpoint แล้ว

### Frontend (Vercel)
- [ ] อัพเดท environment.prod.ts แล้ว
- [ ] Deploy สำเร็จแล้ว
- [ ] ทดสอบเว็บไซต์แล้ว

### เชื่อมต่อ
- [ ] อัพเดท FRONTEND_URL ใน Render แล้ว
- [ ] ทดสอบการเชื่อมต่อทั้งระบบแล้ว
- [ ] ตั้งค่า UptimeRobot แล้ว (optional)

---

**Deploy เสร็จแล้ว! 🎉**

**URLs ของคุณ:**
- Frontend: `https://freezefood.vercel.app`
- Backend: `https://freezefood-backend.onrender.com`
- Database: Railway MySQL (Private)

**เวลาทั้งหมด:** ~15 นาที  
**ค่าใช้จ่าย:** 0 บาท ตลอดชีพ! 💚

---

*สร้างเมื่อ: November 5, 2025*  
*โดย: GitHub Copilot*
