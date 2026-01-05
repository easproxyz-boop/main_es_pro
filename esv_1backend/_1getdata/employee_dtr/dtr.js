const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // mysql2/promise

router.post('/api/employee-dtr', async (req, res) => {
  const { employee_id, year, month } = req.body;

  try {
    // Fetch employee DTR
    const sql = `
      SELECT
        dt_employee_firstname,
        dt_employee_middlename,
        dt_employee_lastname,
        dt_employee_suffix,
        dt_employee_office,
        dt_employee_photo,
        DAY(dt_employee_capture_time) AS dtr_day,
        TIME(dt_employee_capture_time) AS dtr_time,
        dt_employee_login_out_status,
        dt_employee_am_pm_status
      FROM tbl_employee_capture_face_in_out
      WHERE dt_employee_id = ?
        AND YEAR(dt_employee_capture_time) = ?
        AND MONTH(dt_employee_capture_time) = ?
      ORDER BY dt_employee_capture_time
    `;

    const [rows] = await pool.execute(sql, [employee_id, year, month]);

    if (rows.length === 0) {
      return res.json({ success: true, data: null, dtr: [] });
    }

    // Extract employee info (assume same for all rows)
    const employeeInfo = {
      employee_id,
      firstname: rows[0].dt_employee_firstname,
      middlename: rows[0].dt_employee_middlename,
      lastname: rows[0].dt_employee_lastname,
      suffix: rows[0].dt_employee_suffix,
      office: rows[0].dt_employee_office,
      photo: rows[0].dt_employee_photo
    };

    // Process DTR
    const dtr = {};
    rows.forEach(r => {
      const day = r.dtr_day;

      if (!dtr[day]) {
        dtr[day] = {
          day,
          arrival_am: '',
          departure_am: '',
          arrival_pm: '',
          departure_pm: ''
        };
      }

      if (r.dt_employee_am_pm_status === 'AM') {
        if (r.dt_employee_login_out_status === 'LOGIN') {
          dtr[day].arrival_am = r.dtr_time;
        } else {
          dtr[day].departure_am = r.dtr_time;
        }
      }

      if (r.dt_employee_am_pm_status === 'PM') {
        if (r.dt_employee_login_out_status === 'LOGIN') {
          dtr[day].arrival_pm = r.dtr_time;
        } else {
          dtr[day].departure_pm = r.dtr_time;
        }
      }
    });

    res.json({
      success: true,
      employee: employeeInfo,
      dtr: Object.values(dtr)
    });

  } catch (err) {
    console.error('DTR ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
