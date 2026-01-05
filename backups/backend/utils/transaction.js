const pool = require('../config/db');
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); // SUPPORTED
    const result = await callback(connection);
    await connection.commit();           // SUPPORTED
    return result;

  } catch (err) {
    await connection.rollback();         // SUPPORTED
    throw err;

  } finally {
    connection.release();                // REQUIRED
  }
}
module.exports = withTransaction;
