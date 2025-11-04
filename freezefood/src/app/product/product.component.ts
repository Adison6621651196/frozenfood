import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../services/cart.service';
import { ProductService, Product } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import logger from '../utils/logger';
import { ToastService } from '../services/toast.service';
@Component({
  selector: 'app-product',
  templateUrl: './product.component.html'
})
export class ProductComponent implements OnInit {
  selectedCategory: string = '';
  searchTerm: string = '';
  products: Product[] = [];
  categories: any[] = [];
  loading: boolean = false;
  loadingCategories: boolean = false;
  error: string = '';
  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}
  ngOnInit() {
    // โหลดหมวดหมู่ก่อน
    this.loadCategories();
    
    // ตรวจสอบ query parameter เพื่อเลือกหมวดหมู่ทันที
    this.route.queryParams.subscribe(params => {
      console.log('Query params:', params);
      if (params['category']) {
        this.selectedCategory = params['category'];
        console.log('Category from query params:', this.selectedCategory);
      }
      // โหลดสินค้าหลังจากตั้งค่าหมวดหมู่แล้ว
      if (this.selectedCategory) {
        this.loadProducts();
      }
    });
  }
  loadCategories() {
    this.loadingCategories = true;
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded from API:', categories);
        this.categories = categories.map(cat => ({
          id: this.categoryService.getCategoryKey(cat.category_id),
          name: cat.category_name,
          icon: cat.icon,
          categoryId: cat.category_id
        }));
        console.log('Mapped categories:', this.categories);
        
        // ถ้ายังไม่มี selectedCategory ให้เลือกหมวดหมู่แรก
        if (!this.selectedCategory && this.categories.length > 0) {
          this.selectedCategory = this.categories[0].id;
          console.log('Auto-selected first category:', this.selectedCategory);
          this.loadProducts();
        }
        
        this.loadingCategories = false;
      },
      error: (error) => {
        logger.error('Error loading categories:', error);
        console.error('Failed to load categories, using fallback:', error);
        // ใช้ fallback categories
        this.categories = [
          { id: 'seafood', name: 'อาหารทะเล', icon: '🦐' },
          { id: 'meatballs', name: 'ลูกชิ้น', icon: '🍡' },
          { id: 'pork', name: 'หมู', icon: '🐷' },
          { id: 'chicken', name: 'ไก่', icon: '🐔' },
          { id: 'others', name: 'อื่นๆ', icon: '🍽️' },
          { id: 'beef', name: 'เนื้อวัว', icon: '🐄' }
        ];
        
        if (!this.selectedCategory && this.categories.length > 0) {
          this.selectedCategory = this.categories[0].id;
          this.loadProducts();
        }
        
        this.loadingCategories = false;
      }
    });
  }
  loadProducts() {
    this.loading = true;
    this.error = '';
    console.log('Loading products for category:', this.selectedCategory);
    this.productService.getAllProducts(this.selectedCategory).subscribe({
      next: (products) => {
        this.products = products;
        console.log('Products loaded:', products.length, 'products');
        this.loading = false;
      },
      error: (error) => {
        logger.error('Error loading products:', error);
        this.error = 'ไม่สามารถโหลดข้อมูลสินค้าได้ - ตรวจสอบ backend server';
        this.loading = false;
      }
    });
  }
  get filteredProducts(): Product[] {
    let filtered = this.products;
    // Filter by category
    filtered = filtered.filter(product => product.category === this.selectedCategory);
    // Filter by search term
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    return filtered;
  }
  selectCategory(categoryId: string): void {
    console.log('Category selected:', categoryId);
    this.selectedCategory = categoryId;
    this.loadProducts(); // โหลดสินค้าใหม่เมื่อเปลี่ยนหมวดหมู่
  }
  getCategoryName(): string {
    const category = this.categories.find(cat => cat.id === this.selectedCategory);
    return category ? category.name : 'อาหารทะเล';
  }
  selectProduct(product: Product): void {
    if (product.inStock) {
      this.cartService.addToCart(product);
      // Use shared ToastService for consistent notifications
      this.toastService.success('เพิ่ม "' + product.product_name + '" ลงตะกร้าแล้ว!');
    }
  }
  // เช็คว่าสินค้าอยู่ในตะกร้าหรือไม่
  isInCart(productId: string): boolean {
    return this.cartService.isInCart(productId);
  }
  // ดึงจำนวนสินค้าในตะกร้า
  getCartQuantity(productId: string): number {
    return this.cartService.getItemQuantity(productId);
  }
  onImageError(event: any): void {
    event.target.src = 'assets/placeholder.svg';
  }
}
