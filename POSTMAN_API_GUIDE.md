คู่มือการใช้งาน API ทั้งหมดของระบบ Frozen Food พร้อมตัวอย่างคำสั่งสำหรับ Postman

**Base URL:** `http://localhost:3000/api`

## 📦 Products API (สินค้า)
### 1. GET - ดึงสินค้าทั้งหมด
```
GET http://localhost:3000/api/products
```
### 2. GET - ดึงสินค้าตาม ID
```
GET http://localhost:3000/api/products/P001
```

### 3. POST - เพิ่มสินค้าใหม่
```
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "product_id": "P034",
  "product_name": "แมงกระพรุนหัวกระสุน", 
  "category_id": "C001", 
  "price": 100.00,
  "quantity": 100,
  "product_image": "image/034.jpeg"
}
```

### 4. PUT - แก้ไขสินค้า
```
PUT http://localhost:3000/api/products/P001
Content-Type: application/json

{
  "product_name": "ปลาดอลลี่พรีเมี่ยม",
  "category_id": "C001",
  "price": 150.00,
  "quantity": 100,
  "product_image": "image/01.jpeg"
}
```

### 5. DELETE - ลบสินค้า
```
DELETE http://localhost:3000/api/products/P001
```

### 6. PUT - ลดจำนวนสินค้า (เมื่อมีการสั่งซื้อ)
```
PUT http://localhost:3000/api/products/decrease-quantity
Content-Type: application/json

{
  "product_id": "P001",
  "quantity": 5
}
```

### 7. PUT - เพิ่มจำนวนสินค้า (เมื่อยกเลิกคำสั่งซื้อ)
```
PUT http://localhost:3000/api/products/increase-quantity
Content-Type: application/json

{
  "product_id": "P001",
  "quantity": 5
}
```


## 🛒 Orders API (คำสั่งซื้อ)
### 1. GET - ดึงคำสั่งซื้อทั้งหมด (พร้อมข้อมูลผู้ใช้)
```
GET http://localhost:3000/api/orders
```

### 2. GET - ดึงคำสั่งซื้อตาม ID (พร้อมรายการสินค้า)
```
GET http://localhost:3000/api/orders/O61988568
```

### 4. GET - ติดตามสถานะคำสั่งซื้อ (ด้วยเบอร์โทรและเลขออเดอร์)
```
GET http://localhost:3000/api/orders/track?phone=0622762139&orderId=O61988568
```

### 5. POST - สร้างคำสั่งซื้อใหม่
```
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "user_id": "U001",
  "customer_name": "admin",
  "payment_method": "qr",
  "delivery_address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
  "items": [
    {
      "product_id": "P001",
      "quantity": 2,
      "price": 1.00
    },
    {
      "product_id": "P002",
      "quantity": 1,
      "price": 100.00
    }
  ]
}
```

### 6. PUT - แก้ไขคำสั่งซื้อ
```
PUT http://localhost:3000/api/orders/O61988568
Content-Type: application/json

{
  "status": "preparing",
  "delivery_address": "456 ถนนพระราม 9 กรุงเทพฯ 10320"
}
```

### 7. PUT - อัปเดตสถานะการชำระเงิน
```
PUT http://localhost:3000/api/orders/O61988568/payment-status
Content-Type: application/json

{
  "payment_status": "paid"
}
```

### 8. PUT - อัปเดตสถานะคำสั่งซื้อ
```
PUT http://localhost:3000/api/orders/O61988568/status
Content-Type: application/json

{
  "status": "delivered"
}
```

**ค่าที่เป็นไปได้:**
- `pending` - รอดำเนินการ
- `preparing` - กำลังเตรียมสินค้า
- `delivered` - จัดส่งแล้ว
- `cancelled` - ยกเลิก

### 9. PUT - อัปเดตที่อยู่จัดส่ง
```
PUT http://localhost:3000/api/orders/O61988568/delivery-address
Content-Type: application/json

{
  "delivery_address": "789 ถนนลาดพร้าว กรุงเทพฯ 10230"
}
```

### 10. PUT - คำนวณและอัปเดตราคารวมอัตโนมัติ
```
PUT http://localhost:3000/api/orders/O61988568/update-total
```

**หมายเหตุ:** ระบบจะคำนวณจาก OrderItems ทั้งหมด

### 11. PUT - ยกเลิกคำสั่งซื้อ (โดย User)
```
PUT http://localhost:3000/api/orders/O61988568/cancel
```

### 12. PUT - Sync ที่อยู่จากตาราง Users
```
PUT http://localhost:3000/api/orders/sync-addresses
```

### 13. DELETE - ลบคำสั่งซื้อ
```
DELETE http://localhost:3000/api/orders/O61988568
```

## 📋 Order Items API (รายการสินค้าในคำสั่งซื้อ)
### 1. GET - ดึงรายการสินค้าทั้งหมด
```
GET http://localhost:3000/api/order-items
```

### 2. GET - ดึงรายการสินค้าตาม ID
```
GET http://localhost:3000/api/order-items/OT17608096005802579
```

### 3. GET - ดึงรายการสินค้าตาม Order ID
```
GET http://localhost:3000/api/order-items/order/O61988568
```

### 4. POST - เพิ่มรายการสินค้าในคำสั่งซื้อ
```
POST http://localhost:3000/api/order-items
Content-Type: application/json

{
  "order_id": "O61988568",
  "product_id": "P001",
  "quantity": 3,
  "price": 1.00
}
```

**หมายเหตุ:** 
- `orderitem_id` จะถูกสร้างอัตโนมัติ
- `price` ควรส่งมาจาก frontend ตามราคาปัจจุบัน

### 5. PUT - แก้ไขรายการสินค้า
```
PUT http://localhost:3000/api/order-items/OI61988668_0
Content-Type: application/json

{
  "quantity": 5,
  "price": 1.00
}
```

### 6. DELETE - ลบรายการสินค้า
```
DELETE http://localhost:3000/api/order-items/OI61988668_0
```

---

## 📂 Categories API (หมวดหมู่สินค้า)
### 1. GET - ดึงหมวดหมู่ทั้งหมด
```
GET http://localhost:3000/api/categories
```

### 2. GET - ดึงหมวดหมู่ตาม ID
```
GET http://localhost:3000/api/categories/C001
```

### 3. POST - เพิ่มหมวดหมู่ใหม่
```
POST http://localhost:3000/api/categories
Content-Type: application/json

{
  "category_id": "C006",
  "category_name": "ผักแช่แข็ง"
}
```

### 4. PUT - แก้ไขหมวดหมู่
```
PUT http://localhost:3000/api/categories/C001
Content-Type: application/json

{
  "category_name": "อาหารทะเลพรีเมี่ยม"
}
```

### 5. DELETE - ลบหมวดหมู่
```
DELETE http://localhost:3000/api/categories/C006
```

## 👥 Users API (ผู้ใช้งาน)
### 1. GET - ดึงผู้ใช้ทั้งหมด
```
GET http://localhost:3000/api/users
```

### 2. GET - ดึงผู้ใช้ตาม ID
```
GET http://localhost:3000/api/users/U001
```

### 3. GET - ดึงที่อยู่ของผู้ใช้
```
GET http://localhost:3000/api/users/U001/address
```

### 4. POST - เพิ่มผู้ใช้ใหม่
```
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "user_id": "U921",
  "username": "somchai",
  "email": "somchai@gmail.com",
  "password": "123456",
  "role": "user",
  "phone": "0898765432",
  "address": "999 ถนนสาทร กรุงเทพฯ 10120"
}
```

### 5. POST - สมัครสมาชิก (Register)
```
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@gmail.com",
  "password": "123456",
  "phone": "0812345678",
  "address": "123 ถนนสุขุมวิท กรุงเทพฯ"
}
```

**หมายเหตุ:** 
- `user_id` จะถูกสร้างอัตโนมัติ (เช่น U922)
- `role` จะเป็น 'user' โดยอัตโนมัติ

### 6. POST - เข้าสู่ระบบ (Login)
```
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin01"
}
```
**Response ผิดพลาด:**
```json
{
  "message": "Invalid email or password"
}
```

### 7. PUT - แก้ไขข้อมูลผู้ใช้
```
PUT http://localhost:3000/api/users/U001
Content-Type: application/json

{
  "username": "adminnn_updated",
  "email": "admin_new@gmail.com",
  "phone": "0899999999",
  "address": "123 New Address"
}
```

### 8. PUT - อัปเดตที่อยู่ผู้ใช้
```
PUT http://localhost:3000/api/users/U001/address
Content-Type: application/json

{
  "address": "456 ถนนพระราม 4 กรุงเทพฯ 10500"
}
```

### 9. PUT - เปลี่ยนรหัสผ่าน
```
PUT http://localhost:3000/api/users/U001/change-password
Content-Type: application/json

{
  "currentPassword": "admin01",
  "newPassword": "newpassword123"
}
```

**Response สำเร็จ:**
```json
{
  "message": "Password changed successfully",
  "user_id": "U001"
}
```

**Response ผิดพลาด:**
```json
{
  "error": "Current password is incorrect"
}
```


### 10. DELETE - ลบผู้ใช้
```
DELETE http://localhost:3000/api/users/U921
```

## 📦 Stock Items API (สต็อกสินค้า)
### 1. GET - ดึงสต็อกทั้งหมด (พร้อม JOIN กับ Products)
```
GET http://localhost:3000/api/stock-items
```

### 2. GET - ดึงสต็อกตาม ID
```
GET http://localhost:3000/api/stock-items/SI001
```

### 3. GET - ดึงสต็อกตาม Product ID
```
GET http://localhost:3000/api/stock-items/product/P001
```

### 4. GET - ดึงสต็อกที่ใกล้หมดอายุ
```
GET http://localhost:3000/api/stock-items/expiring?days=30
```

### 5. GET - ดึงสรุปสต็อกตามสินค้า
```
GET http://localhost:3000/api/stock-items/summary
```

### 6. POST - เพิ่มสต็อกใหม่
```
POST http://localhost:3000/api/stock-items
Content-Type: application/json

{
  "stockitem_id": "SI034",
  "product_id": "P001",
  "quantity": 100,
  "lot_number": "LOT2510-034",
  "expiry_date": "2026-12-31",
  "storage_location": "F6-S3-L2"
}
```

### 7. PUT - แก้ไขสต็อก
```
PUT http://localhost:3000/api/stock-items/SI001
Content-Type: application/json

{
  "quantity": 150,
  "storage_location": "F2-S1-L1",
  "expiry_date": "2026-07-30"
}
```

### 8. DELETE - ลบสต็อก
```
DELETE http://localhost:3000/api/stock-items/SI034
```

## 📤 Upload API (อัปโหลดไฟล์)

### 1. POST - อัปโหลดหลักฐานการชำระเงิน
```
POST http://localhost:3000/api/upload-payment-proof
Content-Type: multipart/form-data

Body (form-data):
- paymentProof: [เลือกไฟล์รูปภาพ .jpg, .jpeg, .png]
- orderId: O61988568
```

**Response สำเร็จ:**
```json
{
  "message": "Payment proof uploaded successfully",
  "filePath": "uploads\\payment-proofs\\1761006193614-273376326.jpeg"
}
```

**หมายเหตุ:**
- รองรับไฟล์: `.jpg`, `.jpeg`, `.png`
- ไฟล์จะถูกบันทึกใน `uploads/payment-proofs/`
- ชื่อไฟล์จะเป็น `timestamp-randomnumber.ext`
- ระบบจะอัพเดต `payment_proof` ในตาราง Orders อัตโนมัติ

**วิธีทดสอบใน Postman:**
1. เลือก Body → form-data
2. เพิ่ม key: `paymentProof` (type: File) → เลือกไฟล์รูป
3. เพิ่ม key: `orderId` (type: Text) → ใส่ O61988568
4. กด Send

**ดูรูปที่อัปโหลด:**
```
GET http://localhost:3000/uploads/payment-proofs/1761006193614-273376326.jpeg
```

---

## 📝 สถานะต่างๆ ที่ใช้ในระบบ

### Order Status (สถานะคำสั่งซื้อ)
```sql
ENUM: 'pending', 'preparing', 'delivered', 'cancelled'
```
- `pending` - รอดำเนินการ (สถานะเริ่มต้น)
- `preparing` - กำลังเตรียมสินค้า
- `delivered` - จัดส่งสำเร็จแล้ว
- `cancelled` - ยกเลิกคำสั่งซื้อ

### Payment Status (สถานะการชำระเงิน)
```sql
ENUM: 'unpaid', 'paid'
DEFAULT: 'unpaid'
```
- `unpaid` - รอชำระเงิน (สถานะเริ่มต้น)
- `paid` - ชำระเงินแล้ว (จะบันทึก paid_at อัตโนมัติ)

### Payment Method (วิธีการชำระเงิน)
```sql
ENUM: 'qr', 'cod'
```
- `qr` - พร้อมเพย์ QR Code (ต้องอัปโหลดหลักฐาน)
- `cod` - เก็บเงินปลายทาง (Cash on Delivery)

### User Role (บทบาทผู้ใช้)
```sql
ENUM: 'admin', 'user'
DEFAULT: 'user'
```
- `admin` - ผู้ดูแลระบบ (เข้าถึงหน้า Admin Panel)
- `user` - ลูกค้าทั่วไป

---

## 🔧 Tips สำหรับการใช้ Postman

### 1. ตั้งค่า Environment Variables
สร้าง Environment ใน Postman:
- Variable: `baseURL`
- Value: `http://localhost:3000/api`

จากนั้นใช้ในคำสั่ง: `{{baseURL}}/products`

### 2. ตั้งค่า Headers ทั่วไป
```
Content-Type: application/json
Accept: application/json
```

**หมายเหตุ:** สำหรับ Upload ไฟล์ ใช้ `multipart/form-data` แทน

### 3. การ Test Response
เพิ่ม Test Script ใน Postman:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('object');
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

### 4. การบันทึก Collection
1. สร้าง Collection ชื่อ "Frozen Food API"
2. เพิ่ม Folder แยกตาม module:
   - 📦 Products
   - 🛒 Orders
   - 📋 Order Items
   - 📂 Categories
   - 👥 Users
   - 📦 Stock Items
   - 📤 Upload
3. บันทึกแต่ละ request ลงใน folder ที่เหมาะสม

### 5. ตัวอย่าง Pre-request Script (Auto Generate ID)
```javascript
// สำหรับสร้าง Order ID อัตโนมัติ
const timestamp = Date.now();
const orderId = "O" + timestamp.toString().slice(-8);
pm.environment.set("orderId", orderId);

// ใช้ใน Body: {{orderId}}
```

### 6. การใช้ Variables จาก Response
```javascript
// บันทึก order_id จาก response
var jsonData = pm.response.json();
pm.environment.set("lastOrderId", jsonData.order_id);

// ใช้ในคำสั่งถัดไป: {{lastOrderId}}
```

---

## 🐛 Troubleshooting

### ปัญหา: Cannot connect to server
**อาการ:** `Error: connect ECONNREFUSED 127.0.0.1:3000`

**วิธีแก้:**
- ตรวจสอบว่า backend server รันอยู่ที่ port 3000
- เปิด Terminal และรันคำสั่ง:
  ```bash
  cd backend
  npm start
  ```
- ตรวจสอบ console ว่ามีข้อความ "Server running on port 3000"

### ปัญหา: Database connection error
**อาการ:** `Error: connect ECONNREFUSED` หรือ `ER_ACCESS_DENIED_ERROR`

**วิธีแก้:**
- ตรวจสอบ MySQL server รันอยู่หรือไม่ (XAMPP/Docker)
- ตรวจสอบค่าใน `.env` file:
  ```env
  DB_HOST=localhost
  DB_PORT=3307
  DB_USER=root
  DB_PASSWORD=root
  DB_NAME=frozen_food
  ```
- ทดสอบเชื่อมต่อ MySQL ผ่าน phpMyAdmin: `http://localhost/phpmyadmin`

### ปัญหา: 404 Not Found
**อาการ:** `Cannot GET /api/products`

**วิธีแก้:**
- ตรวจสอบ URL ว่าถูกต้อง
- ต้องมี `/api` prefix: `http://localhost:3000/api/products`
- ตรวจสอบว่า routes ใน `api.js` มี endpoint นี้

### ปัญหา: 500 Internal Server Error
**อาการ:** Server Error แต่ไม่แสดงรายละเอียด

**วิธีแก้:**
- ดู console log ของ backend terminal
- ตรวจสอบ database ว่ามี table และข้อมูลครบถ้วน
- ตรวจสอบ Foreign Key Constraints
- ลองรัน SQL file ใหม่:
  ```sql
  SOURCE database_setup.sql;
  ```

### ปัญหา: Foreign Key Constraint Error
**อาการ:** `ER_NO_REFERENCED_ROW_2` หรือ `Cannot add or update child row`

**วิธีแก้:**
- ตรวจสอบว่า `category_id` มีอยู่ในตาราง Categories
- ตรวจสอบว่า `product_id` มีอยู่ในตาราง Products
- ตรวจสอบว่า `user_id` มีอยู่ในตาราง Users
- สร้างข้อมูล master data ก่อน (Categories, Users)

### ปัญหา: Upload ไฟล์ไม่สำเร็จ
**อาการ:** `Error: Unexpected field` หรือ `LIMIT_FILE_SIZE`

**วิธีแก้:**
- ตรวจสอบว่า field name เป็น `paymentProof` (ตรงกับ backend)
- ตรวจสอบประเภทไฟล์: `.jpg`, `.jpeg`, `.png` เท่านั้น
- ตรวจสอบขนาดไฟล์ไม่เกิน 5MB
- ตรวจสอบว่าโฟลเดอร์ `uploads/payment-proofs/` มีอยู่และมีสิทธิ์เขียน

### ปัญหา: รหัสผ่านไม่ถูกต้อง
**อาการ:** Login ไม่ได้แม้ใช้รหัสผ่านถูก

**วิธีแก้:**
- ตรวจสอบข้อมูลในตาราง Users
- รหัสผ่านไม่มีการเข้ารหัส (plain text)
- ใช้ข้อมูลทดสอบ:
  - Email: `admin@gmail.com` 
  - Password: `admin01`

### ปัญหา: CORS Error
**อาการ:** `Access to XMLHttpRequest blocked by CORS policy`

**วิธีแก้:**
- ตรวจสอบว่า backend มี CORS middleware
- ตรวจสอบใน `index.js`:
  ```javascript
  app.use(cors());
  ```

---

## 📚 เอกสารเพิ่มเติม

### URLs สำคัญ
- **Frontend:** `http://localhost:4200`
- **Backend API:** `http://localhost:3000/api`
- **Backend Server:** `http://localhost:3000`
- **phpMyAdmin:** `http://localhost/phpmyadmin` (หรือ port ที่ตั้งค่า)

### Static Files & Media
- **Product Images:** `http://localhost:3000/image/`
  - ตัวอย่าง: `http://localhost:3000/image/01.jpeg`
- **Payment Proofs:** `http://localhost:3000/uploads/`
  - ตัวอย่าง: `http://localhost:3000/uploads/payment-proofs/1761006193614-273376326.jpeg`

### Database Information
- **ชื่อฐานข้อมูล:** `frozen_food`
- **MySQL Port:** `3307` (หรือ 3306 ขึ้นอยู่กับการตั้งค่า)
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_0900_ai_ci`

### Tables ในระบบ
1. **Categories** - หมวดหมู่สินค้า (5 หมวดหมู่)
2. **products** - สินค้า (33 รายการ)
3. **users** - ผู้ใช้งาน (6 users)
4. **Orders** - คำสั่งซื้อ
5. **OrderItems** - รายการสินค้าในคำสั่งซื้อ
6. **StockItem** - สต็อกสินค้า (33 รายการ)

### API Endpoints Summary
```
📦 Products:         7 endpoints
🛒 Orders:          13 endpoints
📋 Order Items:      6 endpoints
📂 Categories:       5 endpoints
👥 Users:           10 endpoints
📦 Stock Items:      8 endpoints
📤 Upload:           1 endpoint
────────────────────────────────
Total:              50 endpoints
```

### ข้อมูลสำคัญ
- **Order ID Format:** O + timestamp 8 หลัก (เช่น O61988568)
- **User ID Format:** U + number (เช่น U001, U919)
- **Product ID Format:** P + number 3 หลัก (เช่น P001)
- **Category ID Format:** C + number 3 หลัก (เช่น C001)
- **Stock ID Format:** SI + number 3 หลัก (เช่น SI001)
- **OrderItem ID Format:** OI + timestamp (เช่น OI61988668_0)

### Environment Variables (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=frozen_food

# Server Configuration
PORT=3000

# Logging
LOG_LEVEL=info
```

### การรัน Project
**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd freezefood
npm install
npm start
# หรือ ng serve
```

**Database (Docker):**
```bash
docker-compose up -d
```
