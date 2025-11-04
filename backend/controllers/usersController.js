// โมดูลสำหรับเชื่อมต่อกับฐานข้อมูล MySQL
import mysql from 'mysql2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'frozen_food',
});

// Test database connection
db.connect((err) => {
  if (err) {
    logger.error('Database connection failed:', err);
  } else {
  // connected to MySQL database
  }
});

// ดึงผู้ใช้ทั้งหมด
export const getAllUsers = (req, res) => {
  db.query('SELECT user_id, username, email, role, phone, address FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// ดึงผู้ใช้ตาม ID
export const getUserById = (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT user_id, username, email, role, phone, address FROM users WHERE user_id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(results[0]);
    }
  );
};

// เพิ่มผู้ใช้ใหม่ (hash password ด้วย bcrypt)
export const createUser = async (req, res) => {
  const { user_id, username, email, password, role, phone, address } = req.body;
  
  try {
    // Hash password ด้วย bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(
      'INSERT INTO users (user_id, username, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, username, email, hashedPassword, role, phone, address],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ message: 'User created', user_id });
      }
    );
  } catch (error) {
    logger.error('Error hashing password:', error);
    return res.status(500).json({ error: 'Error creating user' });
  }
};

// สมัครสมาชิกใหม่
export const registerUser = async (req, res) => {
  const { username, email, password, phone, address } = req.body;
  
  if (!username || !email || !password || !phone || !address) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }
  
  try {
    // Hash password ด้วย bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
    db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email],
      (err, results) => {
        if (err) {
          logger.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
          return res.status(400).json({ message: 'อีเมลนี้มีผู้ใช้แล้ว' });
        }
        
        // สร้าง user_id ใหม่ โดยดึงหมายเลขสูงสุดจากฐานข้อมูล
        db.query(
          'SELECT user_id FROM users WHERE user_id LIKE "U%" ORDER BY CAST(SUBSTRING(user_id, 2) AS UNSIGNED) DESC LIMIT 1',
          [],
          (err, results) => {
            if (err) {
              logger.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // สร้าง user_id ใหม่จากหมายเลขสุดท้าย
            let newUserId = 'U001';
            if (results.length > 0) {
              const lastId = results[0].user_id;
              const lastNumber = parseInt(lastId.substring(1));
              const newNumber = lastNumber + 1;
              newUserId = 'U' + String(newNumber).padStart(3, '0');
            }
            
            // บันทึกผู้ใช้ใหม่ด้วย hashed password
            db.query(
              'INSERT INTO users (user_id, username, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [newUserId, username, email, hashedPassword, 'user', phone, address],
              (err, result) => {
                if (err) {
                  logger.error('Database error:', err);
                  return res.status(500).json({ error: 'Database error' });
                }
                
                res.status(201).json({ 
                  message: 'สมัครสมาชิกสำเร็จ',
                  user_id: newUserId,
                  username: username,
                  email: email
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    logger.error('Error hashing password:', error);
    return res.status(500).json({ error: 'Error registering user' });
  }
};

// แก้ไขผู้ใช้
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role, phone, address } = req.body;

  try {
    // Build dynamic update query (only update fields that are provided)
    let updateFields = [];
    let values = [];

    if (username !== undefined) {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (password !== undefined && password !== null && password !== '') {
      // Hash password ถ้ามีการอัปเดต
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      values.push(hashedPassword);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      values.push(role);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      values.push(address);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;

    db.query(sql, values, (err, result) => {
      if (err) {
        logger.error('Error updating user:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    });
  } catch (error) {
    logger.error('Error hashing password:', error);
    return res.status(500).json({ error: 'Error updating user' });
  }
};

// ลบผู้ใช้
export const deleteUser = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE user_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'User deleted' });
  });
};

// เข้าสู่ระบบ
export const loginUser = (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // ดึงข้อมูลผู้ใช้พร้อม hashed password
  db.query(
    'SELECT user_id, username, email, password, role, phone, address FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) {
        logger.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      const user = results[0];
      
      try {
        // เปรียบเทียบ password กับ hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Login สำเร็จ - ส่งข้อมูลผู้ใช้กลับ (ไม่รวม password)
        res.json({ 
          message: 'Login successful',
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        });
      } catch (error) {
        logger.error('Error comparing password:', error);
        return res.status(500).json({ error: 'Error during login' });
      }
    }
  );
};

// ดึงที่อยู่ของผู้ใช้ตาม ID
export const getUserAddress = (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT user_id, username, address, phone FROM users WHERE user_id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(results[0]);
    }
  );
};

// อัปเดตที่อยู่ของผู้ใช้
export const updateUserAddress = (req, res) => {
  const { id } = req.params;
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  db.query(
    'UPDATE users SET address = ? WHERE user_id = ?',
    [address, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        message: 'User address updated successfully',
        user_id: id,
        address: address
      });
    }
  );
};

// เปลี่ยนรหัสผ่าน (ต้องใช้รหัสผ่านเดิม)
export const changePassword = (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  // ตรวจสอบรหัสผ่านปัจจุบัน
  db.query(
    'SELECT password FROM users WHERE user_id = ?',
    [id],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err });
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = results[0];
      
      try {
        // ตรวจสอบว่ารหัสผ่านปัจจุบันถูกต้องหรือไม่
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash รหัสผ่านใหม่
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // อัปเดตรหัสผ่านใหม่
        db.query(
          'UPDATE users SET password = ? WHERE user_id = ?',
          [hashedNewPassword, id],
          (err, result) => {
            if (err) return res.status(500).json({ error: err });
            
            res.json({ 
              message: 'Password changed successfully',
              user_id: id
            });
          }
        );
      } catch (error) {
        logger.error('Error changing password:', error);
        return res.status(500).json({ error: 'Error changing password' });
      }
    }
  );
};

// ตรวจสอบตัวตนด้วยอีเมล (สำหรับลืมรหัสผ่าน)
export const verifyEmail = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
  }

  db.query(
    'SELECT user_id, email FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        logger.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
      }

      const user = results[0];
      res.json({
        success: true,
        user_id: user.user_id,
        email: user.email
      });
    }
  );
};

// ตรวจสอบตัวตนด้วย username + phone (สำหรับลืมรหัสผ่าน)
export const verifyIdentity = (req, res) => {
  const { username, phone } = req.body;

  if (!username || !phone) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และเบอร์โทรศัพท์' });
  }

  db.query(
    'SELECT user_id, username, phone FROM users WHERE username = ? AND phone = ?',
    [username, phone],
    (err, results) => {
      if (err) {
        logger.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้ที่ตรงกัน' });
      }

      const user = results[0];
      res.json({
        success: true,
        user_id: user.user_id,
        username: user.username
      });
    }
  );
};

// รีเซ็ตรหัสผ่าน (ไม่ต้องใช้รหัสผ่านเดิม - สำหรับลืมรหัสผ่าน)
export const resetPassword = async (req, res) => {
  const { user_id, new_password } = req.body;

  if (!user_id || !new_password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // อัปเดตรหัสผ่านใหม่
    db.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedPassword, user_id],
      (err, result) => {
        if (err) {
          logger.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        res.json({
          success: true,
          message: 'เปลี่ยนรหัสผ่านสำเร็จ',
          user_id: user_id
        });
      }
    );
  } catch (error) {
    logger.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Error resetting password' });
  }
};



