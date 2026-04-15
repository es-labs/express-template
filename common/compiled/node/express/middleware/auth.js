const authIsAdmin = async (req, res, next) => {
  if (req.user.roles.includes('admin')) {
    return next();
  } else {
    return res.status(401).json({ error: 'Not Allowed' });
  }
};

export { authIsAdmin };
