import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "15s",
  });

  return accessToken;
};

export const isAuthenticatedUser = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    return res
      .status(401)
      .json({ message: "Please log in to access this resource" });
  }

  try {
    jwt.verify(accessToken, process.env.SECRET_KEY);

    next();
  } catch (accessTokenError) {
    const decoded = jwt.decode(accessToken);
 
    try {
      const [userData] = await req.connect.query(
        "SELECT refreshToken FROM User WHERE user_id = ?",
        [decoded.userId]
      );


      if (!userData || !userData[0] || !userData[0].refreshToken) {
        return res
          .status(401)
          .json({ message: "Refresh token not found for the user" });
      }
      const storedRefreshToken = userData[0].refreshToken;
      const decodedRefreshToken = jwt.verify(
        storedRefreshToken,
        process.env.SECRET_KEY
      );

      if (decoded.userId !== decodedRefreshToken.userId) {
        return res.status(401).json({
          message: "not match",
        });
      }

      const newAccessToken = generateAccessToken(decodedRefreshToken.userId);

      res.cookie("access_token", newAccessToken,{
        // httpOnly: true,
        sameSite: "strict",
      });

      next();
    } catch (refreshTokenError) {
      console.log(refreshTokenError);
      return res
        .status(401)
        .json({ message: "Invalid token. Please log in again" });
    }
  }
};
