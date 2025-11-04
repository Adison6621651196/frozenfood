import { Component, OnInit } from '@angular/core';
import logger from '../utils/logger';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { AuthService, User } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PromptpayService } from '../services/promptpay.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  cartItems: CartItem[] = [];
  selectedPaymentMethod: string = '';
  qrCodeImage: string = '';
  paymentProofFile: File | null = null;
  customerName: string = '';
  customerPhone: string = '';
  customerAddress: string = '';
  isSubmitting: boolean = false;
  currentUser: User | null = null;
  isLoggedIn: boolean = false;
  
  // ข้อมูลร้านค้า - *** กรุณาเปลี่ยนเป็นเบอร์โทรศัพท์หรือเลขบัตรประชาชนของคุณ ***
  shopPromptPayId: string = '0622762139'; // เปลี่ยนเป็นเบอร์โทรศัพท์ของคุณ (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก)
  shopName: string = 'ร้านอาหารแช่แข็ง'; // ชื่อร้านของคุณ
  
  constructor(
    private cartService: CartService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private promptpayService: PromptpayService,
    private toastService: ToastService
  ) {}
  ngOnInit(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      if (items.length === 0) {
        // ถ้าตระกร้าว่างให้กลับไปหน้าสินค้า
        this.router.navigate(['/product']);
      }
    });
    // ตรวจสอบสถานะการเข้าสู่ระบบและโหลดข้อมูลผู้ใช้
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      if (user) {
        // ถ้าเข้าสู่ระบบแล้วให้ใช้ข้อมูลจากผู้ใช้
        this.customerName = user.full_name || user.username || '';
        this.customerPhone = user.phone || '';
        this.customerAddress = user.address || '';
      } else {
        // ถ้าไม่ได้เข้าสู่ระบบ ตรวจสอบข้อมูลชั่วคราว
        const tempData = localStorage.getItem('tempCheckoutData');
        if (tempData) {
          const data = JSON.parse(tempData);
          this.customerName = data.customerName || '';
          this.customerPhone = data.customerPhone || '';
          this.customerAddress = data.customerAddress || '';
          this.selectedPaymentMethod = data.selectedPaymentMethod || '';
          // ลบข้อมูลชั่วคราว
          localStorage.removeItem('tempCheckoutData');
        }
      }
    });
    // สร้าง QR Code สำหรับการชำระเงิน
    this.generateQRCode();
  }
  
  async generateQRCode(): Promise<void> {
    try {
      // สร้าง QR Code PromptPay พร้อมจำนวนเงินที่ต้องชำระ
      const totalAmount = this.getTotalPrice();
      this.qrCodeImage = await this.promptpayService.generateQRCode(
        this.shopPromptPayId,
        totalAmount
      );
      console.log('QR Code generated successfully');
    } catch (error) {
      console.error('Error generating QR Code:', error);
      // ถ้าเกิดข้อผิดพลาด ให้แสดงข้อความแจ้งเตือน
      this.toastService.error('ไม่สามารถสร้าง QR Code ได้ กรุณาตรวจสอบการตั้งค่าเบอร์โทรศัพท์ร้านค้า');
    }
  }
  getTotalPrice(): number {
    return this.cartService.getTotal();
  }
  getTotalQuantity(): number {
    return this.cartService.getItemCount();
  }
  onPaymentMethodChange(method: string): void {
    this.selectedPaymentMethod = method;
    // ถ้าเลือก QR Code ให้สร้าง QR Code ใหม่เผื่อมีการเปลี่ยนแปลงจำนวนเงิน
    if (method === 'qr') {
      this.generateQRCode();
    }
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (file.type.startsWith('image/')) {
        this.paymentProofFile = file;
        } else {
        this.toastService.info('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        event.target.value = '';
      }
    }
  }
  async submitOrder(): Promise<void> {
    if (!this.selectedPaymentMethod) {
      this.toastService.info('กรุณาเลือกวิธีชำระเงิน');
      return;
    }
    if (!this.customerName || !this.customerPhone || !this.customerAddress) {
      this.toastService.info('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (this.selectedPaymentMethod === 'qr' && !this.paymentProofFile) {
      this.toastService.info('กรุณาแนบหลักฐานการชำระเงิน');
      return;
    }
    this.isSubmitting = true;
    try {
      // สร้างข้อมูลออเดอร์
      const orderData = {
        user_id: this.currentUser?.user_id || null, // ใช้ user_id จากผู้ใช้ที่เข้าสู่ระบบ
        customer_name: this.customerName,
        customer_phone: this.customerPhone,
        delivery_address: this.customerAddress,
        payment_method: this.selectedPaymentMethod === 'cod' ? 'cod' : 'qr',
        // เมื่อแนบหลักฐานการชำระเงิน (QR) ให้ยังคงสถานะเป็น 'unpaid'
        // เพื่อให้ผู้ดูแลระบบตรวจสอบและยืนยันการชำระเงินก่อนเปลี่ยนเป็น 'paid'
        payment_status: 'unpaid',
        total_amount: this.getTotalPrice(),
        status: 'pending',
        order_items: this.cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };
      // อัปโหลดหลักฐานการชำระเงิน (ถ้ามี)
      let paymentProofPath = null;
      if (this.paymentProofFile) {
        const formData = new FormData();
        formData.append('payment_proof', this.paymentProofFile);
        const uploadResponse = await this.http.post<any>(`${this.apiUrl}/upload-payment-proof`, formData).toPromise();
        paymentProofPath = uploadResponse.filePath;
      }
      // เพิ่ม payment_proof ลงในข้อมูลออเดอร์
      if (paymentProofPath) {
        (orderData as any).payment_proof = paymentProofPath;
      }
      // ส่งข้อมูลไปยัง backend
      const response = await this.http.post<any>(`${this.apiUrl}/orders`, orderData).toPromise();
      if (response.success) {
        this.cartService.clearCart();
        this.router.navigate(['/order-success'], { queryParams: { orderId: response.orderId } });
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      logger.error('Error submitting order:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่');
    } finally {
      this.isSubmitting = false;
    }
  }
  goBack(): void {
    this.router.navigate(['/cart']);
  }
  goToLogin(): void {
    // บันทึกข้อมูลที่กรอกไว้ชั่วคราว
    const tempData = {
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerAddress: this.customerAddress,
      selectedPaymentMethod: this.selectedPaymentMethod
    };
    localStorage.setItem('tempCheckoutData', JSON.stringify(tempData));
    // ไปหน้าเข้าสู่ระบบ
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
  }

  // จำกัดให้กรอกได้เฉพาะตัวเลข
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // อนุญาตเฉพาะตัวเลข 0-9
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}

