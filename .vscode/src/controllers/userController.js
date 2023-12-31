import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

export const getAllUsers = async (req, res) => {
  const conn = req.connect;

  try {
    const query = `
    SELECT user_id, name, lastName, email, userType, picture
    FROM User;
    `;
    const [users] = await conn.query(query);


    res.status(200).json({ users: users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
function generateUniqueFilename() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 100000000);

  return `image_${timestamp}_${random}`;
}
export const createUser = async (req, res) => {
  const { name, lastName, email, password, userType,imagePath } = req.body;
  const conn = req.connect;
   
  try {
    const checkQuery = `
      SELECT * FROM User WHERE email = ?
    `;
    const [users] = await conn.query(checkQuery, [email]);

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
      let insertQuery;
      if (!userType) {
        insertQuery = `
        INSERT INTO User (name, lastName, email, password,picture)
        VALUES (?, ?, ?, ?,?)
      `;
        const [result] = await conn.query(insertQuery, [
          name,
          lastName,
          email,
          hashedPassword,
          imagePath,
        ]);

        user_Id = result.insertId;
      } else {
        insertQuery = `
        INSERT INTO User (name, lastName, email, password,userType ,picture)
        VALUES (?, ?, ?, ?,? ,?)
      `;
        const [result] = await conn.query(insertQuery, [
          name,
          lastName,
          email,
          hashedPassword,
          userType,
          imagePath,
        ]);

        user_Id = result.insertId;
      }

      const selectQuery = `
        SELECT user_id, name, lastName, email, userType ,picture FROM User WHERE user_id = ?
      `;
      const [userData] = await conn.query(selectQuery, [user_Id]);
      const user = userData[0];

      res.status(201).json({ user, message: "کاربر موفقانه اضافه شد" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, lastName, email, password, userType ,imagePath} = req.body;
  const conn = req.connect;
  let newFilePath = null;

  try {
    const getUserQuery = `
      SELECT * FROM User
      WHERE user_id = ?
    `;

    const [userRows] = await conn.query(getUserQuery, [id]);
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
      name:  name ?? user.name,
      lastName: lastName ??  user.lastName,
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
    await conn.query(updateQuery, [
      updatedFields.name,
      updatedFields.lastName,
      updatedFields.userType,
      updatedFields.picture,
      updatedFields.email,
      updatedFields.password,
      id,
    ]);

    res
      .status(200)
      .json({ user: updatedFields, message: "کاربر موفقانه ویرایش شد" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const getUserQuery = `
      SELECT * FROM User WHERE user_id = ?
    `;
    const [users] = await conn.query(getUserQuery, [id]);

    if (users.length === 0) {
      return res.status(400).json({ error: "کاربر یافت نشد" });
    }

    const user = users[0];

    const deleteQuery = `
      DELETE FROM User WHERE user_id = ?
    `;

    await conn.query(deleteQuery, [id]);

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

    res.status(200).json({ message: "کاربر موفانه حذف شد" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, remember } = req.body;
  const conn = req.connect;

  try {
    const query = `
      SELECT * FROM User WHERE email = ?
    `;
    const [users] = await conn.query(query, [email]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    const isPassMatch = await bcrypt.compare(password, user.password);

    if (!isPassMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const accessToken = jwt.sign(
      { userId: user.user_id },
      process.env.SECRET_KEY,
      { expiresIn: "1m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.SECRET_KEY,
      { expiresIn: remember ? "20d" : "5d" }
    );
    await conn.query("UPDATE User SET refreshToken = ? WHERE user_id = ?", [
      refreshToken,
      user.user_id,
    ]);
    res.cookie("access_token", accessToken, {
      // secure: true,
      // httpOnly: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const query = `
      SELECT * FROM User WHERE user_id = ?
    `;
    const [users] = await conn.query(query, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const createPost =catchAsync( async (req, res) => {

//   const {title,content,likes,views,picture,author,categories} = req.body

//     // author: 'f7a69df7a69f6af6afd9a',
//     // picture: '/path/to/',
//     // categories: ['f7a69df7a69f6af6afd9a', 'f7a69df7a69f6af6afd9a']

//   try {
//     // Check if the author exists // بری محکم کاری یه😂😂
//     const authorExists = await User.exists({ _id: author });
//     if (!authorExists) {
//       console.error('Author does not exist');
//       return;
//     }

//     // Check if all provided category ObjectIds exist
//     const existingCategories = await Category.find({ _id: { $in: categories } });

//     if (existingCategories.length !== categories.length) {
//       console.error('Not all provided category ObjectIds exist');
//       return;
//     }

//     // Create the new post
//     const post = new Post({
//       title:title,
//       content:content,
//       likes:likes,
//       views:views,
//       picture:picture,
//       author:author
//       ,categories:categories
//     });
//     await post.save();
//     res.status(201).json({ post: post,message: "New post created successfully" });
//     console.log('New post created successfully');
//   } catch (error) {
//     console.error('Error creating new post:', error);
//   }
// })
