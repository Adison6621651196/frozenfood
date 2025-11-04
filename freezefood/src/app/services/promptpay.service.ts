import { Injectable } from '@angular/core';
// @ts-ignore
import generatePayload from 'promptpay-qr';
// @ts-ignore
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class PromptpayService {
  
  constructor() { }

  /**
   * สร้าง QR Code สำหรับ PromptPay
   * @param phoneNumberOrId เบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678) หรือเลขบัตรประชาชน 13 หลัก หรือ e-Wallet ID
   * @param amount จำนวนเงิน (ถ้าไม่ระบุจะให้ผู้ใช้กรอกเองตอนสแกน)
   * @returns Promise ที่ return เป็น Data URL ของ QR Code รูปภาพ
   */
  async generateQRCode(phoneNumberOrId: string, amount?: number): Promise<string> {
    try {
      // ลบเครื่องหมาย - และช่องว่างออก (ถ้ามี)
      const cleanedId = phoneNumberOrId.replace(/[-\s]/g, '');
      
      // สร้าง payload สำหรับ PromptPay
      // ถ้าไม่ระบุจำนวนเงิน จะเป็น QR Code แบบ Open Amount
      const payload = amount ? generatePayload(cleanedId, { amount }) : generatePayload(cleanedId);
      
      // สร้าง QR Code จาก payload
      const qrCodeDataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating PromptPay QR Code:', error);
      throw new Error('ไม่สามารถสร้าง QR Code ได้ กรุณาตรวจสอบเบอร์โทรศัพท์หรือเลขบัตรประชาชน');
    }
  }

  /**
   * ตรวจสอบความถูกต้องของเบอร์โทรศัพท์ไทย
   * @param phoneNumber เบอร์โทรศัพท์
   * @returns true ถ้าเบอร์โทรศัพท์ถูกต้อง
   */
  validateThaiPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/[-\s]/g, '');
    // เบอร์โทรศัพท์ไทยต้องเป็น 10 หลัก และขึ้นต้นด้วย 0
    return /^0[0-9]{9}$/.test(cleaned);
  }

  /**
   * ตรวจสอบความถูกต้องของเลขบัตรประชาชน
   * @param nationalId เลขบัตรประชาชน
   * @returns true ถ้าเลขบัตรประชาชนถูกต้อง
   */
  validateNationalId(nationalId: string): boolean {
    const cleaned = nationalId.replace(/[-\s]/g, '');
    // เลขบัตรประชาชนต้องเป็น 13 หลัก
    if (!/^[0-9]{13}$/.test(cleaned)) {
      return false;
    }
    
    // ตรวจสอบ checksum ของเลขบัตรประชาชน
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned.charAt(i)) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleaned.charAt(12));
  }

  /**
   * แปลงเบอร์โทรศัพท์ไทยเป็นรูปแบบที่ PromptPay ต้องการ
   * @param phoneNumber เบอร์โทรศัพท์
   * @returns เบอร์โทรศัพท์ในรูปแบบที่ถูกต้อง
   */
  formatPhoneNumber(phoneNumber: string): string {
    // ลบอักขระที่ไม่ใช่ตัวเลขออก
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // ถ้าขึ้นต้นด้วย 66 ให้แปลงเป็น 0
    if (cleaned.startsWith('66')) {
      cleaned = '0' + cleaned.substring(2);
    }
    
    // ถ้าไม่ขึ้นต้นด้วย 0 ให้เพิ่ม 0 ข้างหน้า
    if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  }
}
