const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // MySQL pool

router.post('/getdata/employee-profile-info/a4dst6', async (req, res) => {
  try {
  const { xnum } = req.body;
    const [rows] = await pool.execute(
      `SELECT * FROM tbl_employee_profile_info WHERE dt_num = ? LIMIT 1`,
      [xnum]
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
