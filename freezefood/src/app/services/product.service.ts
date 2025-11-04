import { Injectable } from '@angular/core';
import logger from '../utils/logger';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
export interface Product {
  product_id: string;   // เปลี่ยนเป็น string
  product_name: string;
  price: number;
  category_id: string;
  image: string;
  quantity: number;
  // สำหรับแสดงผลใน frontend
  category?: string;
  inStock?: boolean;
}
// Interface สำหรับ API response จาก backend
interface ApiProduct {
  product_id: string;   // เปลี่ยนเป็น string
  product_name: string;
  price: number;
  category_id: string;
  product_image: string;
  quantity: number;
}
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private baseUrl = this.apiUrl.replace(/\/api$/, '');
  constructor(private http: HttpClient) { }
  private getImageUrl(imagePath: string | undefined | null): string {
    if (!imagePath) return 'assets/placeholder.svg';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const clean = imagePath.startsWith('image/') ? imagePath : `image/${imagePath}`;
    return `${this.baseUrl}/${clean}`;
  }
  // แปลงข้อมูลจาก API format เป็น frontend format
  private mapApiProductToProduct(apiProduct: ApiProduct): Product {
    return {
      product_id: apiProduct.product_id,
      product_name: apiProduct.product_name,
      price: apiProduct.price,
      category_id: apiProduct.category_id,
      image: this.getImageUrl(apiProduct.product_image),
      quantity: apiProduct.quantity,
      inStock: apiProduct.quantity > 0,
      category: this.getCategoryName(apiProduct.category_id)
    };
  }
  // แปลง category_id เป็นชื่อหมวดหมู่
  // หมวดหมู่ใหม่จะใช้ category_id แบบ lowercase
  private getCategoryName(categoryId: any): string {
    const categoryMap: { [key: string]: string } = {
      'C001': 'seafood',    // อาหารทะเล
      'C002': 'meatballs',  // ลูกชิ้น
      'C003': 'pork',       // หมู  
      'C004': 'chicken',    // ไก่
      'C005': 'others',     // อื่นๆ
      'C006': 'beef'        // เนื้อวัว
    };
    // ถ้าไม่มีใน map ให้ใช้ category_id แบบ lowercase
    return categoryMap[categoryId] || categoryId.toLowerCase();
  }
  // ดึงสินค้าทั้งหมด
  getAllProducts(category?: string): Observable<Product[]> {
    const url = `${this.apiUrl}/products`;
    return this.http.get<ApiProduct[]>(url).pipe(
      map(apiProducts => {
        let products = apiProducts.map(product => this.mapApiProductToProduct(product));
        // กรองตามหมวดหมู่ถ้าระบุมา
        if (category && category !== 'all') {
          products = products.filter(product => product.category === category);
        }
        return products;
      }),
      catchError(error => {
  logger.error('Error fetching products:', error);
        return of([]); // Return empty array on error
      })
    );
  }
  // ดึงสินค้าตาม ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<ApiProduct>(`${this.apiUrl}/products/${id}`).pipe(
      map(apiProduct => this.mapApiProductToProduct(apiProduct)),
      catchError(error => {
  logger.error('Error fetching product:', error);
        throw error;
      })
    );
  }
  // ค้นหาสินค้า
  searchProducts(query: string): Observable<Product[]> {
    return this.getAllProducts().pipe(
      map(products => products.filter(product => 
        product.product_name.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }
  // เพิ่มสินค้า (สำหรับ admin)
  createProduct(product: Omit<Product, 'product_id'>): Observable<any> {
    const apiProduct = {
      product_name: product.product_name,
      category_id: product.category_id,
      price: product.price,
      quantity: product.quantity,
      product_image: product.image
    };
    return this.http.post(`${this.apiUrl}/products`, apiProduct);
  }
  // แก้ไขสินค้า (สำหรับ admin)
  updateProduct(id: number, product: Partial<Product>): Observable<any> {
    const apiProduct: any = {};
    if (product.product_name) apiProduct.product_name = product.product_name;
    if (product.category_id) apiProduct.category_id = product.category_id;
    if (product.price !== undefined) apiProduct.price = product.price;
    if (product.quantity !== undefined) apiProduct.quantity = product.quantity;
    if (product.image) apiProduct.product_image = product.image;
    return this.http.put(`${this.apiUrl}/products/${id}`, apiProduct);
  }
  // ลบสินค้า (สำหรับ admin)
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }
}
