import jwt from "jsonwebtoken";

export const isAuthenticatedUser = async (req, res, next) => {
  const token =
    req.headers["x-access-token"] ||
    req.headers["authorization"] ||
    req.headers["x-token"] ||
    req.query.token;
  console.log(token);
  if (!token) {
    return res
      .status(401)
      .json({ message: "Please Login to access this resource" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
    req.decodedData = decoded;
    console.log(decoded);

    next();
  });
};
