// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader ) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

 try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    
    req.user = { id: decoded.id }; // attach user id to req.user
    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
module.exports = {verifyToken};
//  Now it exports an object with key `verifyToken
