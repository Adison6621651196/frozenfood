import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { ToastService } from '../services/toast.service';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoggedIn = false; // เพิ่มตัวแปรตรวจสอบการล็อกอิน
  
  // Confirmation modal state
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  private confirmCallback: (() => void) | null = null;
  constructor(
    private cartService: CartService,
    private router: Router,
    private toastService: ToastService
  ) {}
  ngOnInit(): void {
    // ตรวจสอบการล็อกอิน
    this.checkLoginStatus();
    
    // ติดตามการเปลี่ยนแปลงของตะกร้า
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });
  }
  
  // ตรวจสอบสถานะการล็อกอิน
  checkLoginStatus(): void {
    const currentUser = localStorage.getItem('currentUser');
    this.isLoggedIn = !!currentUser;
  }
  // คำนวณราคารวม
  getTotalPrice(): number {
    return this.cartService.getTotal();
  }
  // คำนวณจำนวนชิ้นทั้งหมด
  getTotalQuantity(): number {
    return this.cartService.getItemCount();
  }
  // คำนวณจำนวนรายการ
  getTotalItems(): number {
    return this.cartItems.length;
  }
  // เพิ่มจำนวนสินค้า
  increaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.product_id, item.quantity + 1);
  }
  // ลดจำนวนสินค้า
  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product_id, item.quantity - 1);
    }
  }
  // ลบสินค้าออกจากตระกร้า
  removeItem(itemId: string): void {
    // เปิด modal ยืนยันการลบก่อนจะลบจริง
    this.openConfirm(
      'ลบสินค้า',
      'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากตระกร้า?',
      () => {
        this.cartService.removeFromCart(itemId);
        this.toastService.success('ลบสินค้าออกจากตระกร้าเรียบร้อย');
      }
    );
  }
  // ล้างตระกร้าทั้งหมด
  clearCart(): void {
    // ใช้ modal ยืนยันการล้างตระกร้า
    this.openConfirm(
      'ล้างตระกร้า',
      'คุณต้องการล้างตระกร้าทั้งหมด ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้',
      () => {
        this.cartService.clearCart();
        this.toastService.success('ล้างตระกร้าเรียบร้อยแล้ว');
      }
    );
  }

  // Open a custom confirmation modal
  openConfirm(title: string, message: string, callback: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirm = true;
  }

  // Called when user confirms
  confirmYes() {
    if (this.confirmCallback) {
      try { this.confirmCallback(); } catch (e) { /* ignore */ }
    }
    this.closeConfirm();
  }

  // Cancel/close
  confirmNo() {
    this.closeConfirm();
  }

  private closeConfirm() {
    this.showConfirm = false;
    this.confirmTitle = '';
    this.confirmMessage = '';
    this.confirmCallback = null;
  }
  // ดำเนินการชำระเงิน
  checkout(): void {
    if (this.cartItems.length === 0) {
      this.toastService.info('ตระกร้าสินค้าว่างเปล่า');
      return;
    }
    
    // ตรวจสอบว่าล็อกอินหรือยัง
    if (!this.isLoggedIn) {
      this.toastService.info('กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ');
      // เก็บ URL ปัจจุบันเพื่อกลับมาหลังล็อกอิน
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    
    // นำทางไปหน้าชำระเงิน
    this.router.navigate(['/checkout']);
  }
  
  // ฟังก์ชันไปหน้าล็อกอิน
  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
  }
  // ไปยังหน้าแรกเพื่อเลือกซื้อสินค้าเพิ่ม
  continueShopping(): void {
    this.router.navigate(['/product']);
  }
  // จัดการเมื่อรูปภาพโหลดไม่ได้
  onImageError(event: any): void {
    event.target.src = 'assets/placeholder.svg';
    event.target.style.background = '#f0f0f0';
    event.target.style.border = '2px dashed #ccc';
  }
}
