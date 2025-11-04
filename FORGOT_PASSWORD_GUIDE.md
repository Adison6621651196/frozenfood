# 🔐 คู่มือการใช้งานระบบลืมรหัสผ่าน

## 📋 สิ่งที่เพิ่มเข้ามา

### ✅ 1. หน้ารีเซ็ตรหัสผ่าน (Forgot Password)
- URL: `/forgot-password`
- ใช้ **เบอร์โทรศัพท์ + ชื่อผู้ใช้** แทนอีเมล
- ไม่ต้องใช้อีเมลจริง

### ✅ 2. API Backend ใหม่
- `POST /api/users/verify-identity` - ตรวจสอบตัวตนด้วย username + phone
- `PUT /api/users/reset-password` - รีเซ็ตรหัสผ่าน (ไม่ต้องใช้รหัสผ่านเดิม)

### ✅ 3. ลดความเข้มงวดของอีเมล
- อนุญาตให้ใส่อีเมลแบบง่าย ๆ เช่น `myname@mail`
- ไม่ต้องเป็นอีเมลจริง

---

## 🎯 วิธีใช้งาน

### สำหรับผู้ใช้ที่ **ลืมรหัสผ่าน**:

#### ขั้นตอนที่ 1: เข้าหน้า Login
1. ไปที่หน้าเข้าสู่ระบบ (`/login`)
2. คลิกที่ **"ลืมรหัสผ่าน?"**

#### ขั้นตอนที่ 2: ยืนยันตัวตน
1. กรอก **ชื่อผู้ใช้** (Username) ที่ใช้ตอนสมัคร
2. กรอก **เบอร์โทรศัพท์** (10 หลัก) ที่ใช้ตอนสมัคร
3. กด **"ยืนยันตัวตน"**

#### ขั้นตอนที่ 3: ตั้งรหัสผ่านใหม่
1. กรอก **รหัสผ่านใหม่** (อย่างน้อย 6 ตัวอักษร)
2. กรอก **ยืนยันรหัสผ่านใหม่** อีกครั้ง
3. กด **"เปลี่ยนรหัสผ่าน"**
4. ✅ เสร็จแล้ว! กลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่

---

### สำหรับผู้ใช้ที่ **สมัครสมาชิกใหม่**:

#### อีเมลไม่ต้องเป็นจริง:
- เดิม: ต้องใช้อีเมลจริง เช่น `user@gmail.com`
- ใหม่: ใช้อะไรก็ได้ที่มี `@` เช่น:
  - ✅ `myname@mail`
  - ✅ `user123@shop`
  - ✅ `admin@test`
  - ❌ `wrongformat` (ไม่มี @)

#### ข้อมูลที่ต้องกรอก:
- ✅ ชื่อผู้ใช้ (Username)
- ✅ อีเมล (มี @ ก็พอ)
- ✅ รหัสผ่าน (อย่างน้อย 6 ตัว)
- ✅ เบอร์โทรศัพท์ (10 หลัก) **← สำคัญ! ใช้สำหรับรีเซ็ตรหัสผ่าน**
- ✅ ที่อยู่

---

## 🔧 สำหรับ Developer

### ไฟล์ที่สร้างใหม่:
1. `freezefood/src/app/forgot-password/forgot-password.component.ts`
2. `freezefood/src/app/forgot-password/forgot-password.component.html`
3. `freezefood/src/app/forgot-password/forgot-password.component.css`

### ไฟล์ที่แก้ไข:
1. `freezefood/src/app/app.module.ts` - เพิ่ม Component และ Route
2. `freezefood/src/app/login/login.component.ts` - แก้ฟังก์ชัน forgotPassword() และ isValidEmail()
3. `freezefood/src/app/login/login.component.html` - แก้ placeholder และ type
4. `backend/controllers/usersController.js` - เพิ่ม verifyIdentity() และ resetPassword()
5. `backend/routes/api.js` - เพิ่ม Route ใหม่

### API Endpoints:
```
POST /api/users/verify-identity
Body: { username: string, phone: string }
Response: { success: true, user_id: string, username: string }

PUT /api/users/reset-password
Body: { user_id: string, new_password: string }
Response: { success: true, message: string, user_id: string }
```

---

## 🧪 วิธีทดสอบ

### ทดสอบระบบลืมรหัสผ่าน:

1. **สมัครสมาชิกใหม่**:
   ```
   Username: testuser
   Email: test@mail
   Password: 123456
   Phone: 0812345678
   Address: กรุงเทพฯ
   ```

2. **ลืมรหัสผ่าน**:
   - ไปที่ `/forgot-password`
   - กรอก Username: `testuser`
   - กรอก Phone: `0812345678`
   - กด "ยืนยันตัวตน"

3. **ตั้งรหัสผ่านใหม่**:
   - กรอกรหัสผ่านใหม่: `newpass123`
   - ยืนยันรหัสผ่าน: `newpass123`
   - กด "เปลี่ยนรหัสผ่าน"

4. **เข้าสู่ระบบ**:
   - Email: `test@mail`
   - Password: `newpass123`
   - ✅ เข้าสู่ระบบสำเร็จ!

---

## 🎨 UI/UX Features

- ✨ Step Indicator - แสดงขั้นตอนที่ 1 และ 2
- 👁️ Toggle Password Visibility - แสดง/ซ่อนรหัสผ่าน
- ⏳ Loading State - แสดงสถานะกำลังโหลด
- ✅ Success Icon - แสดงเมื่อยืนยันตัวตนสำเร็จ
- 📱 Responsive Design - รองรับทุกขนาดหน้าจอ
- 🔢 Phone Input Validation - จำกัดให้กรอกได้เฉพาะตัวเลข

---

## 🚨 ข้อควรระวัง

1. **เบอร์โทรศัพท์สำคัญมาก!**
   - ต้องกรอกเบอร์โทรตอนสมัคร
   - ใช้เบอร์โทรในการยืนยันตัวตนเมื่อลืมรหัสผ่าน

2. **ความปลอดภัย**:
   - รหัสผ่านถูก hash ด้วย bcrypt (10 rounds)
   - ไม่มีการส่งรหัสผ่านผ่าน URL
   - ต้องยืนยันตัวตนก่อนเปลี่ยนรหัสผ่าน

3. **ข้อจำกัด**:
   - ต้องจำ Username และเบอร์โทรศัพท์
   - ถ้าลืมทั้ง 2 อย่าง ต้องติดต่อ Admin

---

## 📝 คำแนะนำเพิ่มเติม

### สำหรับผู้ใช้:
- 📝 จดบันทึก Username และเบอร์โทรไว้
- 🔒 ตั้งรหัสผ่านที่จำง่าย แต่ปลอดภัย
- 📞 ใช้เบอร์โทรที่ตัวเองเป็นเจ้าของ

### สำหรับ Admin:
- 💾 สำรองข้อมูลผู้ใช้เป็นประจำ
- 🔍 ตรวจสอบ log การรีเซ็ตรหัสผ่าน
- 🛡️ พิจารณาเพิ่ม rate limiting (จำกัดจำนวนครั้ง)

---

## ✨ Feature ที่อาจเพิ่มในอนาคต

1. 📧 ส่ง OTP ผ่าน SMS (ต้องใช้บริการ SMS Gateway)
2. 🔐 Two-Factor Authentication (2FA)
3. 📊 ประวัติการเปลี่ยนรหัสผ่าน
4. ⏰ Expire token หลังจากเวลาที่กำหนด
5. 🚫 Rate limiting - จำกัดจำนวนครั้งที่พยายามรีเซ็ต

---

## 🆘 แก้ปัญหา

### ไม่สามารถยืนยันตัวตนได้:
- ✅ ตรวจสอบว่า Username ถูกต้อง (case-sensitive)
- ✅ ตรวจสอบเบอร์โทรศัพท์ (10 หลัก, ไม่มี -)
- ✅ ตรวจสอบว่ามีข้อมูลในฐานข้อมูลหรือไม่

### ไม่สามารถเปลี่ยนรหัสผ่านได้:
- ✅ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
- ✅ รหัสผ่านทั้ง 2 ช่องต้องตรงกัน
- ✅ ตรวจสอบ backend logs

### Backend ไม่ทำงาน:
```bash
# ตรวจสอบว่า backend รันอยู่หรือไม่
cd backend
npm start

# ตรวจสอบ port
# Backend: http://localhost:3000
# Frontend: http://localhost:4200
```

---

**🎉 ขอให้ใช้งานสนุก!**
