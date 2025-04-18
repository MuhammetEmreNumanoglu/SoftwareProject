const jwt = require("jsonwebtoken");

const blacklistedTokens = new Set(); // Çıkış yapan token'ları saklamak için

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // Token yoksa 401 hatası

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Token doğrulanamazsa 403 hatası

    if (!decoded || decoded.role !== "Instructor") {
      return res
        .status(403)
        .json({ message: "Access denied. Not an Instructor." });
    }

    req.user = decoded;
    next();
  });
}

module.exports = {
  authenticateToken,
};
