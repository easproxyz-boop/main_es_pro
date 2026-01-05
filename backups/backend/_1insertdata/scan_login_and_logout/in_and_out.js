require('dotenv').config();
const express = require('express');
const pool = require('../../config/db'); // your MySQL pool
const cloudinary = require('cloudinary').v2;

module.exports = (io) => {
  const router = express.Router();
  router.use(express.json({ limit: '10mb' }));

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  router.post('/insert/employee/save_qr_face', async (req, res) => {
    let logs = [];

    try {
      const captures = req.body;

      if (!Array.isArray(captures) || !captures.length) {
        return res.status(400).json({
          status: "failed",
          message: "No capture data received.",
          logs
        });
      }

      const uploads = await Promise.all(
        captures.map(async (c) => {
          const empId = c.qr;
          const status = c.loginLogout.toUpperCase();

          /* ===== EMPLOYEE CHECK ===== */
          const [[emp]] = await pool.execute(
            `SELECT 
              dt_employee_id,
              dt_employee_picture,
              dt_employee_firstname,
              dt_employee_middlename,
              dt_employee_lastname,
              dt_employee_suffix,
              dt_employee_office
            FROM tbl_employee_profile_info
            WHERE dt_employee_id = ?
              AND dt_current_status = 'ACTIVE'
            ORDER BY dt_num DESC
            LIMIT 1`,
            [empId]
          );

          if (!emp) {
            logs.push(`Employee ${empId} not ACTIVE`);
            return { error: `Employee ${empId} not ACTIVE` };
          }

          /* ===== DUPLICATE CHECK ===== */
          const [dup] = await pool.execute(
            `SELECT 1 FROM tbl_employee_capture_face_in_out
             WHERE dt_employee_id = ?
               AND DATE(dt_employee_capture_time) = CURDATE()
               AND dt_employee_login_out_status = ?
             LIMIT 1`,
            [empId, status]
          );

          if (dup.length) {
            logs.push(`Duplicate ${status} skipped for ${empId}`);
            return { error: `Duplicate ${status} skipped for ${empId}` };
          }

          /* ===== LOGIN / LOGOUT RULES ===== */
          if (status === 'LOGOUT') {
            const [loginToday] = await pool.execute(
              `SELECT 1 FROM tbl_employee_capture_face_in_out
               WHERE dt_employee_id = ?
                 AND DATE(dt_employee_capture_time) = CURDATE()
                 AND dt_employee_login_out_status = 'LOGIN'
               LIMIT 1`,
              [empId]
            );

            if (!loginToday.length) {
              logs.push(`LOGOUT blocked: No LOGIN today for ${empId}`);
              return { error: `LOGOUT blocked: No LOGIN today for ${empId}` };
            }
          }

          if (status === 'LOGIN') {
            const [last] = await pool.execute(
              `SELECT dt_employee_login_out_status
               FROM tbl_employee_capture_face_in_out
               WHERE dt_employee_id = ?
               ORDER BY dt_num DESC
               LIMIT 1`,
              [empId]
            );

            if (last.length && last[0].dt_employee_login_out_status === 'LOGIN') {
              logs.push(`LOGIN blocked: Last still LOGIN for ${empId}`);
              return { error: `LOGIN blocked: Last still LOGIN for ${empId}` };
            }
          }

          /* ===== CLOUDINARY UPLOAD ===== */
          const upload = await cloudinary.uploader.upload(c.face, {
            folder: `employee_qr_in_out_faces/${year}_${month}/${empId}`,
            public_id: `${empId}_${c.timestamp.replace(/[: ]/g, '_')}_${status}_${c.ampm}`,
            resource_type: 'image',
            quality: 'auto'
          });

          /* ===== SOCKET.IO NOTIFICATION ===== */
          io.emit('employee-face-captured', {
            employee_id: empId,
            status,
            time: c.timestamp
          });

          return [
            emp.dt_employee_id,
            emp.dt_employee_picture,
            emp.dt_employee_firstname,
            emp.dt_employee_middlename,
            emp.dt_employee_lastname,
            emp.dt_employee_suffix,
            emp.dt_employee_office,
            upload.secure_url,
            c.timestamp,
            status,
            c.ampm
          ];
        })
      );

      const valid = uploads.filter(u => Array.isArray(u));

      if (!valid.length) {
        return res.status(400).json({
          status: "failed",
          message: "No valid captures.",
          logs
        });
      }

      const sql = `
        INSERT INTO tbl_employee_capture_face_in_out (
          dt_employee_id,
          dt_employee_id_picture,
          dt_employee_firstname,
          dt_employee_middlename,
          dt_employee_lastname,
          dt_employee_suffix,
          dt_employee_office,
          dt_employee_photo,
          dt_employee_capture_time,
          dt_employee_login_out_status,
          dt_employee_am_pm_status
        ) VALUES ${valid.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')}
      `;

      await pool.execute(sql, valid.flat());

      res.json({
        status: "success",
        inserted: valid.length,
        message: "QR + Face capture saved successfully.",
        logs
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "failed",
        message: "Server error",
        logs: [err.message]
      });
    }
  });

  return router;
};
