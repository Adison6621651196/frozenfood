// สคริปต์สำหรับ hash password ที่มีอยู่ในฐานข้อมูล
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const hashExistingPasswords = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'frozen_food',
  });

  try {
    console.log('เริ่มต้น hash passwords ในฐานข้อมูล...');
    
    // ดึงผู้ใช้ทั้งหมด
    const [users] = await connection.query('SELECT user_id, password FROM users');
    
    console.log(`พบผู้ใช้ ${users.length} คน`);
    
    for (const user of users) {
      // ตรวจสอบว่า password เป็น plain text หรือไม่
      // bcrypt hash เริ่มต้นด้วย $2b$ หรือ $2a$
      if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        console.log(`Hashing password for user: ${user.user_id}`);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update ในฐานข้อมูล
        await connection.query(
          'UPDATE users SET password = ? WHERE user_id = ?',
          [hashedPassword, user.user_id]
        );
        
        console.log(`✅ Updated user: ${user.user_id}`);
      } else {
        console.log(`⏭️  Skipped user: ${user.user_id} (already hashed)`);
      }
    }
    
    console.log('✅ เสร็จสิ้น! Hash passwords ทั้งหมดเรียบร้อย');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
};

// Run script
hashExistingPasswords();
