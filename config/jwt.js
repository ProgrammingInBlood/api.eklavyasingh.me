const jwt = require("jsonwebtoken");

//verify jwt middleware
const verifyJwt = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        error: err.message,
        message: "You are not authorized to perform this action",
      });
    }
  } else {
    res.status(401).json({ success: false, message: "No token provided" });
  }
};

module.exports = verifyJwt;
