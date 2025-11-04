import { Component, OnInit } from '@angular/core';
import logger from '../utils/logger';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { ThailandAddressService, Province, District, SubDistrict } from '../services/thailand-address.service';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  userProfile: any = {
    username: '',
    email: '',
    phone: '',
    address: '',
    houseNumber: '',
    moo: '',
    soi: '',
    road: '',
    province: '',
    district: '',
    subDistrict: '',
    zipCode: ''
  };
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  orderStats = {
    total: 0,
    completed: 0,
    totalSpent: 0
  };
  recentOrders: any[] = [];
  
  // ข้อมูลที่อยู่ไทย
  provinces: Province[] = [];
  districts: District[] = [];
  subDistricts: SubDistrict[] = [];
  
  constructor(
    private http: HttpClient, 
    private toastService: ToastService,
    private addressService: ThailandAddressService
  ) { }
  ngOnInit(): void {
    this.loadUserProfile();
    this.loadOrderStats();
    this.loadRecentOrders();
    this.loadProvinces();
  }
  getInitials(): string {
    if (!this.userProfile.username) return 'U';
    const names = this.userProfile.username.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.userProfile.username[0].toUpperCase();
  }
  loadUserProfile(): void {
    // Load from localStorage or API
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userProfile = {
        username: currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        houseNumber: '',
        moo: '',
        soi: '',
        road: '',
        province: '',
        district: '',
        subDistrict: '',
        zipCode: ''
      };
      
      // ถ้ามีที่อยู่เดิม ให้แสดงใน placeholder หรือ note
      if (currentUser.address) {
        // แสดงที่อยู่เดิมให้ user เห็น แต่ให้กรอกใหม่ด้วย dropdown
        console.log('ที่อยู่เดิม:', currentUser.address);
      }
    }
  }
  loadOrderStats(): void {
    // Mock data - replace with actual API call
    this.orderStats = {
      total: 15,
      completed: 12,
      totalSpent: 2450
    };
  }
  loadRecentOrders(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.user_id) {
  // no user logged in
      return;
    }

    // เรียก API เพื่อดึง 3 ออเดอร์ล่าสุด
    this.http.get<any[]>(`${this.apiUrl}/orders/user/${currentUser.user_id}`)
      .subscribe({
        next: (orders) => {
          // เอาแค่ 3 ออเดอร์ล่าสุด
          this.recentOrders = orders.slice(0, 3);
          // recent orders loaded
        },
        error: (error) => {
          logger.error('Failed to load recent orders:', error);
          this.recentOrders = [];
        }
      });
  }
  updateProfile(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.user_id) {
      this.toastService.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    // สร้างที่อยู่แบบเต็ม
    const fullAddress = this.buildFullAddress();

    // เรียก API เพื่ออัพเดตข้อมูล
    this.http.put(`${this.apiUrl}/users/${currentUser.user_id}`, {
      username: this.userProfile.username,
      email: this.userProfile.email,
      phone: this.userProfile.phone,
      address: fullAddress
    }).subscribe({
      next: (response) => {
        // อัพเดต localStorage
        const updatedUser = { ...currentUser, ...this.userProfile };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
  // แสดงข้อความสำเร็จ
  this.toastService.success('บันทึกข้อมูลเรียบร้อยแล้ว');
        logger.info('Profile updated successfully');
      },
      error: (error) => {
        logger.error('Failed to update profile:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.error?.error || error.message));
      }
    });
  }
  changePassword(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.user_id) {
      this.toastService.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!this.passwordData.currentPassword) {
      this.toastService.info('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.info('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.toastService.info('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // เรียก API เพื่อเปลี่ยนรหัสผ่าน
    this.http.put(`${this.apiUrl}/users/${currentUser.user_id}/change-password`, {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: (response) => {
        this.toastService.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        logger.info('Password changed successfully');
        
        // Reset form
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (error) => {
        logger.error('Failed to change password:', error);
        const errorMessage = error.error?.error || error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
        this.toastService.error(errorMessage);
      }
    });
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
    this.userProfile.district = '';
    this.userProfile.subDistrict = '';
    this.userProfile.zipCode = '';
    
    if (this.userProfile.province) {
      this.addressService.getDistricts(+this.userProfile.province).subscribe({
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
    this.userProfile.subDistrict = '';
    this.userProfile.zipCode = '';
    
    if (this.userProfile.district) {
      this.addressService.getSubDistricts(+this.userProfile.district).subscribe({
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
    if (this.userProfile.subDistrict) {
      const subDistrict = this.subDistricts.find(sd => sd.id === +this.userProfile.subDistrict);
      if (subDistrict) {
        this.userProfile.zipCode = subDistrict.zip_code.toString();
      }
    }
  }

  // สร้างที่อยู่แบบเต็ม
  buildFullAddress(): string {
    const parts = [];
    
    if (this.userProfile.houseNumber) parts.push(`บ้านเลขที่ ${this.userProfile.houseNumber}`);
    if (this.userProfile.moo) parts.push(`หมู่ ${this.userProfile.moo}`);
    if (this.userProfile.soi) parts.push(`ซอย ${this.userProfile.soi}`);
    if (this.userProfile.road) parts.push(`ถนน ${this.userProfile.road}`);
    
    const subDistrict = this.subDistricts.find(sd => sd.id === +this.userProfile.subDistrict);
    const district = this.districts.find(d => d.id === +this.userProfile.district);
    const province = this.provinces.find(p => p.id === +this.userProfile.province);
    
    if (subDistrict) parts.push(`ตำบล${subDistrict.name_th}`);
    if (district) parts.push(`อำเภอ${district.name_th}`);
    if (province) parts.push(`จังหวัด${province.name_th}`);
    if (this.userProfile.zipCode) parts.push(this.userProfile.zipCode);
    
    return parts.join(' ');
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'preparing': return 'กำลังเตรียม';
      case 'delivered': return 'จัดส่งแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
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

