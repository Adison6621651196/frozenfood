import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ProductComponent } from './product/product.component';
import { StatusComponent } from './status/status.component';
import { Routes, RouterModule } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderSuccessComponent } from './order-success/order-success.component';
import { ProfileComponent } from './profile/profile.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
const routes: Routes = [
  { path: '', component: HomeComponent }, // Default route
  { path: 'product', component: ProductComponent },
  { path: 'status', component: StatusComponent },
  { path: 'cart', component: CartComponent }, // เพิ่ม route สำหรับตระกร้าสินค้า
  { path: 'checkout', component: CheckoutComponent }, // เพิ่ม route สำหรับชำระเงิน
  { path: 'order-success', component: OrderSuccessComponent }, // เพิ่ม route สำหรับหน้าสำเร็จ
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent }, // หน้ารีเซ็ตรหัสผ่าน
  { path: 'admin', component: AdminComponent },
  { path: 'profile', component: ProfileComponent }, // เพิ่ม route สำหรับโปรไฟล์
  { path: 'history', component: OrderHistoryComponent }, // ประวัติการสั่งซื้อ
];
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProductComponent,
    StatusComponent,
    CartComponent,
    CheckoutComponent,
    OrderSuccessComponent,
    LoginComponent,
    ForgotPasswordComponent,
    AdminComponent,
    ProfileComponent,
    OrderHistoryComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
