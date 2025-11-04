import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ThailandAddressService, Province, District, SubDistrict } from '../services/thailand-address.service';
import logger from '../utils/logger';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api';
  private returnUrl: string = '/';
  
  // ข้อมูลที่อยู่ไทย
  provinces: Province[] = [];
  districts: District[] = [];
  subDistricts: SubDistrict[] = [];
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastService: ToastService,
    private addressService: ThailandAddressService
  ) {}
  ngOnInit(): void {
    // รับ returnUrl จาก query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // โหลดบัญชีที่จำไว้
    this.loadSavedAccounts();
    
    // โหลดข้อมูลจังหวัด
    this.loadProvinces();
  }
  
  // โหลดบัญชีที่จำไว้จาก localStorage
  loadSavedAccounts(): void {
    const saved = localStorage.getItem('savedAccounts');
    if (saved) {
      try {
        this.savedAccounts = JSON.parse(saved);
      } catch (e) {
        this.savedAccounts = [];
      }
    }
  }
  
  // บันทึกบัญชีใหม่
  saveAccount(email: string, password: string): void {
    // ตรวจสอบว่ามีอีเมลนี้อยู่แล้วหรือไม่
    const existingIndex = this.savedAccounts.findIndex(acc => acc.email === email);
    
    if (existingIndex >= 0) {
      // อัพเดทรหัสผ่าน
      this.savedAccounts[existingIndex].password = password;
    } else {
      // เพิ่มบัญชีใหม่
      this.savedAccounts.push({ email, password });
    }
    
    // บันทึกลง localStorage
    localStorage.setItem('savedAccounts', JSON.stringify(this.savedAccounts));
  }
  
  // ลบบัญชีที่จำไว้
  removeSavedAccount(email: string): void {
    this.savedAccounts = this.savedAccounts.filter(acc => acc.email !== email);
    localStorage.setItem('savedAccounts', JSON.stringify(this.savedAccounts));
  }
  
  // เมื่อเปลี่ยนอีเมล - ตรวจสอบว่ามีบัญชีนี้จำไว้หรือไม่
  onEmailChange(): void {
    const savedAccount = this.savedAccounts.find(acc => acc.email === this.loginData.email);
    if (savedAccount) {
      this.loginData.password = savedAccount.password;
      this.rememberMe = true;
    }
  }
  
  // แสดg/ซ่อนรายการบัญชีที่จำไว้
  toggleSavedAccounts(): void {
    this.showSavedAccounts = !this.showSavedAccounts;
  }
  
  // เลือกบัญชีที่จำไว้
  selectSavedAccount(account: {email: string, password: string}): void {
    this.loginData.email = account.email;
    this.loginData.password = account.password;
    this.rememberMe = true;
    this.showSavedAccounts = false;
  }
  
  // ปิด dropdown เมื่อคลิกที่อื่น
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    // ถ้าคลิกนอก input และ dropdown ให้ปิด dropdown
    if (!target.closest('.input-wrapper')) {
      this.showSavedAccounts = false;
    }
  }
  
  isLoginMode = true; // true = Login, false = Register
  isLoading = false;
  showPassword = false;
  rememberMe = false;
  savedAccounts: Array<{email: string, password: string}> = [];
  showSavedAccounts = false;
  registerStep = 1; // 1 = ข้อมูลส่วนตัว, 2 = ที่อยู่
  
  // Form data
  loginData = {
    email: '',
    password: ''
  };
  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    houseNumber: '',
    moo: '',
    soi: '',
    road: '',
    province: '',
    district: '',
    subDistrict: '',
    zipCode: ''
  };
  // Error messages
  errorMessage = '';
  successMessage = '';
  // แสดง/ซ่อน รหัสผ่าน
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  // ล้างข้อความ error/success
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
  // รีเซ็ตฟอร์ม
  resetForms(): void {
    this.loginData = { email: '', password: '' };
    this.registerData = { 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      phone: '', 
      houseNumber: '',
      moo: '',
      soi: '',
      road: '',
      province: '',
      district: '',
      subDistrict: '',
      zipCode: ''
    };
    this.districts = [];
    this.subDistricts = [];
    this.registerStep = 1; // รีเซ็ตกลับไป step 1
  }
  // ตรวจสอบข้อมูลอีเมล (แบบผ่อนปรน - ไม่ต้องเป็นอีเมลจริง)
  isValidEmail(email: string): boolean {
    // อนุญาตให้ใส่อะไรก็ได้ ตราบใดที่มี @ และมีอักษรอย่างน้อย 3 ตัว
    if (!email || email.length < 3 || !email.includes('@')) {
      return false;
    }
    return true;
  }
  // ตรวจสอบรหัสผ่าน
  isValidPassword(password: string): boolean {
    return password.length >= 6;
  }
  // ตรวจสอบเบอร์โทรศัพท์
  isValidPhone(phone: string): boolean {
    // ลบ - และ ช่องว่างออก
    const cleanPhone = phone.replace(/[-\s]/g, '');
    // ตรวจสอบว่าเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
  }
  // Login function
  onLogin(): void {
    this.clearMessages();
    // ตรวจสอบข้อมูล
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      return;
    }
    if (!this.isValidEmail(this.loginData.email)) {
      this.errorMessage = 'กรุณากรอกอีเมล (ต้องมี @)';
      return;
    }
    this.isLoading = true;
    // เรียก API เข้าสู่ระบบ
    logger.info('Sending login request (no password logged):', {
      email: this.loginData.email,
      apiUrl: `${this.apiUrl}/users/login`
    });
    this.http.post(`${this.apiUrl}/users/login`, {
      email: this.loginData.email,
      password: this.loginData.password
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'เข้าสู่ระบบสำเร็จ!';
        // บันทึกบัญชีถ้าเลือก "จดจำการเข้าสู่ระบบ"
        if (this.rememberMe) {
          this.saveAccount(this.loginData.email, this.loginData.password);
        } else {
          // ลบบัญชีออกถ้าไม่ต้องการจำ
          this.removeSavedAccount(this.loginData.email);
        }
        
        // บันทึกข้อมูลผู้ใช้ผ่าน AuthService
        const userData = {
          user_id: response.user_id,
          username: response.username,
          email: response.email,
          phone: response.phone,
          address: response.address,
          role: response.role,
          full_name: response.full_name || response.username
        };
        this.authService.login(userData);
        // ส่งสัญญาณให้ app component รู้ว่ามีการ login (รักษาไว้เพื่อ backward compatibility)
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'user',
          newValue: localStorage.getItem('user')
        }));
        // นำทางไปยังหน้าที่กำหนดหลังจาก 1 วินาที
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        logger.error('Login error:', error);
        this.errorMessage = error.error?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      }
    });
  }
  // ฟังก์ชันไปขั้นตอนถัดไป (Step 1 -> Step 2)
  goToAddressStep(): void {
    this.clearMessages();
    
    // ตรวจสอบข้อมูลส่วนตัว Step 1
    if (!this.registerData.name || !this.registerData.email || 
        !this.registerData.password || !this.registerData.confirmPassword ||
        !this.registerData.phone) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      return;
    }
    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'กรุณากรอกอีเมล (ต้องมี @)';
      return;
    }
    if (!this.isValidPassword(this.registerData.password)) {
      this.errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      return;
    }
    if (!this.isValidPhone(this.registerData.phone)) {
      this.errorMessage = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)';
      return;
    }
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return;
    }
    
    // ผ่านการตรวจสอบ ไป Step 2
    this.registerStep = 2;
    this.clearMessages();
  }
  
  // ฟังก์ชันย้อนกลับ (Step 2 -> Step 1)
  backToPersonalInfoStep(): void {
    this.registerStep = 1;
    this.clearMessages();
  }
  
  // Register function
  onRegister(): void {
    this.clearMessages();
    
    // สร้างที่อยู่แบบเต็ม
    const fullAddress = this.buildFullAddress();
    
    // ตรวจสอบข้อมูลที่อยู่ Step 2
    if (!this.registerData.houseNumber ||
        !this.registerData.province || !this.registerData.district ||
        !this.registerData.subDistrict || !this.registerData.zipCode) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน';
      return;
    }
    this.isLoading = true;
    // เรียก API สมัครสมาชิก
    this.http.post(`${this.apiUrl}/users/register`, {
      username: this.registerData.name,
      email: this.registerData.email,
      password: this.registerData.password,
      phone: this.registerData.phone.replace(/[-\s]/g, ''), // ลบ - และ ช่องว่างออก
      address: fullAddress
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ';
        // เปลี่ยนเป็น Login mode หลังสมัครสำเร็จ
        setTimeout(() => {
          this.isLoginMode = true;
          this.registerStep = 1; // รีเซ็ต step
          this.clearMessages();
          this.loginData.email = this.registerData.email;
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      }
    });
  }
  // ลืมรหัสผ่าน - นำไปหน้ารีเซ็ตรหัสผ่าน
  forgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // โหลดข้อมูลจังหวัด
  loadProvinces(): void {
    this.addressService.getProvinces().subscribe({
      next: (provinces) => {
        this.provinces = provinces;
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
      }
    });
  }

  // เมื่อเลือกจังหวัด
  onProvinceChange(): void {
    this.districts = [];
    this.subDistricts = [];
    this.registerData.district = '';
    this.registerData.subDistrict = '';
    this.registerData.zipCode = '';
    
    if (this.registerData.province) {
      this.addressService.getDistricts(+this.registerData.province).subscribe({
        next: (districts) => {
          this.districts = districts;
        },
        error: (error) => {
          console.error('Error loading districts:', error);
        }
      });
    }
  }

  // เมื่อเลือกอำเภอ
  onDistrictChange(): void {
    this.subDistricts = [];
    this.registerData.subDistrict = '';
    this.registerData.zipCode = '';
    
    if (this.registerData.district) {
      this.addressService.getSubDistricts(+this.registerData.district).subscribe({
        next: (subDistricts) => {
          this.subDistricts = subDistricts;
        },
        error: (error) => {
          console.error('Error loading sub-districts:', error);
        }
      });
    }
  }

  // เมื่อเลือกตำบล
  onSubDistrictChange(): void {
    if (this.registerData.subDistrict) {
      const subDistrict = this.subDistricts.find(sd => sd.id === +this.registerData.subDistrict);
      if (subDistrict) {
        this.registerData.zipCode = subDistrict.zip_code.toString();
      }
    }
  }

  // สร้างที่อยู่แบบเต็ม
  buildFullAddress(): string {
    const parts = [];
    
    if (this.registerData.houseNumber) parts.push(`บ้านเลขที่ ${this.registerData.houseNumber}`);
    if (this.registerData.moo) parts.push(`หมู่ ${this.registerData.moo}`);
    if (this.registerData.soi) parts.push(`ซอย ${this.registerData.soi}`);
    if (this.registerData.road) parts.push(`ถนน ${this.registerData.road}`);
    
    const subDistrict = this.subDistricts.find(sd => sd.id === +this.registerData.subDistrict);
    const district = this.districts.find(d => d.id === +this.registerData.district);
    const province = this.provinces.find(p => p.id === +this.registerData.province);
    
    if (subDistrict) parts.push(`ตำบล${subDistrict.name_th}`);
    if (district) parts.push(`อำเภอ${district.name_th}`);
    if (province) parts.push(`จังหวัด${province.name_th}`);
    if (this.registerData.zipCode) parts.push(this.registerData.zipCode);
    
    return parts.join(' ');
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
