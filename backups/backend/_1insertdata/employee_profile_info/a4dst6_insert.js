// routes/employee.js
require('dotenv').config();

const express = require('express');
const pool = require('../../config/db');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const isAuthenticated = require('../../middleware/isAuthenticated');
const getPHDateTime = require('../../utils/dateNowPH');

const upload = multer();

module.exports = function (io) {
  const router = express.Router();

  // =========================
  // Cloudinary Config
  // =========================
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  // =========================
  // Helpers
  // =========================
  const toUppercaseEnye = (str) =>
    str ? str.trim().toLocaleUpperCase('es') : null;

  const monthToLetter = (month) => {
    const months = [
      'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
      'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'
    ];
    if (!month || month < 1 || month > 12) {
      throw new Error('Invalid birth month');
    }
    return months[month - 1];
  };

  const uploadToCloudinary = async (base64, employeeId, dateNowPH) => {
    if (!base64) return 'NONE';

    const data = base64.startsWith('data:image')
      ? base64
      : `data:image/png;base64,${base64}`;

    const result = await cloudinary.uploader.upload(data, {
      folder: `employee_id_picture/${employeeId}`,
      public_id: `${employeeId}_${dateNowPH}`,
      format: 'jxl',
      quality: 'auto',
      resource_type: 'image',
    });

    return result.secure_url;
  };

  // ======================================================
  // INSERT – NEW EMPLOYEE (BASE)
  // ======================================================
  router.post(
    '/insert/employee_profile_info/a4dst6',
    isAuthenticated,
    upload.none(),
    async (req, res) => {
      try {
        const b = req.body;
        const dateNowPH = getPHDateTime();

        // Check duplicate employee ID
        const [dup] = await pool.execute(
          `SELECT 1 FROM tbl_employee_profile_info 
           WHERE dt_employee_id = ? LIMIT 1`,
          [b.addEmployee_employee_id]
        );
        if (dup.length) {
          return res.status(409).json({
            status: 'error',
            message: 'Employee ID already exists.',
          });
        }

        const pictureUrl = await uploadToCloudinary(
          b.addEmployee_image_base64,
          b.addEmployee_employee_id,
          dateNowPH
        );

        const sql = `
          INSERT INTO tbl_employee_profile_info (
            dt_date_added,
            dt_modification_type,
            dt_current_status,
            dt_date_from,
            dt_date_to,
            dt_employee_type,
            dt_employee_id,
            dt_employee_picture,
            dt_employee_firstname,
            dt_employee_middlename,
            dt_employee_lastname,
            dt_employee_suffix,
            dt_employee_gender,
            dt_employee_civilstatus,
            dt_employee_contact_number,
            dt_employee_birthdate_month,
            dt_employee_birthdate_day,
            dt_employee_birthdate_year,
            dt_employee_address_town,
            dt_employee_address_brgy,
            dt_employee_office,
            dt_employee_other_office,
            dt_employee_designation,
            dt_employee_monthly_salary,
            dt_remarks,
            dt_last_entry_by
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const values = [
          dateNowPH,
          'BASE',
          b.addEmployee_current_status,
          toUppercaseEnye(b.addEmployee_date_from),
          toUppercaseEnye(b.addEmployee_date_to || 'N/A'),
          b.addEmployee_type,
          b.addEmployee_employee_id,
          pictureUrl,
          toUppercaseEnye(b.addEmployee_first_name),
          toUppercaseEnye(b.addEmployee_middle_name),
          toUppercaseEnye(b.addEmployee_last_name),
          toUppercaseEnye(b.addEmployee_suffix),
          b.addEmployee_gender,
          b.addEmployee_civilstatus,
          b.addEmployee_contact_number,
          monthToLetter(Number(b.addEmployee_birth_month)),
          b.addEmployee_birth_day,
          b.addEmployee_birth_year,
          toUppercaseEnye(b.addEmployee_town),
          toUppercaseEnye(b.addEmployee_brgy),
          toUppercaseEnye(b.addEmployee_office),
          toUppercaseEnye(b.addEmployee_other_office) || 'N/A',
          toUppercaseEnye(b.addEmployee_designation),
          b.addEmployee_monthly_salary
            ? b.addEmployee_monthly_salary.replace(/,/g, '')
            : 0,
          toUppercaseEnye(b.addEmployee_remarks),
          req.user?.email?.toUpperCase(),
        ];

        const [result] = await pool.execute(sql, values);

        io.to('table_employee_profile_info_uSc233')
          .emit('refresh_table_employee_profile_info_uSc233');

        res.json({
          status: 'success',
          message: 'Employee added successfully',
          insertId: result.insertId,
          pictureUrl,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          status: 'error',
          message: err.message,
        });
      }
    }
  );

  // ======================================================
  // INSERT – EDIT HISTORY (EDITED)
  // ======================================================
  router.post(
    '/insert2/employee_profile_info/a4dst6',
    isAuthenticated,
    upload.none(),
    async (req, res) => {
      try {
        const b = req.body;
        const dateNowPH = getPHDateTime();

        const pictureUrl = b.editEmployee_image_base64
          ? await uploadToCloudinary(
              b.editEmployee_image_base64,
              b.editEmployee_employee_id,
              dateNowPH
            )
          : b.editEmployee_employee_picture_link;

        const sql = `
          INSERT INTO tbl_employee_profile_info (
            dt_date_added,
            dt_modification_type,
            dt_current_status,

            dt_date_from,    
            dt_date_to,
            dt_employee_type,
            dt_employee_id,
            dt_employee_picture,
            dt_employee_firstname,
            dt_employee_middlename,
            dt_employee_lastname,
            dt_employee_suffix,
            dt_employee_gender,
            dt_employee_civilstatus,
            dt_employee_contact_number,
            dt_employee_birthdate_month,
            dt_employee_birthdate_day,
            dt_employee_birthdate_year,
            dt_employee_address_town,
            dt_employee_address_brgy,
            dt_employee_office,
            dt_employee_other_office,
            dt_employee_designation,
            dt_employee_monthly_salary,
            dt_remarks,
            dt_last_entry_by
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const values = [
          dateNowPH,
          'EDITED',
          b.editEmployee_current_status,
          toUppercaseEnye(b.editEmployee_date_from),
          toUppercaseEnye(b.editEmployee_date_to || 'N/A'),
          b.editEmployee_type,
          b.editEmployee_employee_id,
          pictureUrl,
          toUppercaseEnye(b.editEmployee_first_name),
          toUppercaseEnye(b.editEmployee_middle_name),
          toUppercaseEnye(b.editEmployee_last_name),
          toUppercaseEnye(b.editEmployee_suffix),
          b.editEmployee_gender,
          b.editEmployee_civilstatus,
          b.editEmployee_contact_number,
          monthToLetter(Number(b.editEmployee_birth_month)),
          b.editEmployee_birth_day,
          b.editEmployee_birth_year,
          toUppercaseEnye(b.editEmployee_town),
          toUppercaseEnye(b.editEmployee_brgy),
          toUppercaseEnye(b.editEmployee_office) || 'N/A',
          toUppercaseEnye(b.editEmployee_other_office) || 'N/A',
          toUppercaseEnye(b.editEmployee_designation),
          b.editEmployee_monthly_salary
            ? b.editEmployee_monthly_salary.replace(/,/g, '')
            : 0,
          toUppercaseEnye(b.editEmployee_remarks),
          req.user?.email?.toUpperCase(),
        ];

        const [result] = await pool.execute(sql, values);

        io.to('table_employee_profile_info_uSc233')
          .emit('refresh_table_employee_profile_info_uSc233');

        res.json({
          status: 'success',
          message: 'Employee edit history saved',
          insertId: result.insertId,
          pictureUrl,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          status: 'error',
          message: err.message,
        });
      }
    }
  );

  return router;
};
