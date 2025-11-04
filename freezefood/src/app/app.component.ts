import logger from './utils/logger';
import { Component, OnInit, HostListener } from '@angular/core';
import { CartService } from './services/cart.service';
import { AuthService, User } from './services/auth.service';
import { Observable } from 'rxjs';
// ในโค้ดนี้ใช้แปลง array ของสินค้า → จำนวนรวมของสินค้า
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'freezefood';
  cartItemCount$: Observable<number>;
  showUserDropdown = false;
  currentUser: any = null;
  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {
    this.cartItemCount$ = this.cartService.getCartItems().pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }
  ngOnInit() {
    // ติดตาม auth status จาก AuthService
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    // Listen สำหรับการเปลี่ยนแปลงใน localStorage (เพื่อ backward compatibility)
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        this.checkLoginStatus();
      }
    });
  }
  checkLoginStatus() {
    const userString = localStorage.getItem('user');
    if (userString && !this.authService.currentUserValue) {
      try {
        const userData = JSON.parse(userString);
        this.authService.login(userData);
      } catch (error) {
        logger.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }
  logout() {
    this.authService.logout();
    localStorage.removeItem('user'); // เพื่อ backward compatibility
    this.showUserDropdown = false;
  }
  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
    const target = event.target;
    const userDropdown = target.closest('.user-dropdown');
    if (!userDropdown && this.showUserDropdown) {
      this.showUserDropdown = false;
    }
  }
}
