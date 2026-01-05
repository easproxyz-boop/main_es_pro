const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const isAuthenticated = require('../../middleware/isAuthenticated');

router.post('/table/employee/uSc233/profile_info', isAuthenticated, async (req, res) => {
  try {
    const draw = parseInt(req.body.draw) || 1;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const searchValue = req.body.search?.value || '';
    const orderColumnIndex = parseInt(req.body.order?.[0]?.column) || 1;
    const orderDir = req.body.order?.[0]?.dir === 'asc' ? 'ASC' : 'DESC';
    const columns = req.body.columns || [];
    const showType = req.body.showType || 'ALL';

    // Map DataTables index => DB column
    const columnMap = [
      null,
      'dt_date_added',
      'dt_modification_type',
      'dt_current_status',
      'dt_date_from',
      'dt_date_to',
      'dt_employee_type',
      null,
      null,
      'dt_employee_gender',
      'dt_employee_address_town',
      'dt_employee_address_brgy',
      'dt_employee_office',
      'dt_employee_designation',
      'dt_employee_monthly_salary',
      'dt_remarks',
      null
    ];

    const whereClauses = [];
    const params = [];

    // Global search
    if (searchValue) {
      whereClauses.push(`(
        dt_employee_firstname LIKE ? OR
        dt_employee_lastname LIKE ? OR
        dt_employee_middlename LIKE ? OR
        dt_employee_id = ?
      )`);
      params.push(`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, searchValue);
    }

    // Column-specific search
    columns.forEach((col, idx) => {
      const dbCol = columnMap[idx];
      if (col.search && col.search.value) {
        const val = `%${col.search.value}%`;
        if (dbCol) {
          whereClauses.push(`${dbCol} LIKE ?`);
          params.push(val);
        } else if (idx === 8) { // employee_infos virtual
          whereClauses.push(`(
            dt_employee_firstname LIKE ? OR
            dt_employee_lastname LIKE ? OR
            dt_employee_middlename LIKE ? OR
            dt_employee_id = ?
          )`);
          params.push(val, val, val, col.search.value);
        }
      }
    });

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // ORDER BY
    const orderColumn = columnMap[orderColumnIndex];
    const orderBy = orderColumn ? `ORDER BY ${orderColumn} ${orderDir}` : 'ORDER BY dt_date_added DESC';

    // Total records
    const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM tbl_employee_profile_info');
    const recordsTotal = totalResult[0].total;

    // Filtered records
    const [filteredResult] = await pool.query(`SELECT COUNT(*) as total FROM tbl_employee_profile_info ${where}`, params);
    const recordsFiltered = filteredResult[0].total;

    // Data query
    let query;
    if (showType === 'LATEST') {
      query = `
        SELECT t.*
        FROM tbl_employee_profile_info t
        INNER JOIN (
          SELECT dt_employee_id, MAX(dt_num) AS max_num
          FROM tbl_employee_profile_info
          ${where}
          GROUP BY dt_employee_id
        ) latest
        ON t.dt_employee_id = latest.dt_employee_id AND t.dt_num = latest.max_num
        ${orderBy}
        LIMIT ?, ?
      `;
    } else {
      query = `SELECT * FROM tbl_employee_profile_info ${where} ${orderBy} LIMIT ?, ?`;
    }

    const [rows] = await pool.query(query, [...params, start, length]);

    // Format data
    const data = rows.map(row => ({
      ...row,
      employee_infos: `
        <div class="d-flex align-items-center">
          <img 
            src="${row.dt_employee_picture && row.dt_employee_picture !== 'NONE' ? row.dt_employee_picture.replace(/\.jxl$/i, '.jpeg') : './assets/images/default-picture/user-3-fill.png'}" 
            alt="${row.dt_employee_firstname || ''}"
            class="border border-1 p-1 me-2"
            width="69" height="69">
          <div class="ms-1">
            <div><strong class="text-primary">${row.dt_employee_lastname}, ${row.dt_employee_firstname} ${row.dt_employee_middlename || ''} ${row.dt_employee_suffix || ''}</strong></div>
            <div><small>ID: ${row.dt_employee_id}</small></div>
            <div><small>Birthdate: ${row.dt_employee_birthdate_month || 'N/A'} ${row.dt_employee_birthdate_day || 'N/A'}, ${row.dt_employee_birthdate_year || 'N/A'}</small></div>
          </div>
        </div>
      `,
      dt_employee_monthly_salary: row.dt_employee_monthly_salary
        ? new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(row.dt_employee_monthly_salary)
        : '0.00',
      action: `
        <div class="d-flex justify-content-center">
          <button type="button" 
              data-num="${row.dt_num}"
              id="btnclick-a4dst6-editemployee"
              class="btn btn-sm btn-primary">
              <i class="ri-edit-box-fill"></i>      
          </button>
        </div>
      `
    }));

    res.json({ draw, recordsTotal, recordsFiltered, data });

  } catch (err) {
    console.error('Error in /profile_info:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
