/**
 * Logger Utility - ระบบจัดการ Log สำหรับ Backend
 * 
 * ฟังก์ชัน: จัดการการแสดงผล log ในระดับต่างๆ (debug, info, warn, error)
 * โดยสามารถควบคุมระดับการแสดงผลผ่าน environment variable LOG_LEVEL
 * 
 * Log Levels (เรียงตามความสำคัญ):
 * - debug (0): ข้อมูลสำหรับ debug โค้ด (รายละเอียดมาก)
 * - info  (1): ข้อมูลทั่วไป เช่น การเชื่อมต่อ database, API calls
 * - warn  (2): คำเตือน เช่น ข้อมูลที่อาจมีปัญหา
 * - error (3): ข้อผิดพลาด เช่น database error, API error
 * 
 * การใช้งาน:
 * import logger from './utils/logger.js';
 * logger.debug('Debug message');
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message');
 * 
 * การตั้งค่า LOG_LEVEL:
 * - ไม่กำหนด หรือ LOG_LEVEL=info -> แสดง info, warn, error
 * - LOG_LEVEL=debug -> แสดงทุก level
 * - LOG_LEVEL=warn -> แสดงเฉพาะ warn, error
 * - LOG_LEVEL=error -> แสดงเฉพาะ error
 */

// กำหนดระดับความสำคัญของ log แต่ละประเภท (ตัวเลขยิ่งน้อยยิ่งแสดงบ่อย)
const levels = { debug: 0, info: 1, warn: 2, error: 3 };

// อ่านค่า LOG_LEVEL จาก environment variable (.env file)
// ถ้าไม่กำหนดจะใช้ค่า default เป็น 'info'
const currentLevel = process.env.LOG_LEVEL && levels[process.env.LOG_LEVEL] !== undefined
  ? levels[process.env.LOG_LEVEL]
  : levels.info;

/**
 * ตรวจสอบว่าควรแสดง log นี้หรือไม่
 * @param {string} level - ระดับของ log (debug, info, warn, error)
 * @returns {boolean} - true ถ้าควรแสดง log
 * 
 * ตัวอย่าง: ถ้า currentLevel = info (1)
 * - debug (0) จะไม่แสดง เพราะ 0 < 1
 * - info (1) จะแสดง เพราะ 1 >= 1
 * - warn (2) จะแสดง เพราะ 2 >= 1
 * - error (3) จะแสดง เพราะ 3 >= 1
 */
function shouldLog(level) {
  return levels[level] >= currentLevel;
}

/**
 * แสดง debug log (ใช้สำหรับ debug โค้ด)
 * @param {...any} args - ข้อความหรือข้อมูลที่ต้องการ log
 */
export function debug(...args) {
  if (shouldLog('debug')) console.debug('[DEBUG]', ...args);
}

/**
 * แสดง info log (ใช้สำหรับข้อมูลทั่วไป)
 * @param {...any} args - ข้อความหรือข้อมูลที่ต้องการ log
 */
export function info(...args) {
  if (shouldLog('info')) console.log('[INFO]', ...args);
}

/**
 * แสดง warning log (ใช้สำหรับคำเตือน)
 * @param {...any} args - ข้อความหรือข้อมูลที่ต้องการ log
 */
export function warn(...args) {
  if (shouldLog('warn')) console.warn('[WARN]', ...args);
}

/**
 * แสดง error log (ใช้สำหรับข้อผิดพลาด)
 * @param {...any} args - ข้อความหรือข้อมูลที่ต้องการ log
 */
export function error(...args) {
  if (shouldLog('error')) console.error('[ERROR]', ...args);
}

// Export เป็น default object สำหรับการ import แบบ: import logger from './logger.js'
export default { debug, info, warn, error };
