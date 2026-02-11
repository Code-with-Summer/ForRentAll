import jwt from "jsonwebtoken";
const JWT_SECRET = "supersecretkey";

export default (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("No token");
  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
  } catch (err) {
    res.status(401).send("Invalid token");
  }
};
