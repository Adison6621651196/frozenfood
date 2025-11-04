import { Component, OnInit } from '@angular/core';
import logger from '../utils/logger';
import { Order, OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string | null = null;

  constructor(private orderService: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.currentUserValue;
    if (!user?.user_id) {
      this.error = 'กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ';
      return;
    }
    this.fetchOrders(user.user_id);
  }

  fetchOrders(userId: string | number) {
    this.loading = true;
    this.error = null;
    this.orderService.getOrdersByUser(userId).subscribe({
      next: (orders) => {
        // Sort newest first
        this.orders = (orders || []).sort((a: any, b: any) => {
          const da = new Date(a.order_date || a.created_at || 0).getTime();
          const db = new Date(b.order_date || b.created_at || 0).getTime();
          return db - da;
        });
        this.loading = false;
      },
      error: (err) => {
  logger.error('Failed to load orders', err);
        this.error = 'โหลดประวัติการสั่งซื้อไม่สำเร็จ';
        this.loading = false;
      }
    });
  }

  statusText(status: string): string {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'preparing': return 'กำลังจัดเตรียม';
      case 'delivered': return 'จัดส่งแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  }
}
