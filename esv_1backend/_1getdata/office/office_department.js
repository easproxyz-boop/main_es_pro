const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // mysql2/promise
const isAuthenticated = require('../../middleware/isAuthenticated');

// Route to get all departments
router.get('/getdata/office/department', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        dt_num, 
        dt_google_id, 
        dt_date_added, 
        dt_modification_type, 
        dt_office_id, 
        dt_office_name, 
        dt_office_acronym 
      FROM tbl_0_list_of_departmet
      WHERE 1
    `);

    // Loop through rows if you want to process them
    const departments = rows.map(row => ({
      num: row.dt_num,
      google_id: row.dt_google_id,
      date_added: row.dt_date_added,
      modification_type: row.dt_modification_type,
      office_id: row.dt_office_id,
      office_name: row.dt_office_name,
      office_acronym: row.dt_office_acronym
    }));

    res.json({ status: 'success', data: departments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Database query failed.' });
  }
});




module.exports = router;
