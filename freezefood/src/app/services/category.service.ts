import { Injectable } from '@angular/core';
import logger from '../utils/logger';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
export interface Category {
  category_id: string;  // เปลี่ยนเป็น string
  category_name: string;
  // สำหรับแสดงผลใน frontend
  icon?: string;
}
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }
  // ดึงหมวดหมู่ทั้งหมด
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      map(categories => {
        // เพิ่ม icon ให้กับแต่ละหมวดหมู่
        return categories.map(category => ({
          ...category,
          icon: this.getCategoryIcon(category.category_id)
        }));
      }),
      catchError(error => {
  logger.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }
  // ดึงหมวดหมู่ตาม ID
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`).pipe(
      map(category => ({
        ...category,
        icon: this.getCategoryIcon(category.category_id)
      })),
      catchError(error => {
  logger.error('Error fetching category:', error);
        throw error;
      })
    );
  }
  // กำหนด icon ตาม category_id
  // หมวดหมู่ใหม่จะได้ icon เริ่มต้น
  private getCategoryIcon(categoryId: string): string {
    const iconMap: { [key: string]: string } = {
      'C001': '🦐', // อาหารทะเล
      'C002': '🍱', // ลูกชิ้น
      'C003': '🐷', // หมู
      'C004': '🐔', // ไก่
      'C005': '🍽️', // อื่นๆ
      'C006': '🐄', // เนื้อวัว
      // หมวดหมู่ใหม่จะใช้ icon เริ่มต้น '📦'
    };
    return iconMap[categoryId] || '📦';
  }
  // แปลง category_id เป็นชื่อภาษาอังกฤษสำหรับ filter
  // หมวดหมู่ใหม่จะใช้ category_id ตรงๆ เพื่อให้รองรับการเพิ่มหมวดหมู่อัตโนมัติ
  getCategoryKey(categoryId: string): string {
    const keyMap: { [key: string]: string } = {
      'C001': 'seafood',   // อาหารทะเล
      'C002': 'meatballs', // ลูกชิ้น
      'C003': 'pork',      // หมู
      'C004': 'chicken',   // ไก่
      'C005': 'others',    // อื่นๆ
      'C006': 'beef'       // เนื้อวัว
    };
    // ถ้าไม่มีใน map ให้ใช้ category_id แบบ lowercase แทน
    // เช่น C007 จะกลายเป็น 'c007' เพื่อไม่ให้ซ้ำกับหมวดหมู่อื่น
    return keyMap[categoryId] || categoryId.toLowerCase();
  }
  // เพิ่มหมวดหมู่ (สำหรับ admin)
  createCategory(category: Omit<Category, 'category_id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, category);
  }
  // แก้ไขหมวดหมู่ (สำหรับ admin)
  updateCategory(id: number, category: Partial<Category>): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, category);
  }
  // ลบหมวดหมู่ (สำหรับ admin)
  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }
}
