require('dotenv').config();
const express = require('express');
const pool = require('../../config/db');
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
    const logs = [];

    try {
      const captures = req.body;

      if (!Array.isArray(captures) || !captures.length) {
        return res.status(400).json({
          status: "failed",
          message: "No capture data received."
        });
      }

      const uploads = await Promise.all(captures.map(async (capture) => {

        if (!capture.qr || !capture.face || !capture.timestamp || !capture.loginLogout || !capture.ampm) {
          const msg = `Incomplete data for ${capture.qr || 'UNKNOWN'}`;
          logs.push(msg);
          return null;
        }

        const empId  = capture.qr;
        const statusLoginLogout = capture.loginLogout.toUpperCase();
        const ampm   = capture.ampm.toUpperCase();

        // Get employee info
        const [[emp]] = await pool.execute(
          `SELECT * FROM tbl_employee_profile_info 
           WHERE dt_employee_id = ? 
           AND dt_current_status='ACTIVE' LIMIT 1`,
          [empId]
        );

        if (!emp) {
          const msg = `Employee ${empId} not ACTIVE`;
          logs.push(msg);
          return null;
        }

        // Check for duplicate capture for today
        const [dup] = await pool.execute(
          `SELECT 1 FROM tbl_employee_capture_face_in_out
           WHERE dt_employee_id = ?
           AND DATE(dt_employee_capture_time) = CURDATE()
           AND dt_employee_login_out_status = ?
           LIMIT 1`,
          [empId, statusLoginLogout]
        );

        if (dup.length) {
          const msg = `Duplicate ${statusLoginLogout} skipped for ${empId}`;
          logs.push(msg);
          return null;
        }

        // Upload face to Cloudinary
        const upload = await cloudinary.uploader.upload(capture.face, {
          folder: `employee_qr_in_out_faces/${year}_${month}/${empId}`,
          public_id: `${empId}_${capture.timestamp.replace(/[: ]/g, '_')}_${statusLoginLogout}_${ampm}`,
          resource_type: 'image',
          quality: 'auto'
        });

        // Emit event via Socket.io
        io.emit('employee-face-captured', {
          employee_id: empId,
          status: statusLoginLogout,
          time: capture.timestamp
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
          capture.timestamp,
          statusLoginLogout,  // updated
          ampm
        ];
      }));

      const validUploads = uploads.filter(Boolean);

      if (!validUploads.length) {
        return res.status(400).json({
          status: "failed",
          message: logs.join(', ')
        });
      }

      // Insert into database
      const sql = `
        INSERT INTO tbl_employee_capture_face_in_out (
          dt_employee_id, dt_employee_id_picture,
          dt_employee_firstname, dt_employee_middlename,
          dt_employee_lastname, dt_employee_suffix,
          dt_employee_office, dt_employee_photo,
          dt_employee_capture_time,
          dt_employee_login_out_status,
          dt_employee_am_pm_status
        ) VALUES ${validUploads.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')}
      `;

      await pool.execute(sql, validUploads.flat());

      // Use the first upload's action to set message
      const action = validUploads[0][9]; // statusLoginLogout

      res.json({
        status: "success",
        inserted: validUploads.length,
        message: `Successfully logged ${action === 'LOGIN' ? 'in' : 'out'}. QR verified and face captured.`,
        logs
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "failed",
        message: err.message
      });
    }
  });

  return router;
};
