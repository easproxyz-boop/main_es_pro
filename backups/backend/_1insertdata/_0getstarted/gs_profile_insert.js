const express = require('express');
const withTransaction = require('../../utils/transaction');
const isAuthenticated = require('../../middleware/isAuthenticated');
const getPHDateTime = require('../../utils/dateNowPH');

module.exports = function (io) {
  const router = express.Router();

  router.post('/insert/getstarted/profile', isAuthenticated, async (req, res) => {
    try {
      await withTransaction(async (conn) => {

        const googleId = req.user.id;
        const googleEmail = req.user.email.toUpperCase();
        const googleName = req.user.name.toLocaleUpperCase('es'); // supports Ñ, Á, etc.
        const googlePicture = req.user.picture || '';

        // 1️⃣ Destructure request body
        const {
          pd_firstname,
          pd_middlename,
          pd_lastname,
          pd_suffix,
          pd_birth_month,
          pd_birth_day,
          pd_birth_year,
          pd_gender,
          pd_contact_no,
          pd_address_town,
          pd_address_brgy,
          pd_eligibility,
          pd_position_rank,
          pd_position_rank_acronym,
          pd_position_status,
          pd_office_department_name
        } = req.body;

        // 2️⃣ Convert text fields to uppercase
        const firstnameUC = pd_firstname?.toLocaleUpperCase('es') || '';
        const middlenameUC = pd_middlename?.toLocaleUpperCase('es') || '';
        const lastnameUC = pd_lastname?.toLocaleUpperCase('es') || '';
        const suffixUC = pd_suffix?.toLocaleUpperCase('es') || '';
        const officeDepartmentUC = pd_office_department_name?.toLocaleUpperCase('es') || '';
        const addressTownUC = pd_address_town?.toLocaleUpperCase('es') || '';
        const addressBrgyUC = pd_address_brgy?.toLocaleUpperCase('es') || '';
        const eligibilityUC = pd_eligibility?.toLocaleUpperCase('es') || '';
        const positionRankUC = pd_position_rank?.toLocaleUpperCase('es') || '';
        const positionRankAcronymUC = pd_position_rank_acronym?.toLocaleUpperCase('es') || '';
        const positionStatusUC = pd_position_status?.toLocaleUpperCase('es') || '';

        // 2️⃣a Convert numeric month to LETTER month using switch
        let birthMonthLetter = '';
        switch (Number(pd_birth_month)) {
          case 1: birthMonthLetter = 'JANUARY'; break;
          case 2: birthMonthLetter = 'FEBRUARY'; break;
          case 3: birthMonthLetter = 'MARCH'; break;
          case 4: birthMonthLetter = 'APRIL'; break;
          case 5: birthMonthLetter = 'MAY'; break;
          case 6: birthMonthLetter = 'JUNE'; break;
          case 7: birthMonthLetter = 'JULY'; break;
          case 8: birthMonthLetter = 'AUGUST'; break;
          case 9: birthMonthLetter = 'SEPTEMBER'; break;
          case 10: birthMonthLetter = 'OCTOBER'; break;
          case 11: birthMonthLetter = 'NOVEMBER'; break;
          case 12: birthMonthLetter = 'DECEMBER'; break;
          default: throw new Error('Invalid birth month');
        }

        // 3️⃣ Validate required fields
        const requiredFields = {
          pd_firstname,
          pd_lastname,
          pd_birth_month,
          pd_birth_day,
          pd_birth_year,
          pd_gender,
          pd_contact_no,
          pd_address_town,
          pd_address_brgy,
          pd_eligibility,
          pd_position_rank,
          pd_position_status,
          pd_office_department_name
        };

        const emptyFields = Object.entries(requiredFields)
          .filter(([key, value]) => !value || value.toString().trim() === '')
          .map(([key]) => key);

        if (emptyFields.length > 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Please fill out all required fields.',
            emptyFields
          });
        }

        // 4️⃣ GET LATEST PROFILE TOKEN RECORD
        const [profileDRows] = await conn.query(
          `SELECT * FROM tbl_useraccount_users
           WHERE dt_google_email = ? AND dt_current_status = 'PROFILE'
           ORDER BY dt_num DESC
           LIMIT 1`,
          [googleEmail]
        );

        if (!profileDRows.length) {
          throw new Error('Invalid or already completed profile.');
        }

        const profileDData = profileDRows[0];

        // 5️⃣ PERSONAL INFORMATION
        await conn.query(
          `INSERT INTO tbl_useraccount_personal_information (
            dt_date_added,
            dt_modification_type,
            dt_google_email,
            dt_firstname,
            dt_middlename,
            dt_lastname,
            dt_suffix,
            dt_birth_month,
            dt_birth_day,
            dt_birth_year,
            dt_gender,
            dt_contact_no,
            dt_address_town,
            dt_address_brgy,
            dt_user_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            getPHDateTime(),
            'BASE',
            googleEmail,
            firstnameUC,
            middlenameUC,
            lastnameUC,
            suffixUC,
            birthMonthLetter,
            pd_birth_day,
            pd_birth_year,
            pd_gender,
            pd_contact_no,
            addressTownUC,
            addressBrgyUC,
            profileDData.dt_user_token
          ]
        );

        // 6️⃣ EMPLOYMENT STATUS
        await conn.query(
          `INSERT INTO tbl_useraccount_employment_status (
            dt_date_added,
            dt_modification_type,
            dt_google_email,
            dt_eligibility,
            dt_position_rank,
            dt_position_rank_acronym,
            dt_position_status,
            dt_office_department,
            dt_user_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            getPHDateTime(),
            'BASE',
            googleEmail,
            eligibilityUC,
            positionRankUC,
            positionRankAcronymUC,
            positionStatusUC,
            officeDepartmentUC,
            profileDData.dt_user_token
          ]
        );

        // 7️⃣ FINAL USER STATE — INSERT ONLY
        await conn.query(
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
            'IN PROGRESS',
            'COMPLETED',
            profileDData.dt_access_attendance_system ?? 'NO',
            profileDData.dt_access_profile_information ?? 'NO',
            profileDData.dt_access_public_services ?? 'NO',
            profileDData.dt_access_public_services_type ?? '',
            profileDData.dt_access_office_department ?? '',
            profileDData.dt_access_office_satellite_town ?? '',
            profileDData.dt_access_office_satellite_brgy ?? '',
            googleId,
            googleEmail,
            googleName,
            googlePicture,
            profileDData.dt_user_role ?? 'USER',
            googleEmail,
            profileDData.dt_user_token
          ]
        );

        // 8️⃣ Emit Socket.IO refresh
        io.to('table_user_account_a1f312').emit('refresh_table_user_account_a1f312');

      });

      res.json({
        status: 'success',
        message: 'Profile successfully saved.'
      });

    } catch (err) {
      console.error('PROFILE INSERT ERROR:', err);
      res.status(400).json({
        status: 'error',
        message: err.message || 'Server error.'
      });
    }
  });

  return router;
};
