import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  order_id: number | string;
  user_id?: number | string;
  customer_name?: string;
  username?: string;
  order_date?: string | Date;
  created_at?: string | Date;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled' | string;
  payment_method?: string;
  payment_status?: 'paid' | 'unpaid' | string;
  total_amount?: number;
}

export interface OrderItem {
  orderitem_id: number;
  order_id: number | string;
  product_id: number | string;
  quantity: number;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getOrdersByUser(userId: string | number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/user/${userId}`);
    }

  getOrderById(orderId: string | number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

  getOrderItems(orderId: string | number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiUrl}/order-items/order/${orderId}`);
  }
}
