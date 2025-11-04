import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import logger from '../utils/logger';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private apiUrl = environment.apiUrl;

  // Steps: 1 = กรอกอีเมล, 2 = กรอก OTP, 3 = รีเซ็ตรหัสผ่าน
  step: number = 1;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  // ข้อมูลสำหรับกรอกอีเมล
  email: string = '';
  
  // ข้อมูลสำหรับกรอก OTP
  otp: string = '';
  
  // ข้อมูลสำหรับรีเซ็ตรหัสผ่าน
  newPassword: string = '';
  confirmPassword: string = '';
  
  // Debug OTP (จะได้จาก response - สำหรับ demo)
  debugOTP: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  // Step 1: ส่ง OTP ไปยังอีเมล
  sendOTP(): void {
    if (!this.email || !this.email.includes('@')) {
      this.toastService.error('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/forgot-password/send-otp`, {
      email: this.email
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.success('ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ');
        this.step = 2;
      },
      error: (error) => {
        this.isLoading = false;
        logger.error('Send OTP error:', error);
        this.toastService.error(error.error?.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
      }
    });
  }

  // Step 2: ตรวจสอบ OTP
  verifyOTP(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.toastService.error('กรุณากรอก OTP 6 หลัก');
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/forgot-password/verify-otp`, {
      email: this.email,
      otp: this.otp
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.verified) {
          this.toastService.success('ยืนยัน OTP สำเร็จ! กรุณาตั้งรหัสผ่านใหม่');
          this.step = 3;
        } else {
          this.toastService.error('OTP ไม่ถูกต้อง');
        }
      },
      error: (error) => {
        this.isLoading = false;
        logger.error('Verify OTP error:', error);
        this.toastService.error(error.error?.message || 'OTP ไม่ถูกต้องหรือหมดอายุ');
      }
    });
  }

  // Step 3: รีเซ็ตรหัสผ่านใหม่
  resetPassword(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.toastService.error('กรุณากรอกรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/forgot-password/reset-password`, {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastService.success('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        logger.error('Reset password error:', error);
        this.toastService.error(error.error?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    });
  }

  // ส่ง OTP ใหม่
  resendOTP(): void {
    this.otp = '';
    this.sendOTP();
  }

  // แสดง/ซ่อนรหัสผ่าน
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // กลับไปหน้า Login
  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  // จำกัดให้กรอกได้เฉพาะตัวเลข
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}
