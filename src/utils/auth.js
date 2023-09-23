import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "15s",
  });

  return accessToken;
};

export const isAuthenticatedUser = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  console.log(accessToken);
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
    console.log(decoded);
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
      res.cookie("access_token", newAccessToken, {
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

// import jwt from "jsonwebtoken";
// import { config } from "dotenv";
// config();

// const generateAccessToken = (userId) => {
//   const accessToken = jwt.sign({ userId }, process.env.SECRET_KEY, {
//     expiresIn: "15s",
//   });

//   return accessToken;
// };

// export const isAuthenticatedUser = async (req, res, next) => {
//   const access_token = req.cookies.access_token;
//   if (!access_token) {
//     return res
//       .status(401)
//       .json({ message: "Please log in to access this resource" });
//   }

//   try {
//     jwt.verify(access_token, process.env.SECRET_KEY);

//     next();
//   } catch (accessTokenError) {
//     const decoded = jwt.decode(access_token);

//     try {
//       const [userData] = await req.connect.query(
//         "SELECT * FROM User WHERE user_id = ?",
//         [decoded.userId]
//       );

//       if (!userData || !userData[0] || !userData[0].refreshToken) {
//         return res
//           .status(401)
//           .json({ message: "Refresh token not found for the user" });
//       }
//       const storedRefreshToken = userData[0].refreshToken;
//       // console.log(decodedRefreshToken);
//       console.log(access_token);
//       console.log("---------------------");
//       console.log(storedRefreshToken);
//       const decodedRefreshT =  jwt.verify(storedRefreshToken, process.env.SECRET_KEY);

//       const decodedRefreshToken = jwt.verify(storedRefreshToken, process.env.SECRET_KEY);

//       if (decoded.userId !== decodedRefreshToken.userId) {
//         return res.status(401).json({
//           message: "not match",
//         });
//       }

//       const accessToken = jwt.sign(
//         {
//           userId: decodedRefreshToken.userId,
//           picture: userData[0].picture,
//           userName: decodedRefreshToken.userName,
//           lastName: decodedRefreshToken.lastName,
//           role: decodedRefreshToken.role,
//         },
//         process.env.SECRET_KEY,
//         { expiresIn: "1m" }
//       );
//       res.cookie("access_token", accessToken, {
//         // httpOnly: true,
//         sameSite: "strict",
//       });

//       next();
//     } catch (refreshTokenError) {
//       console.log(refreshTokenError);
//       return res
//         .status(401)
//         .json({ message: "Invalid token. Please log in again" });
//     }
//   }
// };
