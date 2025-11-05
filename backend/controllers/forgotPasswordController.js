import db from '../config/database.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// เก็บ OTP ชั่วคราวในหน่วยความจำ (สำหรับ demo - production ควรใช้ Redis หรือ Database)
const otpStore = new Map();

// สร้าง transporter สำหรับส่ง email
// ⚠️ Render Free Tier บล็อก SMTP → ใช้ SendGrid API แทน
let transporter;

if (process.env.SENDGRID_API_KEY) {
  // Production: ใช้ SendGrid API (แนะนำ!)
  // ต้อง install: npm install @sendgrid/mail
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  // Development: ใช้ Gmail SMTP (อาจไม่ทำงานบน Render)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'oofoofgt36@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'znwt xrue nyzr hvps'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    secure: false,
    requireTLS: true,
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Step 1: ตรวจสอบอีเมลและส่ง OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }

    // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    // สร้าง OTP 6 หลัก
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // เก็บ OTP ไว้ใน Map (หมดอายุ 5 นาที)
    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 นาที
    });

    // ส่ง OTP ไปยัง email จริง
    console.log(`📧 กำลังส่ง OTP ไปยัง ${email}: ${otp}`);
    
    try {
      await transporter.sendMail({
        from: process.env.SENDGRID_FROM_EMAIL || 'FreezeFood <oofoofgt36@gmail.com>',
        to: email,
        subject: '🔐 รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - FreezeFood',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea; margin: 0; font-size: 28px;">🔐 รีเซ็ตรหัสผ่าน</h1>
                <p style="color: #666; margin-top: 10px;">FreezeFood - ระบบอาหารแช่แข็ง</p>
              </div>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">สวัสดีค่ะ</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">คุณได้ทำการขอรีเซ็ตรหัสผ่านสำหรับบัญชี FreezeFood</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; font-weight: 600;">กรุณาใช้รหัส OTP ด้านล่างเพื่อยืนยันตัวตน:</p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; border-radius: 8px; margin: 30px 0;">
                <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
                  <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
                </div>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ สำคัญ:</strong> รหัส OTP นี้จะหมดอายุภายใน <strong>5 นาที</strong>
                </p>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                  <strong>🔒 เพื่อความปลอดภัย:</strong> หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้และอย่าแชร์รหัส OTP กับผู้อื่น
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #999; font-size: 12px; margin: 5px 0;">© 2024 FreezeFood - ระบบจัดการอาหารแช่แข็ง</p>
                <p style="color: #999; font-size: 12px; margin: 5px 0;">อีเมลนี้ถูกส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
              </div>
            </div>
          </div>
        `
      });
      console.log(`✅ ส่ง OTP สำเร็จไปยัง ${email}`);
    } catch (emailError) {
      console.error('❌ ส่ง email ไม่สำเร็จ:', emailError);
      console.error('❌ Email Error Details:', emailError.message);
      // ถึงแม้ส่ง email ไม่สำเร็จ ก็ยังคงแสดง debug_otp เพื่อให้ระบบใช้งานได้
    }

    // สำหรับ Development/Testing: แสดง OTP ใน response
    // ⚠️ Production: ควรลบออก!
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.json({ 
      message: isDevelopment 
        ? `ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว (หรือดู OTP ด้านล่าง)` 
        : 'ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ',
      // แสดง OTP เสมอใน dev mode (เพราะ Render อาจบล็อก SMTP)
      debug_otp: isDevelopment ? otp : undefined,
      debug_email: isDevelopment ? email : undefined,
      // เพิ่มคำแนะนำ
      note: isDevelopment ? 'หาก Gmail ไม่ได้รับอีเมล ให้ใช้ debug_otp ด้านบนแทน' : undefined
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่ง OTP' });
  }
};

// Step 2: ตรวจสอบ OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบ OTP จาก Map
    const otpData = otpStore.get(email);

    if (!otpData) {
      return res.status(400).json({ message: 'ไม่พบ OTP หรือ OTP หมดอายุแล้ว' });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP หมดอายุแล้ว กรุณาขอ OTP ใหม่' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'OTP ไม่ถูกต้อง' });
    }

    res.json({ 
      message: 'ยืนยัน OTP สำเร็จ',
      verified: true 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' });
  }
};

// Step 3: รีเซ็ตรหัสผ่าน
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบ OTP อีกครั้ง
    const otpData = otpStore.get(email);

    if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      return res.status(400).json({ message: 'OTP ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    // ตรวจสอบรหัสผ่านใหม่
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านในฐานข้อมูล
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // ลบ OTP ออกจาก Map
    otpStore.delete(email);

    res.json({ 
      message: 'เปลี่ยนรหัสผ่านสำเร็จ',
      success: true 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
};

