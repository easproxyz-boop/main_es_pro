// middleware/isAuthenticated.js
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect(`${FRONTEND_URL}/sign-in`);
}
module.exports = isAuthenticated;