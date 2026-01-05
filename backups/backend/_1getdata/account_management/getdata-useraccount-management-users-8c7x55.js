const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // MySQL pool

router.post('/getdata/useraccount_management_users_8c7x55', async (req, res) => {
  try {
  const { num } = req.body;


    const [rows] = await pool.execute(
      `SELECT 
        dt_num, dt_date_added, dt_modification_type, dt_current_status,
        dt_access_attendance_system, dt_access_profile_information, dt_access_public_services,
        dt_access_public_services_type, dt_access_office_department, dt_access_office_satellite_town,
        dt_access_office_satellite_brgy, dt_google_id, dt_google_email, dt_google_name,
        dt_google_picture, dt_user_role, dt_user_token
       FROM tbl_useraccount_users
       WHERE dt_num = ? LIMIT 1`,
      [num]
    );

    if (rows.length > 0) {
      res.json({ status: 'success', data: rows[0] });
    } else {
      res.json({ status: 'error', message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch' });
  }
});



router.post('/getdata/useraccount_management_users_offcanvas_menu_uuu8888', async (req, res) => {
  try {

      const googleEmail = req.user.email.toUpperCase();



    const [rows] = await pool.execute(
      `SELECT 
        dt_num, dt_date_added, dt_modification_type, dt_current_status,
        dt_access_attendance_system, dt_access_profile_information, dt_access_public_services,
        dt_access_public_services_type, dt_access_office_department, dt_access_office_satellite_town,
        dt_access_office_satellite_brgy, dt_google_id, dt_google_email, dt_google_name,
        dt_google_picture, dt_user_role, dt_user_token
       FROM tbl_useraccount_users
       WHERE dt_google_email = ? ORDER BY dt_num DESC LIMIT 1`,
      [googleEmail]
    );

    if (rows.length > 0) {
      res.json({ status: 'success', data: rows[0] });
    } else {
      res.json({ status: 'error', message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch' });
  }
});

module.exports = router;
