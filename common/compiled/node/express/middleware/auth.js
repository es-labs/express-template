// Final fallback for Authorization
const authzIsAdmin = async (req, res, next) => {
  if (req.user.roles.includes('admin')) {
    return next();
  } else {
    return res.status(401).json({ error: 'Not Allowed' });
  }
};

export { authzIsAdmin };
