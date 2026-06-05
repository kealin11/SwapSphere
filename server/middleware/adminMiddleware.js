const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorised. Please log in.' });
  }
  if (req.user.is_admin !== 1) {
    return res.status(403).json({ message: 'Forbidden. Admin access only.' });
  }
  next();
};

module.exports = adminMiddleware;