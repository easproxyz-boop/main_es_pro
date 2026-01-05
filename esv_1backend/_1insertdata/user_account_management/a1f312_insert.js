const express = require('express');
const pool = require('../../config/db');

const isAuthenticated = require('../../middleware/isAuthenticated');
const getPHDateTime = require('../../utils/dateNowPH');

module.exports = function (io) {
  const router = express.Router();


//INSERT ========================================================


  router.post('/insert/user_account_management/a1f312/users', isAuthenticated, async (req, res) => {
    try {

    const googleEmail = req.user?.email?.toUpperCase();


      const {
        addUser_access_user_role,
        addUser_access_email_address,
        addUser_access_token,
        addUser_access_attendance_system = 'NO',
        addUser_access_profile_information = 'NO',
        addUser_access_public_services = 'NO',
        addUser_access_office_department,
        addUser_access_office_satellite_town,
        addUser_access_office_satellite_brgy,
        addUser_access_public_services_type = ''
      } = req.body;

      /* ================================
         1. CHECK DUPLICATE EMAIL
      ================================= */
      const [existing] = await pool.query(
        `SELECT 1 FROM tbl_useraccount_users WHERE dt_google_email = ? LIMIT 1`,
        [addUser_access_email_address]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          status: 'duplicate',
          message: 'Email address already exists.'
        });
      }

      /* ================================
         2. INSERT USER
      ================================= */
      const dateNowPH = getPHDateTime();

      const sql = `
        INSERT INTO tbl_useraccount_users (
          dt_date_added, dt_modification_type, dt_current_status,
          dt_access_attendance_system, dt_access_profile_information,
          dt_access_public_services, dt_access_public_services_type,
          dt_access_office_department, dt_access_office_satellite_town,
          dt_access_office_satellite_brgy, dt_google_id, dt_google_email,
          dt_google_name, dt_google_picture, dt_user_role, dt_last_entry_by, dt_user_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        dateNowPH, 'STARTING UP', 'TOKEN',
        addUser_access_attendance_system,
        addUser_access_profile_information,
        addUser_access_public_services,
        addUser_access_public_services_type,
        addUser_access_office_department,
        addUser_access_office_satellite_town,
        addUser_access_office_satellite_brgy,
        '',
        addUser_access_email_address.toUpperCase(),
        '',
        '',
        addUser_access_user_role,
        googleEmail,
        addUser_access_token
      ];

      const [result] = await pool.query(sql, params);

      /* ================================
         3. SOCKET.IO EMIT
      ================================= */
    io.to('table_user_account_a1f312').emit('refresh_table_user_account_a1f312');
      

      res.json({
        status: 'success',
        message: 'User account added successfully.',
        insertedId: result.insertId
      });

    } catch (err) {
      /* ================================
         HANDLE DB UNIQUE ERROR (SAFETY)
      ================================= */
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          status: 'duplicate',
          message: 'Email address already exists.'
        });
      }

      console.error(err);
      res.status(500).json({
        status: 'error',
        message: 'Server error'
      });
    }
  });










  
//UPDATE ========================================================

router.post('/insert2/user_account_management/a1f312/users', isAuthenticated, async (req, res) => {
  try {
    const googleEmail = req.user?.email?.toUpperCase();


    const {
      editUser_access_num,
      editUser_access_user_role,
      editUser_access_current_status,
      editUser_access_attendance_system,
      editUser_access_profile_information,
      editUser_access_public_services,
      editUser_access_office_department,
      editUser_access_office_satellite_town,
      editUser_access_office_satellite_brgy,
      editUser_access_public_services_type = ''
    } = req.body;

    // Get latest profile record
    const [profileDRows] = await pool.query(
      `SELECT * FROM tbl_useraccount_users WHERE dt_num = ? LIMIT 1`,
      [editUser_access_num]
    );

    if (!profileDRows[0]) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const profileDData = profileDRows[0];

    /* ================================
       2. INSERT USER
    ================================= */
    const dateNowPH = getPHDateTime();

    const sql = `
      INSERT INTO tbl_useraccount_users (
        dt_date_added, dt_modification_type, dt_current_status,
        dt_access_attendance_system, dt_access_profile_information,
        dt_access_public_services, dt_access_public_services_type,
        dt_access_office_department, dt_access_office_satellite_town,
        dt_access_office_satellite_brgy, dt_google_id, dt_google_email,
        dt_google_name, dt_google_picture, dt_user_role, dt_last_entry_by, dt_user_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      dateNowPH,
      'EDITED',
      editUser_access_current_status,
      editUser_access_attendance_system || 'NO',
      editUser_access_profile_information || 'NO',
      editUser_access_public_services || 'NO',
      editUser_access_public_services_type,
      editUser_access_office_department,
      editUser_access_office_satellite_town,
      editUser_access_office_satellite_brgy,
      profileDData.dt_google_id,
      profileDData.dt_google_email,
      profileDData.dt_google_name,
      profileDData.dt_google_picture,
      editUser_access_user_role,
      googleEmail,
      profileDData.dt_user_token,
    ];

    const [result] = await pool.query(sql, params);

    /* ================================
       3. SOCKET.IO EMIT
    ================================= */
    io.to('table_user_account_a1f312').emit('refresh_table_user_account_a1f312');

    if(editUser_access_current_status != 'ACTIVE') {
      setTimeout(() => {
        io.to(profileDData.dt_google_email.toUpperCase()).emit('user_updated');
      }, 400);
    }
    if(editUser_access_attendance_system != 'NO') {
      setTimeout(() => {
        io.to(profileDData.dt_google_email.toUpperCase()).emit('user_updated');
      }, 400);
    }



    res.json({
      status: 'success',
      message: 'User account updated successfully.',
      insertedId: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'duplicate',
        message: 'Email address already exists.'
      });
    }
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});


  return router;
};
