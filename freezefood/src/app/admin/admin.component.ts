import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  // Admin data
  allOrders: any[] = [];
  totalOrders = 0;
  selectedOrder: any = null;
  orderItems: any[] = [];
  outOfStockCount = 0;
  showOrderDetails = false;
  // Product management
  currentView = 'dashboard'; // dashboard, products
  allProducts: any[] = [];
  allCategories: any[] = [];
  // Stock management
  editingQuantity: { [productId: string]: number } = {};
  selectedProduct: any = null;
  
  // Stock Items management
  allStockItems: any[] = [];
  showStockItemForm = false;
  isEditModeStockItem = false;
  stockItemForm = {
    stockitem_id: '',
    product_id: '',
    quantity: 0,
    lot_number: '',
    expiry_date: '',
    storage_location: ''
  };
  showProductForm = false;
  isEditMode = false;
  showCategoryForm = false;
  isEditCategoryMode = false;
  selectedCategory: any = null;
  categoryFormSubmitted = false; // เพิ่มตัวแปรนี้
  categoryForm = {
    category_id: '',
    category_name: ''
  };
  productForm = {
    product_id: '',
    product_name: '',
    category_id: '',
    price: 0,
    quantity: 0,
    product_image: ''
  };
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  selectedPaymentStatus: string = 'unpaid';
  selectedOrderForStatusUpdate: any = null;
  selectedOrderStatus: string = 'pending';
  orderStatusFilter: string = 'all';
  private apiUrl = environment.apiUrl;
  currentUser: any = null;
  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) { }
  ngOnInit() {
    this.checkAdminAccess();
    this.loadAdminData();
    this.loadProducts();
    this.loadCategories();
  }

  // Show quick stock management view
  showStockManagement() {
    this.currentView = 'stock';
    this.showOrderDetails = false;
    this.showProductForm = false;
    this.showStockItemForm = false;
    this.loadStockItems();
    this.loadProducts();
  }
  checkAdminAccess() {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        this.currentUser = JSON.parse(userString);
        if (this.currentUser.role !== 'admin') {
          this.toastService.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ - เฉพาะผู้ค้าปลีกเท่านั้น');
          this.router.navigate(['/']);
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.router.navigate(['/login']);
        return;
      }
    } else {
  this.toastService.error('กรุณาเข้าสู่ระบบก่อน');
      this.router.navigate(['/login']);
      return;
    }
  }
  async loadAdminData() {
    try {
      const ordersResponse: any = await this.http.get(${this.apiUrl}/orders').toPromise();
      this.allOrders = (ordersResponse || []).filter((order: any) => 
        order.status === 'pending' || 
        (order.status === 'preparing' && order.payment_status === 'unpaid') ||
        (order.status === 'delivered' && order.payment_status === 'unpaid')
      );
      this.totalOrders = this.allOrders.length;
      console.log('Dashboard - Loaded orders:', this.allOrders.length, 'orders');
      console.log('Dashboard - Orders details:', this.allOrders.map(o => ({
        id: o.order_id, 
        status: o.status, 
        payment: o.payment_status
      })));
      // Calculate out of stock count
      this.outOfStockCount = 0;
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }
  async loadProducts() {
    try {
      const productsResponse: any = await this.http.get(${this.apiUrl}/products').toPromise();
      this.allProducts = productsResponse || [];
      // Calculate out of stock count
      this.outOfStockCount = this.allProducts.filter(product => product.quantity <= 0).length;
      // Initialize editing quantities if not present
      this.allProducts.forEach(p => {
        if (this.editingQuantity[p.product_id] === undefined) {
          this.editingQuantity[p.product_id] = p.quantity;
        }
      });
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  // Update single product stock (quantity) using existing update endpoint
  async updateStock(product: any) {
    if (!product || !product.product_id) return;
    const newQty = this.editingQuantity[product.product_id];
    if (newQty === undefined || newQty === null) {
      this.toastService.info('กรุณากรอกจำนวนที่ต้องการ');
      return;
    }
    try {
      const payload = {
        product_name: product.product_name,
        category_id: product.category_id,
        price: product.price,
        quantity: Number(newQty),
        product_image: product.product_image || ''
      };
      await this.http.put(`${this.apiUrl}/products/${product.product_id}`, payload).toPromise();
      this.toastService.success(`อัพเดตสต็อก ${product.product_name} เป็น ${newQty}`);
      // Refresh products
      await this.loadProducts();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      let msg = 'เกิดข้อผิดพลาดในการอัพเดตสต็อก';
      if (error.status === 0) msg = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      this.toastService.error(msg);
    }
  }

  // Save all modified quantities in bulk (one-by-one requests)
  async saveAllStockChanges() {
    const updates = [] as Array<{ product: any; qty: number }>;
    this.allProducts.forEach(p => {
      const newQty = this.editingQuantity[p.product_id];
      if (newQty !== undefined && Number(newQty) !== Number(p.quantity)) {
        updates.push({ product: p, qty: Number(newQty) });
      }
    });
    if (updates.length === 0) {
      this.toastService.info('ไม่มีการเปลี่ยนแปลงสต็อก');
      return;
    }
    try {
      // perform sequential updates to keep server load predictable
      for (const u of updates) {
        const payload = {
          product_name: u.product.product_name,
          category_id: u.product.category_id,
          price: u.product.price,
          quantity: u.qty,
          product_image: u.product.product_image || ''
        };
        await this.http.put(`${this.apiUrl}/products/${u.product.product_id}`, payload).toPromise();
      }
      this.toastService.success('อัพเดตสต็อกเรียบร้อย');
      await this.loadProducts();
    } catch (error) {
      console.error('Error saving bulk stock changes:', error);
      this.toastService.error('เกิดข้อผิดพลาดเมื่อบันทึกสต็อก');
    }
  }
  getOutOfStockProducts(): any[] {
    return this.allProducts.filter(product => product.quantity <= 0);
  }
  async loadCategories() {
    try {
      const categoriesResponse: any = await this.http.get(${this.apiUrl}/categories').toPromise();
      this.allCategories = categoriesResponse || [];
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  async viewOrderDetails(orderId: string) {
    try {
      // Get order details
      const orderResponse: any = await this.http.get(`${this.apiUrl}/orders/${orderId}`).toPromise();
      this.selectedOrder = orderResponse;
      // Get order items
      const itemsResponse: any = await this.http.get(`${this.apiUrl}/order-items/order/${orderId}`).toPromise();
      this.orderItems = itemsResponse || [];
      // Set selected payment status to current order status
      this.selectedPaymentStatus = orderResponse.payment_status || 'unpaid';
      // Show order details page without header
      this.showOrderDetails = true;
      this.currentView = 'orderDetails';
    } catch (error) {
      console.error('Error loading order details:', error);
  this.toastService.error('ไม่สามารถโหลดรายละเอียดออเดอร์ได้');
    }
  }
  getTotalOrderAmount(): number {
    return this.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  backToAdminDashboard() {
    this.showOrderDetails = false;
    this.selectedOrder = null;
    this.orderItems = [];
    this.currentView = 'dashboard';
    // Reload dashboard data to reflect any status changes
    this.loadAdminData();
  }
  async updatePaymentStatus() {
    if (!this.selectedOrder) return;
    try {
      console.log('Updating payment status:', this.selectedOrder.order_id, this.selectedPaymentStatus);
      const response = await this.http.put(`${this.apiUrl}/orders/${this.selectedOrder.order_id}/payment-status`, { payment_status: this.selectedPaymentStatus }).toPromise();
      console.log('Update response:', response);
  this.selectedOrder.payment_status = this.selectedPaymentStatus;
  this.toastService.success('อัพเดทสถานะการชำระเงินเรียบร้อย!');
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      let errorMessage = 'เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน';
      if (error.status === 404) {
        errorMessage = 'ไม่พบออเดอร์ที่ต้องการอัพเดท';
      } else if (error.status === 400) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง';
      } else if (error.status === 0) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่';
      }
  this.toastService.error(errorMessage);
    }
  }
  async confirmAllItemsDelivery() {
    if (this.orderItems.length === 0) {
      this.toastService.info('ไม่มีรายการสินค้าที่ต้องยืนยัน');
      return;
    }
    try {
      // ไม่ลบรายการสินค้า - เก็บไว้สำหรับการติดตาม
      // เปลี่ยนเฉพาะสถานะออเดอร์เป็น 'preparing'
      if (this.selectedOrder) {
        await this.http.put(`${this.apiUrl}/orders/${this.selectedOrder.order_id}/status`, { status: 'preparing' }).toPromise();
        // Update the order status locally
        this.selectedOrder.status = 'preparing';
        // Update the order in the list
        const orderIndex = this.allOrders.findIndex(order => order.order_id === this.selectedOrder.order_id);
        if (orderIndex !== -1) {
          this.allOrders[orderIndex].status = 'preparing';
        }
        this.toastService.success('ยืนยันออเดอร์เรียบร้อย! สถานะ: กำลังจัดเตรียมสินค้า\nรายการสินค้าถูกเก็บไว้สำหรับการติดตาม');
      }
      // Go back to dashboard (แต่ไม่ clear รายการสินค้า)
      this.backToAdminDashboard();
    } catch (error) {
      console.error('Error confirming order:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการยืนยันออเดอร์: ' + JSON.stringify(error));
    }
  }
  adminLogout() {
    // Check if this is opened in a new window/tab
    if (window.opener) {
      // This was opened in a new window, close it
      window.close();
    } else {
      // This is the main window, navigate back to main app
      window.location.href = '/';
    }
  }
  // Navigation methods
  showDashboard() {
    this.currentView = 'dashboard';
    this.showOrderDetails = false;
    this.showProductForm = false;
    // Reload dashboard data to ensure latest order status
    this.loadAdminData();
  }
  showProductManagement() {
    this.currentView = 'products';
    this.showOrderDetails = false;
    this.showProductForm = false;
    this.loadProducts();
  }
  showDeliveryManagement() {
    this.currentView = 'delivery';
    this.showOrderDetails = false;
    this.showProductForm = false;
    // Reset filter to show all orders
    this.orderStatusFilter = 'all';
    this.selectedOrderForStatusUpdate = null;
    // Load all orders for delivery management (including preparing and delivered)
    this.loadAllOrdersForDelivery();
  }
  async loadAllOrdersForDelivery() {
    try {
      const ordersResponse: any = await this.http.get(${this.apiUrl}/orders').toPromise();
      // For delivery management, show all orders regardless of status
      this.allOrders = ordersResponse || [];
      console.log('Loaded orders for delivery:', this.allOrders.length);
    } catch (error) {
      console.error('Error loading all orders for delivery:', error);
    }
  }
  // Product management methods
  async showAddProductForm() {
    this.isEditMode = false;
    this.showProductForm = true;
    this.showCategoryForm = false; // ปิดฟอร์มหมวดหมู่
    
    // สร้าง Product ID อัตโนมัติ
    const newProductId = await this.generateProductId();
    
    this.productForm = {
      product_id: newProductId,
      product_name: '',
      category_id: '',
      price: 0,
      quantity: 0,
      product_image: ''
    };
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }
  
  async generateProductId(): Promise<string> {
    try {
      const products: any = await this.http.get(${this.apiUrl}/products').toPromise();
      
      let maxNumber = 0;
      products.forEach((product: any) => {
        if (product.product_id && product.product_id.startsWith('P')) {
          const num = parseInt(product.product_id.substring(1));
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      return 'P' + (maxNumber + 1).toString().padStart(3, '0');
    } catch (error) {
      console.error('Error generating product ID:', error);
      return 'P001'; // fallback
    }
  }

  async generateStockItemId(): Promise<string> {
    try {
      // หา stock item id ที่ใหญ่ที่สุด
      let maxNumber = 0;
      this.allStockItems.forEach((item: any) => {
        if (item.stockitem_id && item.stockitem_id.startsWith('SI')) {
          const num = parseInt(item.stockitem_id.substring(2));
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      return 'SI' + (maxNumber + 1).toString().padStart(3, '0');
    } catch (error) {
      console.error('Error generating stock item ID:', error);
      return 'SI001'; // fallback
    }
  }

  editProduct(product: any) {
    this.isEditMode = true;
    this.showProductForm = true;
    this.showCategoryForm = false; // ปิดฟอร์มหมวดหมู่
    this.selectedProduct = product;
    this.productForm = { ...product };
    this.selectedImageFile = null;
    // Set preview to existing image if available
    if (product.product_image) {
      this.imagePreviewUrl = `${this.apiUrl.replace('/api', '')}/${product.product_image}`;
    } else {
      this.imagePreviewUrl = null;
    }
  }
  async saveProduct() {
    try {
      // ถ้ามีไฟล์รูปภาพใหม่ ให้อัพโหลดก่อน
      if (this.selectedImageFile) {
        const uploadedPath = await this.uploadImageFile(this.selectedImageFile);
        if (uploadedPath) {
          this.productForm.product_image = uploadedPath;
        }
      }
      
      // บันทึกข้อมูลสินค้า
      if (this.isEditMode) {
        await this.http.put(`${this.apiUrl}/products/${this.selectedProduct.product_id}`, this.productForm).toPromise();
        this.toastService.success('แก้ไขสินค้าเรียบร้อย!');
      } else {
        await this.http.post(${this.apiUrl}/products', this.productForm).toPromise();
        this.toastService.success('เพิ่มสินค้าเรียบร้อย!');
      }
      
      await this.loadProducts();
      await this.loadStockItems();
      this.cancelProductForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMsg = error?.error?.message || error?.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า';
      this.toastService.error(errorMsg);
    }
  }
  
  async uploadImageFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // ส่งไปยัง backend upload endpoint
      const response: any = await this.http.post(${this.apiUrl}/upload', formData).toPromise();
      console.log('Image uploaded successfully:', response);
      
      // Return path ที่ backend ส่งกลับมา
      return response.filePath || response.filename;
    } catch (error) {
      console.error('Error uploading image:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      return null;
    }
  }

  async createNewCategory(categoryName: string): Promise<string | null> {
    try {
      // ดึง category_id ล่าสุด
      const categories: any = await this.http.get(${this.apiUrl}/categories').toPromise();
      
      let maxNumber = 0;
      categories.forEach((cat: any) => {
        if (cat.category_id && cat.category_id.startsWith('C')) {
          const num = parseInt(cat.category_id.substring(1));
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const newCategoryId = 'C' + (maxNumber + 1).toString().padStart(3, '0');

      // สร้างหมวดหมู่ใหม่
      await this.http.post(${this.apiUrl}/categories', {
        category_id: newCategoryId,
        category_name: categoryName
      }).toPromise();

      this.toastService.success(`สร้างหมวดหมู่ "${categoryName}" เรียบร้อย!`);
      
      // โหลดหมวดหมู่ใหม่
      await this.loadCategories();
      
      return newCategoryId;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  async deleteProduct(productId: string) {
    // แสดง custom confirmation dialog ก่อนลบ
    const confirmed = await this.toastService.confirm(
      'คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?',
      'ยืนยันการทำรายการ'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await this.http.delete(`${this.apiUrl}/products/${productId}`).toPromise();
      this.toastService.success('ลบสินค้าเรียบร้อย!');
      await this.loadProducts();
      await this.loadStockItems(); // โหลดข้อมูล Stock Items ใหม่เพื่ออัพเดทจำนวน
    } catch (error: any) {
      console.error('Error deleting product:', error);
      let errorMsg = 'เกิดข้อผิดพลาดในการลบสินค้า';
      
      if (error.status === 0) {
        errorMsg = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาเช็คว่า backend ทำงานอยู่';
      } else if (error.status === 400 && error.error && error.error.error) {
        errorMsg = error.error.error;
      } else if (error.status === 500) {
        errorMsg = 'เกิดข้อผิดพลาดในการลบสินค้า';
      }
      
      this.toastService.error(errorMsg);
    }
  }
  cancelProductForm() {
    this.showProductForm = false;
    this.selectedProduct = null;
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  // Category management methods
  showCategoryManagement() {
    this.showAddCategoryForm();
  }

  showAddCategoryForm() {
    this.showCategoryForm = true;
    this.showProductForm = false; // ปิดฟอร์มสินค้า
    this.isEditCategoryMode = false;
    this.categoryFormSubmitted = false; // Reset submitted state
    this.categoryForm = {
      category_id: '',
      category_name: ''
    };
  }

  editCategory(category: any) {
    this.showCategoryForm = true;
    this.showProductForm = false; // ปิดฟอร์มสินค้า
    this.isEditCategoryMode = true;
    this.selectedCategory = category;
    this.categoryForm = { ...category };
  }

  async saveCategory() {
    // ตั้งค่า submitted เป็น true เมื่อกดปุ่ม
    this.categoryFormSubmitted = true;
    
    try {
      // ตรวจสอบว่ากรอกชื่อหมวดหมู่หรือไม่
      if (!this.categoryForm.category_name || !this.categoryForm.category_name.trim()) {
        // ไม่ต้องแสดง toast - ให้แสดงในฟอร์มแทน
        return;
      }

      if (this.isEditCategoryMode) {
        // แก้ไขหมวดหมู่
        await this.http.put(
          `${this.apiUrl}/categories/${this.selectedCategory.category_id}`,
          { category_name: this.categoryForm.category_name }
        ).toPromise();
        this.toastService.success('แก้ไขหมวดหมู่เรียบร้อย!');
      } else {
        // เพิ่มหมวดหมู่ใหม่
        const categories: any = await this.http.get(${this.apiUrl}/categories').toPromise();
        
        let maxNumber = 0;
        categories.forEach((cat: any) => {
          if (cat.category_id && cat.category_id.startsWith('C')) {
            const num = parseInt(cat.category_id.substring(1));
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        });

        const newCategoryId = 'C' + (maxNumber + 1).toString().padStart(3, '0');

        await this.http.post(${this.apiUrl}/categories', {
          category_id: newCategoryId,
          category_name: this.categoryForm.category_name
        }).toPromise();

        this.toastService.success('เพิ่มหมวดหมู่เรียบร้อย!');
      }

      await this.loadCategories();
      // Reset form และ submitted state
      this.categoryFormSubmitted = false;
      this.isEditCategoryMode = false;
      this.categoryForm = {
        category_id: '',
        category_name: ''
      };
    } catch (error) {
      console.error('Error saving category:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    }
  }

  async deleteCategory(categoryId: string) {
    // แสดง custom confirmation dialog ก่อนลบ
    const confirmed = await this.toastService.confirm(
      'คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?',
      'ยืนยันการทำรายการ'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await this.http.delete(`${this.apiUrl}/categories/${categoryId}`).toPromise();
      this.toastService.success('ลบหมวดหมู่เรียบร้อย!');
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      let errorMsg = 'เกิดข้อผิดพลาดในการลบหมวดหมู่';
      
      if (error.status === 0) {
        errorMsg = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาเช็คว่า backend ทำงานอยู่';
      } else if (error.status === 400 && error.error && error.error.error) {
        // แสดงข้อความจาก backend
        errorMsg = error.error.error;
      } else if (error.status === 500) {
        errorMsg = 'เกิดข้อผิดพลาดในการลบหมวดหมู่';
      }
      
      this.toastService.error(errorMsg);
    }
  }

  cancelCategoryForm() {
    this.showCategoryForm = false;
    this.selectedCategory = null;
    this.isEditCategoryMode = false;
    this.categoryFormSubmitted = false; // Reset submitted state
    this.categoryForm = {
      category_id: '',
      category_name: ''
    };
  }

  // Image handling methods
  onImageFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
      if (!file.type.startsWith('image/')) {
        this.toastService.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        event.target.value = '';
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        event.target.value = '';
        return;
      }
      
      this.selectedImageFile = file;
      this.productForm.product_image = file.name;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  removeSelectedImage() {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.productForm.product_image = '';
    
    // Reset file input
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  // ฟังก์ชันตรวจสอบว่าฟอร์มกรอกครบหรือไม่
  isFormValid(): boolean {
    const form = this.productForm;
    
    // ตรวจสอบฟิลด์ทั้งหมด
    if (!form.product_id || !form.product_name || !form.category_id) {
      return false;
    }
    
    if (form.price === null || form.price === undefined || form.price <= 0) {
      return false;
    }
    
    if (form.quantity === null || form.quantity === undefined || form.quantity < 0) {
      return false;
    }
    
    // ถ้าเป็นโหมดเพิ่มใหม่ ต้องมีรูปภาพ
    if (!this.isEditMode && !this.selectedImageFile) {
      return false;
    }
    
    // ถ้าเป็นโหมดแก้ไข ต้องมีรูปภาพเดิมหรือเลือกรูปใหม่
    if (this.isEditMode && !form.product_image && !this.selectedImageFile) {
      return false;
    }
    
    return true;
  }
  getCategoryName(categoryId: string): string {
    const category = this.allCategories.find(cat => cat.category_id === categoryId);
    return category ? category.category_name : categoryId;
  }
  getImageUrl(imageName: string): string {
    // Remove 'image/' prefix if it exists, since backend already serves from /image/ route
    const cleanImageName = imageName.startsWith('image/') ? imageName.substring(6) : imageName;
    const baseUrl = ${this.apiUrl.replace('/api', '')}/image/';
    return baseUrl + cleanImageName;
  }

  getPaymentProofUrl(paymentProofPath: string): string {
    if (!paymentProofPath) return '';
    // If path already starts with http, return as is
    if (paymentProofPath.startsWith('http')) {
      return paymentProofPath;
    }
    // If path starts with /, prepend base URL
    if (paymentProofPath.startsWith('/')) {
      return this.apiUrl.replace('/api', '') + paymentProofPath;
    }
    // Otherwise, assume it's a relative path
    return ${this.apiUrl.replace('/api', '')}/' + paymentProofPath;
  }

  getProductById(productId: string): any {
    return this.allProducts.find(p => p.product_id === productId);
  }

  // ============= Stock Items Management =============
  
  async loadStockItems() {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/stock-items`).toPromise();
      this.allStockItems = response || [];
      console.log('✅ Stock items loaded:', this.allStockItems.length, 'items');
    } catch (error) {
      console.error('❌ Error loading stock items:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Stock Items');
    }
  }

  showAddStockItemForm() {
    this.isEditModeStockItem = false;
    this.showStockItemForm = true;
    this.stockItemForm = {
      stockitem_id: '',
      product_id: '',
      quantity: 0,
      lot_number: '',
      expiry_date: '',
      storage_location: ''
    };
  }

  // ฟังก์ชันที่เรียกเมื่อเลือก Product ID
  onProductSelect() {
    if (this.stockItemForm.product_id) {
      const selectedProduct = this.allProducts.find(p => p.product_id === this.stockItemForm.product_id);
      if (selectedProduct) {
        // ดึงจำนวนสินค้ามาใส่ให้อัตโนมัติ
        this.stockItemForm.quantity = selectedProduct.quantity || 0;
      }
    }
  }

  editStockItem(stockItem: any) {
    this.isEditModeStockItem = true;
    this.showStockItemForm = true;
    this.stockItemForm = {
      stockitem_id: stockItem.stockitem_id,
      product_id: stockItem.product_id,
      quantity: stockItem.quantity,
      lot_number: stockItem.lot_number || '',
      expiry_date: stockItem.expiry_date ? stockItem.expiry_date.substring(0, 10) : '',
      storage_location: stockItem.storage_location || ''
    };
  }

  async saveStockItem() {
    try {
      // ถ้าเป็นการเพิ่มใหม่ ให้สร้าง Stock Item ID อัตโนมัติ
      if (!this.isEditModeStockItem) {
        this.stockItemForm.stockitem_id = await this.generateStockItemId();
      }

      // ตรวจสอบตำแหน่งจัดเก็บซ้ำ (เฉพาะตอนสร้างใหม่)
      if (!this.isEditModeStockItem) {
        const duplicateLocation = this.allStockItems.find(
          item => item.storage_location.toLowerCase() === this.stockItemForm.storage_location.toLowerCase()
        );
        
        if (duplicateLocation) {
          this.toastService.error(`ตำแหน่งจัดเก็บ "${this.stockItemForm.storage_location}" ถูกใช้งานแล้ว (Stock ID: ${duplicateLocation.stockitem_id})`);
          return;
        }
      } else {
        // ตอนแก้ไข ตรวจสอบว่าไม่ซ้ำกับตำแหน่งอื่น (ยกเว้นตัวเอง)
        const duplicateLocation = this.allStockItems.find(
          item => item.storage_location.toLowerCase() === this.stockItemForm.storage_location.toLowerCase() 
                  && item.stockitem_id !== this.stockItemForm.stockitem_id
        );
        
        if (duplicateLocation) {
          this.toastService.error(`ตำแหน่งจัดเก็บ "${this.stockItemForm.storage_location}" ถูกใช้งานแล้ว (Stock ID: ${duplicateLocation.stockitem_id})`);
          return;
        }
      }
      
      if (this.isEditModeStockItem) {
        // Update
        await this.http.put(`${this.apiUrl}/stock-items/${this.stockItemForm.stockitem_id}`, this.stockItemForm).toPromise();
        this.toastService.success('อัพเดต Stock Item เรียบร้อย');
      } else {
        // Create
        await this.http.post(`${this.apiUrl}/stock-items`, this.stockItemForm).toPromise();
        this.toastService.success('เพิ่ม Stock Item เรียบร้อย');
      }
      this.cancelStockItemForm();
      await this.loadStockItems();
      await this.loadProducts(); // โหลดข้อมูลสินค้าใหม่เพื่ออัพเดทจำนวน
    } catch (error: any) {
      console.error('Error saving stock item:', error);
      this.toastService.error(error.error?.error || 'เกิดข้อผิดพลาดในการบันทึก Stock Item');
    }
  }

  async deleteStockItem(stockItemId: string) {
    const confirmDelete = await this.toastService.confirm('คุณต้องการลบ Stock Item นี้หรือไม่?');
    if (!confirmDelete) {
      return;
    }
    try {
      await this.http.delete(`${this.apiUrl}/stock-items/${stockItemId}`).toPromise();
      this.toastService.success('ลบ Stock Item เรียบร้อย');
      await this.loadStockItems();
      await this.loadProducts(); // โหลดข้อมูลสินค้าใหม่เพื่ออัพเดทจำนวน
    } catch (error) {
      console.error('Error deleting stock item:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการลบ Stock Item');
    }
  }

  cancelStockItemForm() {
    this.showStockItemForm = false;
    this.stockItemForm = {
      stockitem_id: '',
      product_id: '',
      quantity: 0,
      lot_number: '',
      expiry_date: '',
      storage_location: ''
    };
  }
  onImageError(event: any): void {
    // Hide the broken image and show placeholder
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div style="width: 50px; height: 50px; background: #2d3748;  display: flex; align-items: center; justify-content: center; border: 1px solid #4a5568;">
          <span style="color: #f56565; font-size: 10px;">Error</span>
        </div>
      `;
    }
  }
  onImageLoad(event: any): void {
    // Image loaded successfully
    console.log('Image loaded:', event.target.src);
  }
  getProductName(productId: string): string {
    const product = this.allProducts.find(p => p.product_id === productId);
    return product ? product.product_name : productId;
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'preparing': return 'กำลังจัดเตรียมสินค้า';
      case 'delivered': return 'จัดส่งแล้ว';
      case 'cancelled': return 'ยกเลิก';
      case 'all': return 'ทั้งหมด';
      default: return status;
    }
  }
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#fbb924';      // เหลือง - รอดำเนินการ
      case 'preparing': return '#3182ce';    // น้ำเงิน - กำลังจัดเตรียม
      case 'delivered': return '#68d391';    // เขียว - จัดส่งแล้ว
      case 'cancelled': return '#f56565';    // แดง - ยกเลิก
      default: return '#e2e8f0';             // เทา - อื่นๆ
    }
  }
  getOrderCountByStatus(status: string): number {
    return this.allOrders.filter(order => order.status === status).length;
  }
  getUnpaidOrdersCount(): number {
    return this.allOrders.filter(order => order.payment_status === 'unpaid').length;
  }
  getPaidOrdersCount(): number {
    return this.allOrders.filter(order => order.payment_status === 'paid').length;
  }
  getPendingUnpaidCount(): number {
    return this.allOrders.filter(order => order.status === 'pending' && order.payment_status === 'unpaid').length;
  }
  getPreparingUnpaidCount(): number {
    return this.allOrders.filter(order => order.status === 'preparing' && order.payment_status === 'unpaid').length;
  }
  filterOrdersByStatus(status: string) {
    this.orderStatusFilter = status;
  }
  getFilteredOrders(): any[] {
    if (this.orderStatusFilter === 'all') {
      // แสดงออเดอร์ทั้งหมด (ไม่กรอง)
      return this.allOrders;
    }
    return this.allOrders.filter(order => order.status === this.orderStatusFilter);
  }
  selectOrderForUpdate(order: any) {
    this.selectedOrderForStatusUpdate = order;
    this.selectedOrderStatus = order.status;
  }
  async updateOrderStatusInDelivery() {
    if (!this.selectedOrderForStatusUpdate) {
  this.toastService.info('กรุณาเลือกออเดอร์ก่อน');
      return;
    }
    
    // ตรวจสอบว่าออเดอร์จัดส่งแล้วหรือไม่
    if (this.selectedOrderForStatusUpdate.status === 'delivered') {
      this.toastService.error('ไม่สามารถเปลี่ยนสถานะของออเดอร์ที่จัดส่งแล้ว');
      return;
    }
    
    const oldStatus = this.selectedOrderForStatusUpdate.status;
    const newStatus = this.selectedOrderStatus;
    if (oldStatus === newStatus) {
  this.toastService.info('สถานะปัจจุบันเหมือนกับสถานะใหม่แล้ว');
      return;
    }
    try {
      console.log('Updating order status:', this.selectedOrderForStatusUpdate.order_id, newStatus);
      await this.http.put(`${this.apiUrl}/orders/${this.selectedOrderForStatusUpdate.order_id}/status`, { status: newStatus }).toPromise();
      // Update local order data
      this.selectedOrderForStatusUpdate.status = newStatus;
      // Refresh orders list
      await this.loadAllOrdersForDelivery();
      // Reset selection if the updated order no longer matches current filter
      if (this.orderStatusFilter !== 'all' && this.orderStatusFilter !== newStatus) {
        this.selectedOrderForStatusUpdate = null;
      }
  this.toastService.success(`อัพเดตสถานะออเดอร์เรียบร้อย!\nเปลี่ยนจาก: ${this.getStatusText(oldStatus)} → ${this.getStatusText(newStatus)}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      let errorMessage = 'เกิดข้อผิดพลาดในการอัพเดตสถานะออเดอร์';
      if (error.status === 404) {
        errorMessage = 'ไม่พบออเดอร์ที่ต้องการอัพเดต';
      } else if (error.status === 400) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง';
      } else if (error.status === 0) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      }
  this.toastService.error(errorMessage);
    }
  }
  // ฟังก์ชันจัดการ Orders ที่ขาดหายไป
  // สร้าง Order ใหม่
  async createNewOrder(orderData: any) {
    try {
      const response = await this.http.post(`${this.apiUrl}/orders`, orderData).toPromise();
      console.log('Order created:', response);
  this.toastService.success('สร้างออเดอร์ใหม่เรียบร้อย!');
      this.loadAdminData(); // Reload data
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการสร้างออเดอร์');
      throw error;
    }
  }
  // แก้ไข Order
  async updateOrder(orderId: string, orderData: any) {
    try {
      const response = await this.http.put(`${this.apiUrl}/orders/${orderId}`, orderData).toPromise();
      console.log('Order updated:', response);
      this.toastService.success('แก้ไขออเดอร์เรียบร้อย!');
      this.loadAdminData(); // Reload data
      return response;
    } catch (error) {
      console.error('Error updating order:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการแก้ไขออเดอร์');
      throw error;
    }
  }
  // ลบ Order
  async deleteOrder(orderId: string) {
    const ok = await this.toastService.confirm('คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้?');
    if (!ok) return;
    try {
      await this.http.delete(`${this.apiUrl}/orders/${orderId}`).toPromise();
      console.log('Order deleted:', orderId);
      this.toastService.success('ลบออเดอร์เรียบร้อย!');
      this.loadAdminData(); // Reload data
      // ถ้าอยู่ในหน้า order details ให้กลับไปหน้า dashboard
      if (this.selectedOrder && this.selectedOrder.order_id === orderId) {
        this.backToAdminDashboard();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการลบออเดอร์');
    }
  }
  // ฟังก์ชันจัดการ Order Items ที่ขาดหายไป
  // ดึง Order Items ทั้งหมด
  async loadAllOrderItems() {
    try {
      const response = await this.http.get(`${this.apiUrl}/order-items`).toPromise();
      return response;
    } catch (error) {
      console.error('Error loading all order items:', error);
      throw error;
    }
  }
  // สร้าง Order Item ใหม่
  async createOrderItem(itemData: any) {
    try {
      const response = await this.http.post(`${this.apiUrl}/order-items`, itemData).toPromise();
      console.log('Order item created:', response);
      this.toastService.success('เพิ่มรายการสินค้าเรียบร้อย!');
      // Reload order items สำหรับออเดอร์ปัจจุบัน
      if (this.selectedOrder) {
        const itemsResponse: any = await this.http.get(`${this.apiUrl}/order-items/order/${this.selectedOrder.order_id}`).toPromise();
        this.orderItems = itemsResponse || [];
      }
      return response;
    } catch (error) {
      console.error('Error creating order item:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า');
      throw error;
    }
  }
  // แก้ไข Order Item
  async updateOrderItem(itemId: string, itemData: any) {
    try {
      const response = await this.http.put(`${this.apiUrl}/order-items/${itemId}`, itemData).toPromise();
      console.log('Order item updated:', response);
      this.toastService.success('แก้ไขรายการสินค้าเรียบร้อย!');
      // Reload order items สำหรับออเดอร์ปัจจุบัน
      if (this.selectedOrder) {
        const itemsResponse: any = await this.http.get(`${this.apiUrl}/order-items/order/${this.selectedOrder.order_id}`).toPromise();
        this.orderItems = itemsResponse || [];
      }
      return response;
    } catch (error) {
      console.error('Error updating order item:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการแก้ไขรายการสินค้า');
      throw error;
    }
  }
  // ลบ Order Item แบบเดี่ยว (นอกเหนือจาก confirmItemDelivery)
  async deleteOrderItem(itemId: string) {
    const ok = await this.toastService.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการสินค้านี้?');
    if (!ok) return;
    try {
      await this.http.delete(`${this.apiUrl}/order-items/${itemId}`).toPromise();
      console.log('Order item deleted:', itemId);
      this.toastService.success('ลบรายการสินค้าเรียบร้อย!');
      // Remove from current orderItems array
      this.orderItems = this.orderItems.filter(item => item.orderitem_id !== itemId);
    } catch (error) {
      console.error('Error deleting order item:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการลบรายการสินค้า');
    }
  }
  // ฟังก์ชันเสริมสำหรับการจัดการข้อมูล
  // ดึงข้อมูล Order พร้อม Items
  async getOrderWithItems(orderId: string) {
    try {
      const orderResponse: any = await this.http.get(`${this.apiUrl}/orders/${orderId}`).toPromise();
      const itemsResponse: any = await this.http.get(`${this.apiUrl}/order-items/order/${orderId}`).toPromise();
      return {
        order: orderResponse,
        items: itemsResponse || []
      };
    } catch (error) {
      console.error('Error getting order with items:', error);
      throw error;
    }
  }
  // คำนวณยอดรวมของ Order
  calculateOrderTotal(items: any[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  // ตรวจสอบว่า Order มี Items หรือไม่
  hasOrderItems(orderId: string): boolean {
    return this.orderItems.length > 0;
  }
  // ฟังก์ชันสำหรับ UI Support
  // แสดงฟอร์มแก้ไข Order
  showEditOrderForm(order: any) {
    // Open the order details view so admin can edit the order
    if (order && order.order_id) {
      // reuse existing method to fetch and show details
      this.viewOrderDetails(order.order_id);
    } else {
      // Fallback: set selection and log
      this.selectedOrder = order;
      console.log('Editing order (no id):', order);
      this.showOrderDetails = true;
      this.currentView = 'orderDetails';
    }
  }
  // แสดงฟอร์มเพิ่ม Order Item
  showAddOrderItemForm() {
    if (!this.selectedOrder) {
      this.toastService.info('กรุณาเลือกออเดอร์ก่อน');
      return;
    }
    // สามารถเพิ่ม UI form สำหรับเพิ่ม order item ได้ที่นี่
    console.log('Adding item to order:', this.selectedOrder.order_id);
  }
  // รีเฟรชข้อมูล Orders ทั้งหมด
  async refreshAllData() {
    try {
      await this.loadAdminData();
      if (this.currentView === 'delivery') {
        await this.loadAllOrdersForDelivery();
      }
      console.log('All data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
    }
  }
}

