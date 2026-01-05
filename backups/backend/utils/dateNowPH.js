function getPHDateTime() {
  const now = new Date();

  // Convert to Philippine Time
  const phTime = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const phDate = new Date(phTime);

  // Format YYYY-MM-DD HH:MM:SS
  const year = phDate.getFullYear();
  const month = String(phDate.getMonth() + 1).padStart(2, '0');
  const day = String(phDate.getDate()).padStart(2, '0');
  const hours = String(phDate.getHours()).padStart(2, '0');
  const minutes = String(phDate.getMinutes()).padStart(2, '0');
  const seconds = String(phDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = getPHDateTime;