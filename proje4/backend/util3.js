const jwt = require("jsonwebtoken");

function authenticateToken3(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verify error:", err);
      return res.sendStatus(403);
    }

    console.log("Decoded token:", decoded); // Token içeriğini logla

    if (!decoded || decoded.role !== "Student") {
      return res.status(403).json({ message: "Access denied. Not a Student." });
    }

    // Öğrenci ID'sini kontrol et
    if (!decoded.userId) {
      return res
        .status(403)
        .json({ message: "Token does not contain studentId" });
    }

    req.user = {
      studentId: decoded.userId,
      studentNumber: decoded.studentNumber,
      role: decoded.role,
    };

    next();
  });
}

module.exports = {
  authenticateToken3,
};
