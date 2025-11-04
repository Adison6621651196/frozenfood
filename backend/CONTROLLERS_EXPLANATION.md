# 📚 คำอธิบายไฟล์ Backend ทั้งหมด

## 🎯 โครงสร้าง Backend

```
backend/
├── index.js                    # ไฟล์หลักเริ่มต้น Server
├── routes/
│   └── api.js                  # กำหนดเส้นทาง API ทั้งหมด
├── controllers/               # Logic การทำงานของแต่ละ API
│   ├── categoryController.js
│   ├── orderController.js
│   ├── orderItemController.js
│   ├── productController.js
│   ├── stockitemController.js
│   ├── uploadController.js
│   └── usersController.js
├── config/
│   └── database.js            # การเชื่อมต่อฐานข้อมูล
└── utils/
    └── logger.js              # ระบบ logging
```

---

## 📄 1. backend/index.js - ไฟล์หลักเริ่มต้น Server

### หน้าที่หลัก:
- **เริ่มต้น Express Server** ที่รับ HTTP requests
- **กำหนด CORS** ให้ Frontend (Angular) เรียกใช้ได้
- **ตั้งค่า Middleware** สำหรับ JSON parsing
- **เปิดให้เข้าถึงไฟล์ Static** (รูปภาพสินค้า, หลักฐานการชำระเงิน)
- **เชื่อมต่อ API Routes** จากไฟล์ api.js
- **รัน Server** บน Port 3000 หรือ 3001

### สิ่งสำคัญ:
```javascript
// อนุญาตให้ Frontend ที่ localhost:4200 เรียกใช้ได้
app.use(cors({ origin: 'http://localhost:4200' }));

// เปิดให้เข้าถึงรูปภาพสินค้า
app.use('/image', express.static('image'));

// เชื่อมต่อทุก API routes
app.use('/api', productRoutes);

// รัน Server
app.listen(PORT);
```

---

## 📄 2. backend/routes/api.js - กำหนดเส้นทาง API

### หน้าที่หลัก:
- **Import ฟังก์ชัน** จาก Controllers ทั้งหมด
- **กำหนด Route** (URL Path) สำหรับแต่ละ API
- **เชื่อมต่อ HTTP Methods** (GET, POST, PUT, DELETE) กับฟังก์ชัน

### โครงสร้าง API:

#### 🛒 Products (สินค้า)
- `GET    /api/products` - ดึงสินค้าทั้งหมด
- `GET    /api/products/:id` - ดึงสินค้าตาม ID
- `POST   /api/products` - สร้างสินค้าใหม่
- `PUT    /api/products/:id` - แก้ไขสินค้า
- `DELETE /api/products/:id` - ลบสินค้า
- `PUT    /api/products/decrease-quantity` - ลดจำนวนสินค้า
- `PUT    /api/products/increase-quantity` - เพิ่มจำนวนสินค้า

#### 📦 Orders (ออเดอร์)
- `GET    /api/orders` - ดึงออเดอร์ทั้งหมด
- `GET    /api/orders/:id` - ดึงออเดอร์ตาม ID
- `GET    /api/orders/track` - ติดตามออเดอร์ด้วยเบอร์โทร
- `GET    /api/orders/user/:userId` - ดึงออเดอร์ของผู้ใช้
- `POST   /api/orders` - สร้างออเดอร์ใหม่
- `PUT    /api/orders/:id` - แก้ไขออเดอร์
- `PUT    /api/orders/:id/payment-status` - อัปเดตสถานะชำระเงิน
- `PUT    /api/orders/:id/status` - อัปเดตสถานะออเดอร์
- `DELETE /api/orders/:id` - ลบออเดอร์

#### 📋 Categories (หมวดหมู่)
- `GET    /api/categories` - ดึงหมวดหมู่ทั้งหมด
- `POST   /api/categories` - สร้างหมวดหมู่ใหม่
- `PUT    /api/categories/:id` - แก้ไขหมวดหมู่
- `DELETE /api/categories/:id` - ลบหมวดหมู่

#### 👥 Users (ผู้ใช้)
- `GET    /api/users` - ดึงผู้ใช้ทั้งหมด
- `GET    /api/users/:id` - ดึงผู้ใช้ตาม ID
- `POST   /api/users/register` - สมัครสมาชิก
- `POST   /api/users/login` - เข้าสู่ระบบ
- `PUT    /api/users/:id` - แก้ไขข้อมูลผู้ใช้
- `PUT    /api/users/:id/change-password` - เปลี่ยนรหัสผ่าน
- `DELETE /api/users/:id` - ลบผู้ใช้

---

## 📁 3. Controllers - Logic การทำงาน

### 📄 3.1 categoryController.js - จัดการหมวดหมู่สินค้า

**ตาราง:** `Categories`

**คอลัมน์:**
- `category_id` - รหัสหมวดหมู่ (Primary Key)
- `category_name` - ชื่อหมวดหมู่

**ฟังก์ชัน:**
```javascript
getAllCategories()    // ดึงหมวดหมู่ทั้งหมด
getCategoryById(id)   // ดึงหมวดหมู่ตาม ID
createCategory(data)  // สร้างหมวดหมู่ใหม่
updateCategory(id)    // แก้ไขหมวดหมู่
deleteCategory(id)    // ลบหมวดหมู่
```

**ตัวอย่างการใช้งาน:**
- แสดงหมวดหมู่ในเมนูกรองสินค้า
- เพิ่มหมวดหมู่ใหม่เมื่อมีประเภทสินค้าใหม่

---

### 📄 3.2 productController.js - จัดการสินค้า

**ตาราง:** `products`

**คอลัมน์:**
- `product_id` - รหัสสินค้า
- `product_name` - ชื่อสินค้า
- `category_id` - หมวดหมู่สินค้า (Foreign Key → Categories)
- `price` - ราคาต่อหน่วย
- `quantity` - จำนวนคงเหลือในสต็อก
- `product_image` - ชื่อไฟล์รูปภาพ

**ฟังก์ชัน:**
```javascript
getAllProducts()                      // ดึงสินค้าทั้งหมด
getProductById(id)                    // ดึงสินค้าตาม ID
createProduct(data)                   // สร้างสินค้าใหม่
updateProduct(id, data)               // แก้ไขสินค้า
deleteProduct(id)                     // ลบสินค้า
decreaseProductQuantity(products)     // ลดจำนวนสินค้า (เมื่อมีการสั่งซื้อ)
increaseProductQuantity(products)     // เพิ่มจำนวนสินค้า (เมื่อคืนสต็อก)
updateMultipleProductQuantities(...)  // อัปเดตหลายชิ้นพร้อมกัน
```

**Logic สำคัญ:**
- **toRelativeImagePath()** - แปลง path รูปภาพให้เป็นรูปแบบ `image/filename.jpg`
- **decreaseProductQuantity** - ใช้เมื่อสร้างออเดอร์ (ตัดสต็อก)
- **increaseProductQuantity** - ใช้เมื่อยกเลิกออเดอร์ (คืนสต็อก)

---

### 📄 3.3 orderController.js - จัดการออเดอร์ (ไฟล์ใหญ่สุด)

**ตาราง:** `Orders`

**คอลัมน์:**
- `order_id` - รหัสออเดอร์ (Primary Key)
- `user_id` - รหัสผู้สั่งซื้อ (Foreign Key → Users)
- `customer_name` - ชื่อลูกค้า
- `phone` - เบอร์โทรศัพท์สำหรับออเดอร์นี้
- `order_date` - วันที่สั่งซื้อ
- `status` - สถานะออเดอร์ (pending/preparing/delivered/cancelled)
- `payment_method` - วิธีชำระเงิน (cod/qr/credit_card)
- `payment_status` - สถานะชำระเงิน (paid/unpaid)
- `payment_proof` - หลักฐานการชำระเงิน (path ไฟล์รูป)
- `delivery_address` - ที่อยู่จัดส่ง
- `total_amount` - ยอดรวมออเดอร์

**ฟังก์ชันหลัก:**

```javascript
// 1. ดึงข้อมูลออเดอร์
getAllOrders()              // ดึงออเดอร์ทั้งหมด + JOIN กับ Users
getOrderById(id)            // ดึงออเดอร์เดียว
getOrdersByUserId(userId)   // ดึงออเดอร์ของผู้ใช้คนหนึ่ง
trackOrderByPhoneAndOrderId(phone, orderId) // ติดตามออเดอร์

// 2. สร้าง/แก้ไขออเดอร์
createOrder(data)           // สร้างออเดอร์ใหม่
updateOrder(id, data)       // แก้ไขออเดอร์

// 3. จัดการสถานะ
updatePaymentStatus(id, status)    // เปลี่ยนสถานะชำระเงิน
updateOrderStatus(id, status)      // เปลี่ยนสถานะออเดอร์
cancelOrderByUser(orderId)         // ยกเลิกออเดอร์

// 4. จัดการที่อยู่และราคา
updateDeliveryAddress(id, address) // อัปเดตที่อยู่จัดส่ง
calculateAndUpdateOrderTotal(id)   // คำนวณราคารวม
syncDeliveryAddressFromUsers()     // ซิงค์ที่อยู่จาก Users

// 5. ลบออเดอร์
deleteOrder(id)            // ลบ OrderItems ก่อน แล้วลบ Order
```

**Logic สำคัญ:**

1. **COALESCE Pattern** - ใช้ phone และ address จาก Orders ก่อน ถ้าไม่มีค่อยใช้จาก Users
   ```sql
   COALESCE(o.phone, u.phone) as final_phone
   COALESCE(o.delivery_address, u.address) as final_delivery_address
   ```

2. **Transaction Management** - ลบ OrderItems ก่อนแล้วลบ Order (Foreign Key constraint)

3. **Status Management:**
   - `pending` = รอดำเนินการ (ออเดอร์ใหม่)
   - `preparing` = กำลังจัดเตรียมสินค้า
   - `delivered` = จัดส่งแล้ว
   - `cancelled` = ยกเลิก

---

### 📄 3.4 orderItemController.js - จัดการรายการสินค้าในออเดอร์

**ตาราง:** `OrderItems`

**คอลัมน์:**
- `orderitem_id` - รหัสรายการ (Primary Key)
- `order_id` - รหัสออเดอร์ (Foreign Key → Orders)
- `product_id` - รหัสสินค้า (Foreign Key → products)
- `quantity` - จำนวนที่สั่ง
- `price` - ราคาต่อหน่วย (บันทึกไว้ตอนสั่งซื้อ)

**ฟังก์ชัน:**
```javascript
getAllOrderItems()                  // ดึงรายการทั้งหมด
getOrderItemById(id)                // ดึงรายการตาม ID
getOrderItemsByOrderId(orderId)     // ดึงรายการของออเดอร์หนึ่ง
createOrderItem(data)               // สร้างรายการใหม่
updateOrderItem(id, data)           // แก้ไขรายการ
deleteOrderItem(id)                 // ลบรายการ
```

**ตัวอย่างการใช้งาน:**
- เมื่อสร้างออเดอร์ → สร้าง OrderItems หลายรายการ
- แสดงรายการสินค้าในหน้ารายละเอียดออเดอร์

---

### 📄 3.5 usersController.js - จัดการผู้ใช้

**ตาราง:** `users`

**คอลัมน์:**
- `user_id` - รหัสผู้ใช้ (Primary Key)
- `username` - ชื่อผู้ใช้ (unique)
- `email` - อีเมล
- `password` - รหัสผ่าน (ไม่เข้ารหัส - ควรปรับปรุง!)
- `role` - บทบาท (admin/customer)
- `phone` - เบอร์โทรศัพท์
- `address` - ที่อยู่

**ฟังก์ชันหลัก:**

```javascript
// 1. CRUD พื้นฐาน
getAllUsers()           // ดึงผู้ใช้ทั้งหมด (ไม่แสดง password)
getUserById(id)         // ดึงผู้ใช้ตาม ID
createUser(data)        // สร้างผู้ใช้ใหม่
updateUser(id, data)    // แก้ไขข้อมูลผู้ใช้
deleteUser(id)          // ลบผู้ใช้

// 2. Authentication
registerUser(data)      // สมัครสมาชิก (ตรวจสอบ username ซ้ำ)
loginUser(username, password) // เข้าสู่ระบบ

// 3. จัดการข้อมูลเฉพาะ
getUserAddress(id)      // ดึงที่อยู่ของผู้ใช้
updateUserAddress(id, address) // อัปเดตที่อยู่
changePassword(id, oldPassword, newPassword) // เปลี่ยนรหัสผ่าน
```

**Logic สำคัญ:**
- **registerUser** - ตรวจสอบว่า username ซ้ำหรือไม่
- **loginUser** - ส่ง user object กลับถ้า login สำเร็จ
- **changePassword** - ตรวจสอบรหัสผ่านเก่าก่อนเปลี่ยน

---

### 📄 3.6 stockitemController.js - จัดการสต็อกสินค้า

**ตาราง:** `StockItem`

**คอลัมน์:**
- `stockitem_id` - รหัสสต็อก (Primary Key)
- `product_id` - รหัสสินค้า (Foreign Key → products)
- `quantity` - จำนวนในล็อตนี้
- `lot_number` - หมายเลขล็อต
- `expiry_date` - วันหมดอายุ
- `storage_location` - ตำแหน่งจัดเก็บ
- `created_at` - วันที่สร้างข้อมูล

**ฟังก์ชัน:**
```javascript
getAllStockItems()                  // ดึงสต็อกทั้งหมด + JOIN products
getStockItemById(id)                // ดึงสต็อกตาม ID
getStockItemsByProduct(productId)   // ดึงสต็อกของสินค้าหนึ่ง
getExpiringStockItems(days)         // ดึงสต็อกที่ใกล้หมดอายุ
getStockSummaryByProduct()          // สรุปจำนวนสต็อกแยกตามสินค้า
createStockItem(data)               // สร้างสต็อกใหม่
updateStockItem(id, data)           // แก้ไขสต็อก
deleteStockItem(id)                 // ลบสต็อก
```

**ตัวอย่างการใช้งาน:**
- จัดการล็อตสินค้าที่เข้ามาใหม่
- ตรวจสอบสินค้าที่ใกล้หมดอายุ
- ติดตามตำแหน่งจัดเก็บในคลัง

---

### 📄 3.7 uploadController.js - จัดการอัปโหลดไฟล์

**ฟังก์ชัน:**
```javascript
uploadPaymentProof(file)  // อัปโหลดหลักฐานการชำระเงิน
```

**การทำงาน:**
1. ใช้ **multer** สำหรับรับไฟล์จาก multipart/form-data
2. กำหนดตำแหน่งเก็บไฟล์: `uploads/payment-proofs/`
3. สร้างชื่อไฟล์ใหม่ด้วย timestamp: `1234567890-9876543210.jpg`
4. กรองเฉพาะไฟล์รูปภาพ (image/*)
5. จำกัดขนาดไฟล์สูงสุด 5MB
6. ส่ง path ของไฟล์กลับมา

**ตัวอย่าง Response:**
```json
{
  "message": "File uploaded successfully",
  "filePath": "/uploads/payment-proofs/1698234567890-123456789.jpg"
}
```

---

## 🔗 สรุปความสัมพันธ์ระหว่างตาราง

```
Users (ผู้ใช้)
  ↓ (1:N)
Orders (ออเดอร์)
  ↓ (1:N)
OrderItems (รายการสินค้าในออเดอร์)
  ↓ (N:1)
Products (สินค้า)
  ↓ (N:1)
Categories (หมวดหมู่)

Products (สินค้า)
  ↓ (1:N)
StockItem (สต็อก)
```

---

## 🚀 สรุป Flow การทำงาน

### 1. เมื่อผู้ใช้สั่งซื้อสินค้า:
```
1. Frontend ส่ง POST /api/orders
2. orderController.createOrder() สร้างออเดอร์
3. orderItemController.createOrderItem() สร้างรายการสินค้า
4. productController.decreaseProductQuantity() ตัดสต็อก
```

### 2. เมื่อ Admin อัปเดตสถานะออเดอร์:
```
1. Frontend ส่ง PUT /api/orders/:id/status
2. orderController.updateOrderStatus() เปลี่ยนสถานะ
3. Logger บันทึก log
```

### 3. เมื่อผู้ใช้อัปโหลดหลักฐานการชำระเงิน:
```
1. Frontend ส่ง POST /api/upload-payment-proof
2. uploadController.uploadPaymentProof() บันทึกไฟล์
3. Frontend ส่ง PUT /api/orders/:id อัปเดต payment_proof
```

---

## ⚠️ จุดที่ควรปรับปรุง

1. **Security:**
   - รหัสผ่านควรเข้ารหัสด้วย bcrypt
   - ควรมี JWT Authentication
   - ควรตรวจสอบ Input Validation

2. **Error Handling:**
   - ควรมี try-catch ครอบคลุมทุกฟังก์ชัน
   - Error messages ควรชัดเจนขึ้น

3. **Database Connection:**
   - ควรใช้ Connection Pool แทน Single Connection
   - categoryController, orderItemController, usersController ยังใช้ `mysql.createConnection` 
   - ควรเปลี่ยนเป็น `import db from '../config/database.js'` เหมือน productController

4. **Code Consistency:**
   - บาง Controller ใช้ async/await
   - บาง Controller ใช้ callback
   - ควรใช้รูปแบบเดียวกันทั้งหมด

---

## 📌 สรุป

**Backend นี้เป็นระบบจัดการร้านขายอาหารแช่แข็ง ประกอบด้วย:**

- ✅ ระบบจัดการสินค้า (Products, Categories, StockItems)
- ✅ ระบบออเดอร์ (Orders, OrderItems)
- ✅ ระบบผู้ใช้ (Users, Authentication)
- ✅ ระบบอัปโหลดไฟล์ (Payment Proofs)
- ✅ API ครบถ้วนสำหรับ CRUD ทุกส่วน

**ทุกไฟล์มีหน้าที่ชัดเจน แยกตาม Concern และสามารถขยายได้ง่าย! 🎉**
