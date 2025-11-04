
interface DeliveryStatus {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  status: 'preparing' | 'packaging' | 'shipping' | 'delivered' | 'cancelled';
  estimatedDelivery: Date;
  actualDelivery?: Date;
  trackingNumber: string;
  deliveryAddress: string;
  phone: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  statusHistory: StatusHistory[];
}
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}
interface StatusHistory {
  status: string;
  timestamp: Date;
  description: string;
  location?: string;
}
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import logger from '../utils/logger';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html'
})
export class StatusComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  searchTrackingNumber: string = '';
  selectedOrder: any = null;
  isSearching: boolean = false;
  notFound: boolean = false;

  // Sample delivery data
  deliveries: DeliveryStatus[] = [
    {
      id: '1',
      orderNumber: 'FZ001',
      customerName: 'คุณสมชาย ใจดี',
      items: [
        { name: 'ปลาดอลลี่', quantity: 2, price: 100 },
        { name: 'กุ้งเด้ง', quantity: 1, price: 150 }
      ],
      status: 'shipping',
      estimatedDelivery: new Date('2025-07-25T14:00:00'),
      trackingNumber: 'TH123456789',
      deliveryAddress: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพมหานคร 10110',
      phone: '081-234-5678',
      totalAmount: 350,
      paymentStatus: 'paid',
      createdAt: new Date('2025-07-24T10:30:00'),
      statusHistory: [
        {
          status: 'preparing',
          timestamp: new Date('2025-07-24T10:30:00'),
          description: 'ได้รับคำสั่งซื้อและเริ่มเตรียมสินค้า',
          location: 'FrezeFood Warehouse'
        },
        {
          status: 'packaging',
          timestamp: new Date('2025-07-24T11:15:00'),
          description: 'บรรจุสินค้าและเตรียมจัดส่ง',
          location: 'FrezeFood Warehouse'
        },
        {
          status: 'shipping',
          timestamp: new Date('2025-07-24T12:00:00'),
          description: 'สินค้าออกจากคลังและกำลังจัดส่ง',
          location: 'กรุงเทพมหานคร Hub'
        }
      ]
    },
    {
      id: '2',
      orderNumber: 'FZ002',
      customerName: 'คุณมาลี สวยงาม',
      items: [
        { name: 'หมูสามชั้นย่าง', quantity: 1, price: 120 },
        { name: 'ปีกไก่น้ำปลา', quantity: 3, price: 100 }
      ],
      status: 'delivered',
      estimatedDelivery: new Date('2025-07-24T16:00:00'),
      actualDelivery: new Date('2025-07-24T15:45:00'),
      trackingNumber: 'TH987654321',
      deliveryAddress: '456 ถนนพระราม 4 แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
      phone: '089-876-5432',
      totalAmount: 420,
      paymentStatus: 'paid',
      createdAt: new Date('2025-07-23T14:20:00'),
      statusHistory: [
        {
          status: 'preparing',
          timestamp: new Date('2025-07-23T14:20:00'),
          description: 'ได้รับคำสั่งซื้อและเริ่มเตรียมสินค้า',
          location: 'FrezeFood Warehouse'
        },
        {
          status: 'packaging',
          timestamp: new Date('2025-07-23T15:30:00'),
          description: 'บรรจุสินค้าและเตรียมจัดส่ง',
          location: 'FrezeFood Warehouse'
        },
        {
          status: 'shipping',
          timestamp: new Date('2025-07-24T08:00:00'),
          description: 'สินค้าออกจากคลังและกำลังจัดส่ง',
          location: 'กรุงเทพมหานคร Hub'
        },
        {
          status: 'delivered',
          timestamp: new Date('2025-07-24T15:45:00'),
          description: 'จัดส่งสำเร็จ ลูกค้าได้รับสินค้าแล้ว',
          location: 'ที่อยู่ปลายทาง'
        }
      ]
    },
    {
      id: '3',
      orderNumber: 'FZ003',
      customerName: 'คุณวิชัย เก่งมาก',
      items: [
        { name: 'เบนโตะ', quantity: 2, price: 90 },
        { name: 'ลูกชิ้นหมู', quantity: 1, price: 85 }
      ],
      status: 'preparing',
      estimatedDelivery: new Date('2025-07-25T18:00:00'),
      trackingNumber: 'TH555666777',
      deliveryAddress: '789 ถนนเพชรบุรี แขวงราชเทวี เขตราชเทวี กรุงเทพมหานคร 10400',
      phone: '092-345-6789',
      totalAmount: 265,
      paymentStatus: 'paid',
      createdAt: new Date('2025-07-24T13:00:00'),
      statusHistory: [
        {
          status: 'preparing',
          timestamp: new Date('2025-07-24T13:00:00'),
          description: 'ได้รับคำสั่งซื้อและเริ่มเตรียมสินค้า',
          location: 'FrezeFood Warehouse'
        }
      ]
    }
  ];

  
  constructor(private http: HttpClient, private toastService: ToastService) {}
  

  ngOnInit(): void {
  }


  

  searchOrder(): void {
    if (!this.searchTrackingNumber.trim()) {
      this.selectedOrder = null;
      this.notFound = false;
      return;
    }

    this.isSearching = true;
    this.notFound = false;
    this.selectedOrder = null;
    
    // ลบ # ออกถ้ามี (เพื่อให้สามารถค้นหาได้ทั้งกรณี #O001 และ O001)
    const cleanOrderId = this.searchTrackingNumber.trim().replace(/^#/, '');
    
    this.http.get<any>(`${this.apiUrl}/orders/${cleanOrderId}`)
      .subscribe({
        next: (order) => {
          this.selectedOrder = order;
          this.notFound = false;
          this.isSearching = false;
        },
        error: (error) => {
          logger.error('Order not found:', error);
          this.selectedOrder = null;
          this.notFound = true;
          this.isSearching = false;
        }
      });
  }
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอดำเนินการ',
      'preparing': 'กำลังเตรียมสินค้า',
      'packaging': 'กำลังบรรจุหีบห่อ',
      'shipping': 'กำลังจัดส่ง',
      'delivered': 'จัดส่งสำเร็จ',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  }
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': '',
      'preparing': '',
      'packaging': '',
      'shipping': '',
      'delivered': '',
      'cancelled': ''
    };
    return iconMap[status] || '';
  }
  getPaymentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอชำระเงิน',
      'paid': 'ชำระเงินแล้ว',
      'unpaid': 'ยังไม่ชำระ',
      'refunded': 'คืนเงินแล้ว'
    };
    return statusMap[status] || status;
  }
  getStatusProgress(status: string): number {
    const progressMap: { [key: string]: number } = {
      'pending': 10,
      'preparing': 35,
      'packaging': 60,
      'shipping': 80,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  }

  clearSearch(): void {
    this.searchTrackingNumber = '';
    this.selectedOrder = null;
    this.notFound = false;
  }
  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  }
  formatTime(date: any): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  async cancelOrder(): Promise<void> {
    if (!this.selectedOrder) return;
    
    const ok = await this.toastService.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกออเดอร์นี้?');
    if (!ok) {
      return;
    }
    
    // ดึง userId จาก selectedOrder
    const userId = this.selectedOrder.user_id;
    
    if (!userId) {
      this.toastService.error('ไม่พบข้อมูลผู้ใช้');
      return;
    }
    
    this.http.put(`${this.apiUrl}/orders/${this.selectedOrder.order_id}/cancel`, { userId })
      .subscribe({
        next: (response: any) => {
          this.toastService.success('ยกเลิกออเดอร์สำเร็จ');
          // รีเฟรชข้อมูลออเดอร์
          this.searchOrder();
        },
        error: (error) => {
          logger.error('Error cancelling order:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการยกเลิกออเดอร์: ' + (error.error?.message || 'กรุณาลองใหม่อีกครั้ง'));
        }
      });
  }
}

