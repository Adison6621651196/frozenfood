import mysql from 'mysql2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'frozen_food',
});

// ดึงจังหวัดทั้งหมด (จาก thai.sql)
export const getAllProvinces = (req, res) => {
  db.query(
    'SELECT id, name_in_thai as name_th FROM provinces ORDER BY name_in_thai',
    (err, results) => {
      if (err) {
        logger.error('Error fetching provinces:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
};

// ดึงอำเภอตามจังหวัด (จาก thai.sql)
export const getDistrictsByProvince = (req, res) => {
  const { provinceId } = req.params;
  
  db.query(
    'SELECT id, name_in_thai as name_th, province_id FROM districts WHERE province_id = ? ORDER BY name_in_thai',
    [provinceId],
    (err, results) => {
      if (err) {
        logger.error('Error fetching districts:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
};

// ดึงตำบลตามอำเภอ (จาก thai.sql)
export const getSubDistrictsByDistrict = (req, res) => {
  const { districtId } = req.params;
  
  db.query(
    'SELECT id, name_in_thai as name_th, district_id as amphure_id, zip_code FROM subdistricts WHERE district_id = ? ORDER BY name_in_thai',
    [districtId],
    (err, results) => {
      if (err) {
        logger.error('Error fetching subdistricts:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
};
