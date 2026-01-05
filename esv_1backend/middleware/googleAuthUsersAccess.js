const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const isAuthenticated = require('../middleware/isAuthenticated');

router.post('/getdata/google_user_access', isAuthenticated, async (req, res) => {
  try {
    const googleId = req.user?.id;
    const googleEmail = req.user?.email;
    const googlePicture = req.user?.picture;
    const googleName = req.user?.name;

    if (!googleEmail) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized user'
      });
    }


    

    const [rows] = await pool.execute(
      `SELECT * 
       FROM tbl_useraccount_users 
       WHERE dt_google_email = ? 
       ORDER BY dt_num DESC 
       LIMIT 1`,
      [googleEmail]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    const currentStatus = rows[0].dt_current_status;

    res.json({
      status: 'success',
      data: {
        current_status: currentStatus,
        google_id: googleId,
        google_name: googleName,
        google_picture: googlePicture,
        google_email: googleEmail
      }
    });

  } catch (err) {
    console.error('Google info fetch error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch Google user info'
    });
  }
});

module.exports = router;
