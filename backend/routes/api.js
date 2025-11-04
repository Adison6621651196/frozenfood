// Express เป็น Web Framework สำหรับ Node.js
// เพื่อให้เราสามารถใช้ฟีเจอร์ของ Express ในไฟล์นี้ได้
import express from 'express';

// Product Controller - จัดการข้อมูลสินค้า (CRUD + ปรับจำนวนสินค้า)
import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, decreaseProductQuantity, increaseProductQuantity,
} from '../controllers/productController.js';

// Order Controller - จัดการออเดอร์ (CRUD + tracking + cancel + update status)
import {
  getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, updatePaymentStatus, updateOrderStatus, trackOrderByPhoneAndOrderId, getOrdersByUserId, cancelOrderByUser, calculateAndUpdateOrderTotal, updateDeliveryAddress, syncDeliveryAddressFromUsers,
} from '../controllers/orderController.js';

// Category Controller - จัดการหมวดหมู่สินค้า (CRUD)
import {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';

// OrderItem Controller - จัดการรายการสินค้าในออเดอร์ (CRUD)
import {
  getAllOrderItems, getOrderItemById, getOrderItemsByOrderId, createOrderItem, updateOrderItem, deleteOrderItem,
} from '../controllers/orderItemController.js';

// User Controller - จัดการผู้ใช้ (CRUD + login + register + change password + reset password)
import {
  getAllUsers,getUserById,createUser,updateUser,deleteUser,loginUser,getUserAddress,updateUserAddress,registerUser,changePassword,verifyEmail,verifyIdentity,resetPassword,
} from '../controllers/usersController.js';

// Forgot Password Controller - จัดการลืมรหัสผ่าน (send OTP + verify OTP + reset password)
import {
  sendOTP,
  verifyOTP,
  resetPassword as resetPasswordWithOTP
} from '../controllers/forgotPasswordController.js';

// Upload Controller - จัดการการอัปโหลดไฟล์ (หลักฐานการชำระเงิน)
import {
  uploadPaymentProof,
  uploadProductImage
} from '../controllers/uploadController.js';

// StockItem Controller - จัดการสต็อกสินค้า (CRUD + expiring + summary)
import {
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  getStockItemsByProduct,
  getExpiringStockItems,
  getStockSummaryByProduct,
} from '../controllers/stockitemController.js';

// Address Controller - จัดการข้อมูลที่อยู่ไทย (จังหวัด อำเภอ ตำบล รหัสไปรษณีย์)
import {
  getAllProvinces,
  getDistrictsByProvince,
  getSubDistrictsByDistrict,
} from '../controllers/addressController.js';

const router = express.Router();

// ============================================
// PRODUCTS ROUTES - จัดการสินค้า
// ============================================
router.get('/products', getAllProducts); //ดึงสินค้าทั้งหมด
router.get('/products/:id', getProductById);//ดึงสินค้าตาม ID
router.post('/products', createProduct);//สร้างสินค้าใหม่
router.put('/products/:id', updateProduct);//แก้ไขสินค้า
router.delete('/products/:id', deleteProduct);//ลบสินค้า
router.put('/products/decrease-quantity', decreaseProductQuantity);//ลดจำนวนสินค้า (เมื่อมีการสั่งซื้อ)
router.put('/products/increase-quantity', increaseProductQuantity);//เพิ่มจำนวนสินค้า (เมื่อคืนสต็อก)



// ============================================
// ORDERS ROUTES - จัดการออเดอร์
// ============================================
router.get('/orders', getAllOrders);//ดึงออเดอร์ทั้งหมด
router.get('/orders/track', trackOrderByPhoneAndOrderId);//ติดตามออเดอร์ด้วยเบอร์โทรและ order_id
router.get('/orders/user/:userId', getOrdersByUserId);//ดึงออเดอร์ของผู้ใช้คนใดคนหนึ่ง
router.put('/orders/:orderId/cancel', cancelOrderByUser);//ยกเลิกออเดอร์โดยผู้ใช้
router.put('/orders/:order_id/update-total', calculateAndUpdateOrderTotal);//คำนวณและอัปเดตราคารวมของออเดอร์
router.put('/orders/:order_id/delivery-address', updateDeliveryAddress);//อัปเดตที่อยู่จัดส่ง
router.put('/orders/sync-addresses', syncDeliveryAddressFromUsers);//ซิงค์ที่อยู่จาก Users ไปยัง Orders
router.put('/orders/:id/payment-status', (req, res) => {
  updatePaymentStatus(req, res);
});//อัปเดตสถานะการชำระเงิน
router.put('/orders/:id/status', (req, res) => {
  updateOrderStatus(req, res);
});//อัปเดตสถานะออเดอร์
router.get('/orders/:id', getOrderById);//ดึงออเดอร์ตาม ID
router.post('/orders', createOrder);//สร้างออเดอร์ใหม่
router.put('/orders/:id', updateOrder);//แก้ไขออเดอร์
router.delete('/orders/:id', deleteOrder);//ลบออเดอร์


// ============================================
// CATEGORIES ROUTES - จัดการหมวดหมู่สินค้า
// ============================================
router.get('/categories', getAllCategories);//ดึงหมวดหมู่ทั้งหมด
router.get('/categories/:id', getCategoryById);//ดึงหมวดหมู่ตาม ID
router.post('/categories', createCategory);//สร้างหมวดหมู่ใหม่
router.put('/categories/:id', updateCategory);//แก้ไขหมวดหมู่
router.delete('/categories/:id', deleteCategory);//ลบหมวดหมู่


// ============================================
// ORDER ITEMS ROUTES - จัดการรายการสินค้าในออเดอร์
// ============================================
router.get('/order-items', getAllOrderItems);//ดึง order items ทั้งหมด
router.get('/order-items/:id', getOrderItemById);//ดึง order item ตาม ID
router.get('/order-items/order/:orderId', getOrderItemsByOrderId);//ดึง order items ของออเดอร์ใดออเดอร์หนึ่ง
router.post('/order-items', createOrderItem);//สร้าง order item ใหม่
router.put('/order-items/:id', updateOrderItem);//แก้ไข order item
router.delete('/order-items/:id', deleteOrderItem);//ลบ order item


// ============================================
// USERS ROUTES - จัดการผู้ใช้
// ============================================
// ⚠️ Routes ที่ไม่มี parameter (:id) ต้องอยู่ข้างบนก่อน
router.get('/users', getAllUsers);//ดึงผู้ใช้ทั้งหมด
router.post('/users', createUser);//สร้างผู้ใช้ใหม่
router.post('/users/register', registerUser);//สมัครสมาชิกใหม่
router.post('/users/login', loginUser);//เข้าสู่ระบบ (ตรวจสอบ username/password)
router.post('/users/verify-email', verifyEmail);//ตรวจสอบตัวตนด้วยอีเมล (สำหรับลืมรหัสผ่าน)
router.post('/users/verify-identity', verifyIdentity);//ตรวจสอบตัวตนด้วย username + phone (สำหรับลืมรหัสผ่าน)
router.put('/users/reset-password', resetPassword);//รีเซ็ตรหัสผ่าน (ไม่ต้องใช้รหัสผ่านเดิม - สำหรับลืมรหัสผ่าน)
// Routes ที่มี parameter (:id) ต้องอยู่ข้างล่าง
router.get('/users/:id', getUserById);//ดึงผู้ใช้ตาม ID
router.get('/users/:id/address', getUserAddress);//ดึงที่อยู่ของผู้ใช้
router.put('/users/:id', updateUser);//แก้ไขข้อมูลผู้ใช้
router.put('/users/:id/address', updateUserAddress);//อัปเดตที่อยู่ผู้ใช้
router.put('/users/:id/change-password', changePassword);//เปลี่ยนรหัสผ่าน (ต้องใช้รหัสผ่านเดิม)
router.delete('/users/:id', deleteUser);//ลบผู้ใช้


// ============================================
// UPLOAD ROUTES - อัปโหลดไฟล์
// ============================================
router.post('/upload-payment-proof', uploadPaymentProof);//อัปโหลดหลักฐานการชำระเงิน (รูปภาพ)
router.post('/upload', uploadProductImage);//อัปโหลดรูปสินค้า


// ============================================
// STOCK ITEMS ROUTES - จัดการสต็อกสินค้า
// ============================================
router.get('/stock-items', getAllStockItems);//ดึงสต็อกทั้งหมด (พร้อมข้อมูลสินค้า)
router.get('/stock-items/summary', getStockSummaryByProduct);//สรุปสต็อกแยกตามสินค้า
router.get('/stock-items/expiring', getExpiringStockItems);//ดึงสต็อกที่ใกล้หมดอายุ
router.get('/stock-items/product/:productId', getStockItemsByProduct);//ดึงสต็อกของสินค้าชิ้นใดชิ้นหนึ่ง
router.get('/stock-items/:id', getStockItemById);//ดึงสต็อกตาม ID
router.post('/stock-items', createStockItem);//สร้างสต็อกใหม่
router.put('/stock-items/:id', updateStockItem);//แก้ไขสต็อก
router.delete('/stock-items/:id', deleteStockItem);//ลบสต็อก

// ============================================
// FORGOT PASSWORD ROUTES - ลืมรหัสผ่าน
// ============================================
router.post('/forgot-password/send-otp', sendOTP); // ส่ง OTP ไปยัง email
router.post('/forgot-password/verify-otp', verifyOTP); // ตรวจสอบ OTP
router.post('/forgot-password/reset-password', resetPasswordWithOTP); // รีเซ็ตรหัสผ่านด้วย OTP

// ============================================
// ADDRESS ROUTES - ข้อมูลที่อยู่ไทย
// ============================================
router.get('/provinces', getAllProvinces);//ดึงจังหวัดทั้งหมด
router.get('/districts/:provinceId', getDistrictsByProvince);//ดึงอำเภอตามจังหวัด
router.get('/subdistricts/:districtId', getSubDistrictsByDistrict);//ดึงตำบลตามอำเภอ

export default router;
