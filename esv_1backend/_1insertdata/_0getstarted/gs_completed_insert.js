const express = require('express');
const withTransaction = require('../../utils/transaction');
const isAuthenticated = require('../../middleware/isAuthenticated');
const getPHDateTime = require('../../utils/dateNowPH');

module.exports = function (io) {
  const router = express.Router();

  router.post('/insert/getstarted/completed', isAuthenticated, async (req, res) => {
    try {
      const { completed_id } = req.body;

      if (completed_id !== '1') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request. Please try again.'
        });
      }

      const googleId = req.user.id;
      const googleEmail = req.user.email.toUpperCase();
      const googleName = req.user.name.toUpperCase();
      const googlePicture = req.user.picture || '';

      await withTransaction(async (conn) => {

        // 1️⃣ Get latest COMPLETED profile
        const [profileRows] = await conn.execute(
          `SELECT *
           FROM tbl_useraccount_users
           WHERE dt_google_email = ?
             AND dt_current_status = 'COMPLETED'
           ORDER BY dt_num DESC
           LIMIT 1`,
          [googleEmail]
        );

        if (!profileRows.length) {
          return res.status(400).json({
            status: 'error',
            message: 'No completed profile found.'
          });
        }

        const profile = profileRows[0];

        // 2️⃣ Prevent multiple ACTIVE accounts
        const [activeCheck] = await conn.execute(
          `SELECT dt_num
           FROM tbl_useraccount_users
           WHERE dt_google_email = ?
             AND dt_current_status = 'ACTIVE'
           LIMIT 1`,
          [googleEmail]
        );

        if (activeCheck.length) {
          throw new Error('Account is already active.');
        }

        // 3️⃣ Insert ACTIVE state
        await conn.execute(
          `INSERT INTO tbl_useraccount_users (
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            getPHDateTime(),
            'BASE',
            'ACTIVE',
            profile.dt_access_attendance_system ?? 'NO',
            profile.dt_access_profile_information ?? 'NO',
            profile.dt_access_public_services ?? 'NO',
            profile.dt_access_public_services_type ?? '',
            profile.dt_access_office_department ?? '',
            profile.dt_access_office_satellite_town ?? '',
            profile.dt_access_office_satellite_brgy ?? '',
            googleId,
            googleEmail,
            googleName,
            googlePicture,
            profile.dt_user_role ?? 'USER',
            googleEmail,
            profile.dt_user_token ?? null
          ]
        );
      });

      // Emit AFTER successful transaction
    io.to('table_user_account_a1f312').emit('refresh_table_user_account_a1f312');

      return res.json({
        status: 'success',
        message: 'Continued successfully.'
      });

    } catch (err) {
      console.error('PROFILE INSERT ERROR:', err);

      return res.status(400).json({
        status: 'error',
        message: err.message || 'Server error.'
      });
    }
  });

  return router;
};
