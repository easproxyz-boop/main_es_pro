const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // mysql2/promise


router.post('/getdata/address/select_town', async (req, res) => {
  const { town = '' } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT dt_town FROM tbl_0_address WHERE dt_town LIKE ? ORDER BY dt_town ASC',
      [`%${town}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch towns');
  }
});

router.post('/getdata/address/select_brgy', async (req, res) => {
  const { town, brgy = '' } = req.body;
  try {
    const [rows1] = await pool.query(
      'SELECT dt_brgy FROM tbl_0_address WHERE dt_town = ? AND dt_brgy LIKE ? ORDER BY dt_brgy ASC',
      [town, `%${brgy}%`]
    );
    res.json(rows1);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch barangays');
  }
});
module.exports = router;
