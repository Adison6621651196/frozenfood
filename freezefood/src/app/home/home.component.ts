import { Component, OnInit } from '@angular/core';
import logger from '../utils/logger';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CategoryService, Category } from '../services/category.service';
import { ProductService, Product } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  newsletterEmail: string = '';
  categories: any[] = [];
  loading: boolean = false;
  currentUser: any = null;
  featuredProducts: Product[] = [];
  constructor(
    private router: Router, 
    private cartService: CartService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}
  ngOnInit() {
    this.loadCategories();
    this.loadFeaturedProducts();
    this.loadCurrentUser();
  }
  loadCurrentUser() {
    // ใช้ AuthService ก่อน
    this.currentUser = this.authService.currentUserValue;
    // หากไม่มี ลอง localStorage แทน
    if (!this.currentUser) {
      let userData = localStorage.getItem('currentUser');
      if (!userData) {
        userData = localStorage.getItem('user');
      }
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    }
    // Debug log

    console.log('Current user in home component:', this.currentUser);

  // current user in home component

  }
  loadCategories() {
    this.loading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        console.log('Categories from API:', categories);
        this.categories = categories.map(cat => ({
          id: this.categoryService.getCategoryKey(cat.category_id),
          name: cat.category_name,
          icon: cat.icon,
          categoryId: cat.category_id,
          description: this.getCategoryDescription(cat.category_name)
        }));
        console.log('Mapped categories for home:', this.categories);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        logger.error('Error loading categories:', error);
        // fallback categories
        this.categories = [
          { id: 'seafood', name: 'อาหารทะเล', icon: '🦐', description: 'สด ใหม่ มี คุณภาพ จากทะเล' },
          { id: 'meatballs', name: 'ลูกชิ้น', icon: '🍡', description: 'หอมหวานเนื้อแน่น' },
          { id: 'pork', name: 'หมู', icon: '🐷', description: 'เนื้อหมู คุณภาพ ปลอดภัย' },
          { id: 'chicken', name: 'ไก่', icon: '🐔', description: 'เนื้อไก่ นุ่ม สด สะอาด ปลอดภัย' },
          { id: 'others', name: 'อื่นๆ', icon: '🍽️', description: 'สินค้าอื่นๆที่น่าสนใจ' },
          { id: 'beef', name: 'เนื้อวัว', icon: '🐄', description: 'เนื้อวัวคุณภาพพรีเมียม' }
        ];
        this.loading = false;
      }
    });
  }
  getCategoryDescription(categoryName: string): string {
    const descriptions: { [key: string]: string } = {
      'อาหารทะเล': 'สด ใหม่ มี คุณภาพ จากทะเล',
      'ลูกชิ้น': 'หอมหวานเนื้อแน่น',
      'หมู': 'เนื้อหมู คุณภาพ ปลอดภัย',
      'ไก่': 'เนื้อไก่ นุ่ม สด สะอาด ปลอดภัย',
      'อื่นๆ': 'สินค้าอื่นๆที่น่าสนใจ',
      'เนื้อวัว': 'เนื้อวัวคุณภาพพรีเมียม'
    };
    return descriptions[categoryName] || 'สินค้าคุณภาพ';
  }
  navigateToProducts(category?: string) {
    console.log('Navigating to products with category:', category);
    if (category) {
      // ส่ง category เป็น query parameter ไปให้ product component ใช้ในการกรอง
      this.router.navigate(['/product'], { queryParams: { category: category } });
    } else {
      this.router.navigate(['/product']);
    }
  }
  loadFeaturedProducts() {

    // แสดงสินค้า 4 รายการ
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products.slice(0, 4);
      },
      error: (error) => {

        console.error('Error loading featured products:', error);

        logger.error('Error loading featured products:', error);

      }
    });
  }
  addToCart(product: any) {
    this.cartService.addToCart({
      product_id: product.product_id,
      product_name: product.product_name,
      price: product.price,
      image: product.image,
      quantity: 1,
      category: product.category
    });
    // notify
    try { this.toastService?.success && this.toastService.success('เพิ่ม "' + product.product_name + '" ลงตะกร้าแล้ว!'); } catch(e) {}
  }

  // Use ToastService for notifications

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300x200/E3F2FD/2196F3?text=No+Image';
  }
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
