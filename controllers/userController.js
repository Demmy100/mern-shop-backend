const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400).json({ message: "Please fill in all required fields" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least six characters" });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
    });
    //generate token
    const token = generateToken(user._id);

    //send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1 day
      sameSite: "none",
      secure: true,
    });

    if (user) {
      const { _id, name, email, photo, role } = user;
      res.status(201).json({
        _id,
        name,
        email,
        photo,
        role,
        token,
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  //generate token
  const token = generateToken(user._id);
  if (passwordIsCorrect) {
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1 day
      sameSite: "none",
      secure: true,
    });
  }
  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      role,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

//logout user

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "User successfully logged out" });
});

//get user
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      role,
      photo,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

//login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  //verify token
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (verifiedToken) {
    return res.json(true);
  }
  return res.json(false);
});

//update user
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, photo, email } = user;
    user.email = email;
    user.name = req.body.name || name;
    //user._id = req.body._id || _id;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//change password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  const { oldPassword, password } = req.body;
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }
  //check if old password is matching the one in the db
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  //save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successfully");
  } else {
    res.status(400);
    throw new Error("Old password not correct");
  }
});

//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  //delete token if it exist in DB
  let token = await Token.findOne({userId: user._id})
  if(token) {
    await token.deleteOne()
  }

  //create Rest Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken)
  //hash token before saving to db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");


  //console.log(hashedToken)

  //save token to db
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //thirty minutes
  }).save();
  //construct reset url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //Reset email
  const message = `
<h2>Hello ${user.name}</h2>
<p>Please use the url below to reset your password</p>
<p>This reset link is valid for only 30 minutes</p>

<a href=${resetUrl} clicktracking=off>${resetUrl}</a>
<p>Regards</p>
`;
const subject = "Password Reset Request"
const send_to = user.email
const sent_from = process.env.EMAIL_USER
try {
  await sendEmail(subject, message, send_to, sent_from)
  res.status(200).json({success: true, message: "Reset Email Sent"} )
} catch(error) {
  res.status(500)
  throw new Error("Email not sent, try again")
}
  //res.send("Forgot password");
});

const resetPassword = asyncHandler(async (req, res) => {
  const {password} = req.body
  const {resetToken} = req.params

  //hash token, then compare to the token in the DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    //find token in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: {$gt: Date.now()} 
    })
    if (!userToken) {
      res.status(400)
      throw new Error("Invalid or expired token")
    }

    //find user if token is not expired
    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({message: "Password reset successful, please login"})
  res.send("Reset password")
})

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword
};

/* {
  "name": "avatar",
  "email": "avatar@gmail.com",
  "password": "avatar"
}
{
  "name": "demmy",
  "email": "demmy@gmail.com",
  "password": "demilade123"
}

"name": "Tees",
    "description": "Befitting tees for the goodness of the body"

{
   "name": "red dress",
   "category": "female wear",
   "quantity": "5",
   "price": "30",
   "description": "fine black dress"
}

6557d15ed288503f1cf14005

{
  "items": [
    {
      "product": "654bf0397d41d996cad0e630",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "address": "No 10 lekki area, Dey play court",
    "country": "Nigeria",
    "state": "Lagos"
  }
}
A48FDB52
*/
