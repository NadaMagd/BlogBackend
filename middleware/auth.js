const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No token provided.' });
  }

  try {
   
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

   
    req.user = decoded;


    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
