import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";

export const getAllUsers = catchAsync(async (req, res) => {
  try {

    const query = `
    SELECT user_id, name, lastName, email, userType, picture
    FROM User;
    `;
    const { result: users, resTime } = await runQuery(query);

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ users: users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateUniqueFilename() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 100000000);

  return `image_${timestamp}_${random}`;
}
export const createUser = catchAsync(async (req, res) => {
  const { name, lastName, email, password, userType, imagePath } = req.body;
  let responseTime = 0;
  try {
    const checkQuery = `
      SELECT * FROM User WHERE email = ?
    `;
    const { result: users, resTime:t1 } = await runQuery(checkQuery, [email]);
    responseTime +=t1
    if (users.length > 0) {
      console.log(email);
      return res
        .status(400)
        .json({ error: "کاربر با این ایمیل از قبل وجود دارد" });
    } else {
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      let user_Id;

      const insertQuery = `
      INSERT INTO User (name, lastName, email, password, userType, picture)
      VALUES (?, ?, ?, ?, ?, ?)
      `;
      const { result, resTime:t2 } = await runQuery(insertQuery, [
        name,
        lastName,
        email,
        hashedPassword,
        userType,
        imagePath,
      ]);
      responseTime +=t2


      user_Id = result.insertId;

      const selectQuery = `
        SELECT user_id, name, lastName, email, userType, picture FROM User WHERE user_id = ?
      `;
      const { result:userData, resTime:t3 } = await runQuery(selectQuery, [user_Id]);
 
      const user = userData[0];
      responseTime+=t3
      console.log(`Response time : ${responseTime} ms`);

      res.status(201).json({ user, message: "کاربر موفقانه اضافه شد" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, lastName, email, password, userType, imagePath } = req.body;

  const userTypeMapping = {
    استاد: "teacher",
    ادمین: "admin",
    کاربر: "user",
  };
  let responseTime = 0;

  userType ?? userTypeMapping[userType];

  try {

    const getUserQuery = `
      SELECT * FROM User
      WHERE user_id = ?
    `;

    const {result :userRows ,resTime:t1} = await runQuery(getUserQuery, [id]);
    responseTime+=t1
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    let hashedPassword;
    if (password !== "undefined" && password !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      hashedPassword = user.password;
    }

    const updatedFields = {
      name: name ?? user.name,
      lastName: lastName ?? user.lastName,
      userType: userType ?? user.userType,
      email: email ?? user.email,
      password: hashedPassword,
      picture: imagePath ?? user.picture,
    };

    const updateQuery = `
      UPDATE User
      SET name = ?, lastName = ?, userType = ?, picture = ?, email = ? ,password = ?
      WHERE user_id = ?
    `;
    const {resTime:t2}=await runQuery(updateQuery, [
      updatedFields.name,
      updatedFields.lastName,
      updatedFields.userType,
      updatedFields.picture,
      updatedFields.email,
      updatedFields.password,
      id,
    ]);
    responseTime+=t2
    console.log(`Response time : ${responseTime} ms`);

    res
      .status(200)
      .json({ user: updatedFields, message: "کاربر موفقانه ویرایش شد" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  let responseTime = 0
  try {
    const getUserQuery = `
      SELECT * FROM User WHERE user_id = ?
    `;
    const {result:users ,resTime:t1} = await runQuery(getUserQuery, [id]);
    responseTime += t1
    if (users.length === 0) {
      return res.status(400).json({ error: "کاربر یافت نشد" });
    }
    const user = users[0];

    const deleteQuery = `
      DELETE FROM User WHERE user_id = ?
    `;

    const {resTime:t2}=await runQuery(deleteQuery, [id]);
    responseTime += t2

    if (user.picture) {
      const filePath = path.resolve(path.dirname("") + "/src" + user.picture);

      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
          // console.log("File unlinked successfully");
        } catch (error) {
          console.error("Error unlinking user image:", error);
        }
      } else {
        console.log("File not found:", filePath);
      }
    }    
    console.log(`Response time : ${responseTime} ms`);
    res.status(200).json({ message: "کاربر موفانه حذف شد" });
  } catch (error) {
    console.error("Error deleting user:", error);
    console.log(`Response time : ${responseTime} ms`);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const login = catchAsync(async (req, res) => {
  const { email, password, remember } = req.body;

  try {
  
    const query = `
      SELECT * FROM User WHERE email = ?
    `;
    const {result:users,resTime} = await runQuery(query, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const user = users[0];

    const isPassMatch = await bcrypt.compare(password, user.password);

    if (!isPassMatch) {
      return res.status(401).json({ error: "رمز عبور اشتباه است" });
    }
    const accessToken = jwt.sign(
      { userId: user.user_id, role: user.userType },
      process.env.SECRET_KEY,
      { expiresIn: remember ? "20d" : "5d" }
    );

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ message: "success", token: accessToken });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT user_id, name, lastName, email, picture, userType FROM User WHERE user_id = ?
    `;
    const {result:users,resTime} = await runQuery(query, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    delete user.password;
    delete user.refreshToken;

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ user: user });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
