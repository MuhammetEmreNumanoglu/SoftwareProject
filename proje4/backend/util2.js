const jwt = require("jsonwebtoken");

function authenticateToken2(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // Token yoksa 401 hatası

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Token geçersizse 403 hatası

    if (
      !decoded ||
      (decoded.role !== "Secretary" && decoded.role !== "Instructor")
    ) {
      // Eğer rol Secretary veya Instructor değilse
      return res
        .status(403)
        .json({ message: "Access denied. Not authorized." }); // 403 hatası
    }

    req.user = decoded;
    next(); // Middleware'i geç ve rota işlemine devam et
  });
}

module.exports = {
  authenticateToken2,
};
