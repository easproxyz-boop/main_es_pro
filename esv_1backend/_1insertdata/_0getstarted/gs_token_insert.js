const express = require('express');
const pool = require('../../config/db');
const isAuthenticated = require('../../middleware/isAuthenticated');
const getPHDateTime = require('../../utils/dateNowPH');

module.exports = function (io) {
  const router = express.Router();

router.post('/insert/getstarted/token', isAuthenticated, async (req, res) => {
  try {
    const googleId = req.user?.id;
    const googleEmail = req.user?.email?.toUpperCase();
    const googleName  = req.user?.name?.toUpperCase();
    const googlePicture = req.user.picture || '';
    const userToken = req.body.gs1_token?.trim();

    // 🔹 Required fields check
    const requiredFields = { googleId, googleEmail, userToken };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value === '') {
        return res.status(400).json({
          status: 'error',
          message: `Some fields are required.`
        });
      }
    }

    // 1️⃣ Validate token (read-only)
    const [tokenRows] = await pool.query(
      `SELECT *
       FROM tbl_useraccount_users
       WHERE dt_user_token = ?
         AND dt_current_status = 'TOKEN'
       ORDER BY dt_num DESC
       LIMIT 1`,
      [userToken]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Token.'
      });
    }

    const tokenData = tokenRows[0];

    // 2️⃣ Prevent duplicate insert for same Google account
    const [exists] = await pool.query(
      `SELECT dt_num
       FROM tbl_useraccount_users
       WHERE dt_google_id = ?
         AND dt_user_token = ?
       LIMIT 1`,
      [googleId, userToken]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'This token is already linked to your account.'
      });
    }

    // 3️⃣ Insert new row (NO UPDATE)
    const sqlInsert = `
      INSERT INTO tbl_useraccount_users (
        dt_date_added,
        dt_modification_type,
        dt_current_status,
        dt_access_attendance_system,
        dt_access_profile_information,
        dt_access_public_services,
        dt_access_public_services_type,
        dt_access_office_department,
        dt_access_office_satellite_town,
        dt_access_office_satellite_brgy,
        dt_google_id,
        dt_google_email,
        dt_google_name,
        dt_google_picture,
        dt_user_role,
        dt_last_entry_by,
        dt_user_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      getPHDateTime(),
      'IN PROGRESS',
      'PROFILE',
      tokenData.dt_access_attendance_system ?? 'NO',
      tokenData.dt_access_profile_information ?? 'NO',
      tokenData.dt_access_public_services ?? 'NO',
      tokenData.dt_access_public_services_type ?? '',
      tokenData.dt_access_office_department ?? '',
      tokenData.dt_access_office_satellite_town ?? '',
      tokenData.dt_access_office_satellite_brgy ?? '',
      googleId,
      googleEmail,
      googleName,
      googlePicture,
      tokenData.dt_user_role ?? 'USER',
      googleEmail,
      userToken
    ];

    await pool.query(sqlInsert, params);

    // 4️⃣ Socket.IO refresh
    io.to('table_user_account_a1f312').emit('refresh_table_user_account_a1f312');

    return res.json({
      status: 'success',
      message: 'Token successfully verified.'
    });

  } catch (err) {
    console.error('TOKEN INSERT ERROR:', err);

    return res.status(500).json({
      status: 'error',
      message: 'Server error.'
    });
  }
});


  return router;
};
