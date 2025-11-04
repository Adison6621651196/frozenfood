import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
export interface User {
  user_id: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  full_name?: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  constructor() {
    // ตรวจสอบข้อมูลผู้ใช้จาก localStorage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  // เข้าสู่ระบบ
  login(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
  // ออกจากระบบ
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
  // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
  isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }
  // อัปเดตข้อมูลผู้ใช้
  updateUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
