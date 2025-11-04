import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
export interface CartItem {
  product_id: string;  // เปลี่ยนเป็น string
  product_name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  constructor() {
    this.clearCart();
  }
  // Observable สำหรับติดตามการเปลี่ยนแปลงของตะกร้า
  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }
  // เพิ่มสินค้าลงตะกร้า
  addToCart(product: any): void {
    const existingItem = this.cartItems.find(item => item.product_id === product.product_id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      // สร้าง full URL สำหรับรูปภาพ
      let imageUrl = 'assets/placeholder.svg';
      if (product.image) {
        imageUrl = product.image.startsWith('http') 
          ? product.image 
          : `http://localhost:3000/${product.image}`;
      }
      const newItem: CartItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        image: imageUrl,
        quantity: 1,
        category: product.category || ''
      };
      this.cartItems.push(newItem);
    }
    this.cartSubject.next([...this.cartItems]);
  }
  // ลบสินค้าออกจากตะกร้า
  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.product_id !== productId);
    this.cartSubject.next([...this.cartItems]);
  }
  // อัพเดตจำนวนสินค้า
  updateQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(item => item.product_id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartSubject.next([...this.cartItems]);
      }
    }
  }
  // เคลียร์ตะกร้า
  clearCart(): void {
    this.cartItems = [];
    this.cartSubject.next([]);
  }
  // คำนวณราคารวม
  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  // นับจำนวนสินค้าในตะกร้า
  getItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }
  // ตรวจสอบว่ามีสินค้าในตะกร้าหรือไม่
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }
  // ตรวจสอบว่าสินค้าอยู่ในตะกร้าหรือไม่
  isInCart(productId: string): boolean {
    return this.cartItems.some(item => item.product_id === productId);
  }
  // ดึงจำนวนสินค้าที่เฉพาะเจาะจง
  getItemQuantity(productId: string): number {
    const item = this.cartItems.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  }
}
