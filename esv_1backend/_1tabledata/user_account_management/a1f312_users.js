const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const isAuthenticated = require('../../middleware/isAuthenticated');


router.post('/table/user_account_management/a1f312/users', isAuthenticated, async (req, res) => {
  try {
    const draw = req.body.draw || 1;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const searchValue = req.body.search?.value || '';
    const orderColumnIndex = req.body.order?.[0]?.column || 1;
    const orderDir = req.body.order?.[0]?.dir || 'desc';
    const columns = req.body.columns;
    const showType = req.body.showType || 'ALL';

    const columnMap = [
      null,
      'dt_date_added',
      'dt_last_entry_by',
      'dt_modification_type',
      'dt_current_status',
      'google_info',
      'dt_user_token',
      'dt_user_role',
      'dt_access_attendance_system',
      'dt_access_profile_information',
      'dt_access_public_services',
      'dt_access_office_department',
      'dt_access_office_satellite_town',
      'dt_access_office_satellite_brgy',
      null
    ];

    // Build WHERE clause
    const whereClauses = [];
    const params = [];

    if (searchValue) {
      whereClauses.push('(dt_google_name LIKE ? OR dt_google_email LIKE ? OR dt_google_id LIKE ? OR dt_user_role LIKE ?)');
      params.push(`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`);
    }

    columns.forEach((col, idx) => {
      if (col.search && col.search.value) {
        const dbCol = columnMap[idx];
        if (dbCol === 'google_info') {
          whereClauses.push('(dt_google_name LIKE ? OR dt_google_email LIKE ? OR dt_google_id LIKE ?)');
          params.push(`%${col.search.value}%`, `%${col.search.value}%`, `%${col.search.value}%`);
        } else if (dbCol) {
          whereClauses.push(`${dbCol} LIKE ?`);
          params.push(`%${col.search.value}%`);
        }
      }
    });

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // ORDER BY
    let orderBy = '';
    const orderColumn = columnMap[orderColumnIndex];
    if (orderColumn && orderColumn !== 'google_info') {
      orderBy = `ORDER BY ${orderColumn} ${orderDir.toUpperCase()}`;
    }

    // ----- Count total records -----
    let recordsTotalQuery = '';
    if (showType === 'LATEST') {
      // count latest per Google email
      recordsTotalQuery = `
        SELECT COUNT(*) as total
        FROM (
          SELECT dt_google_email, MAX(dt_num) AS max_num
          FROM tbl_useraccount_users
          GROUP BY dt_google_email
        ) t
      `;
    } else {
      recordsTotalQuery = `SELECT COUNT(*) as total FROM tbl_useraccount_users`;
    }

    const [totalResult] = await pool.query(recordsTotalQuery);
    const recordsTotal = totalResult[0].total;

    // ----- Count filtered records -----
    let recordsFiltered = recordsTotal;
    if (whereClauses.length) {
      let filteredQuery = '';
      if (showType === 'LATEST') {
        filteredQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT dt_google_email, MAX(dt_num) AS max_num
            FROM tbl_useraccount_users
            ${where}
            GROUP BY dt_google_email
          ) t
        `;
      } else {
        filteredQuery = `SELECT COUNT(*) as total FROM tbl_useraccount_users ${where}`;
      }
      const [filteredResult] = await pool.query(filteredQuery, params);
      recordsFiltered = filteredResult[0].total;
    }

    // ----- Fetch paginated data -----
    let query = '';
    if (showType === 'LATEST') {
      query = `
        SELECT t.*
        FROM tbl_useraccount_users t
        INNER JOIN (
          SELECT dt_google_email, MAX(dt_num) AS max_num
          FROM tbl_useraccount_users
          ${where}
          GROUP BY dt_google_email
        ) latest
        ON t.dt_google_email = latest.dt_google_email AND t.dt_num = latest.max_num
        ${orderBy}
        LIMIT ?, ?
      `;
    } else {
      query = `SELECT * FROM tbl_useraccount_users ${where} ${orderBy} LIMIT ?, ?`;
    }

    const [rows] = await pool.query(query, [...params, start, length]);

const data = rows.map(row => {
  // Determine if this row is the latest for the user
  const isLatest = row.dt_num === Math.max(...rows.filter(r => r.dt_google_email === row.dt_google_email).map(r => r.dt_num));


  return {
    ...row,
    dt_google_info: `
      <div class="d-flex align-items-center">
        <img src="${row.dt_google_picture || './assets/images/default-picture/user-3-fill.png'}" alt="${row.dt_google_name}" class="rounded-circle border border-1 p-1 me-2" width="50" height="50">
        <div class="ms-1">
          <div><strong>${row.dt_google_name}</strong></div>
          <div><small>${row.dt_google_email}</small></div>
          <div><small class="text-muted">${row.dt_google_id}</small></div>
        </div>
      </div>
    `,
    action: isLatest ? `
      <div class="d-flex justify-content-center">
        <button type="button" 
          data-num="${row.dt_num}"
          id="getdata-useraccount-management-users-8c7x55"
          class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop-uc5xt3-edituser">
          <i class="ri-edit-box-fill"></i>      
        </button>
      </div>
    ` : '' // empty string if not latest or if status is TOKEN
  };


  
});


    

    res.json({ draw, recordsTotal, recordsFiltered, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


