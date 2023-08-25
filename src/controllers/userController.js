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
    // console.log(users);

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
  const { name, lastName, email, password, userType } = req.body;
  const conn = req.connect;
  let uploadPath;
  console.log(req.files.file)
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({ error: "فایل آپلود نشد" });
    }
    const file = req.files.file;
    const uniqueFilename = generateUniqueFilename();

    let ext = file.name.split(".").filter(Boolean).slice(1).join(".");
    let filePath = path.resolve(
      path.dirname("") + `/src/uploads/users/${uniqueFilename}` + "." + ext
    );
    file.mv(filePath, function (err) {
      if (err) return res.status(500).send(err);
    });
    uploadPath = `/uploads/users/${uniqueFilename}` + "." + ext;
  } catch (error) {
    console.log(error);
  }
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
        const [result] = await conn.query(insertQuery, [name,lastName,
          email,
          hashedPassword,
          uploadPath,
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
          uploadPath,
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
  const { name, lastName, email, password, userType } = req.body;
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

    if (req.files && req.files.file) {
      const file = req.files.file;
      const ext = file.name.split(".").filter(Boolean).slice(1).join(".");

      const oldFilePath = path.resolve(
        path.dirname("") + "/src/" + user.picture
      );

      try {
        await fs.promises.unlink(oldFilePath); // Delete the previous image file
      } catch (error) {
        console.error("Error deleting previous user image:", error);
      }

      const uniqueFilename = generateUniqueFilename();
      newFilePath = `/uploads/users/${uniqueFilename}` + "." + ext;
      const filePath = path.resolve(path.dirname("") + "/src" + newFilePath);

      try {
        file.mv(filePath, function (err) {
          if (err) {
            console.error("Error updating user profile picture:", err);
          }
        });
      } catch (error) {
        console.error("Error updating user profile picture:", error);
      }
    }

    let hashedPassword;
    if (password !== 'undefined' && password !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      hashedPassword = user.password;
    }
    

    const updatedFields = {
      name: name !== undefined ? name : user.name,
      lastName: lastName !== undefined ? lastName : user.lastName,
      userType: userType !== undefined ? userType : user.userType,
      email: email !== undefined ? email : user.email,
      password: hashedPassword,
      picture: newFilePath !== null ? newFilePath : user.picture,
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

    res.status(200).json({ user: updatedFields,message: "کاربر موفقانه ویرایش شد" });
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
      const filePath = path.resolve(
        path.dirname("") + '/src' + user.picture
      );

      // console.log("Unlinking file:", filePath); 

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
  const { email, password } = req.body;
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
    console.log(isPassMatch);
    console.log(isPassMatch);
    if (!isPassMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.instructor_id },
      process.env.SECRET_KEY
    );

    res.json({ token });
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