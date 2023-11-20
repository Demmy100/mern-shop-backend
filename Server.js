const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const errorHandler = require("./middlewares/errorHandler");
const productRoutes = require("./routes/productRoute");
const userRoutes = require("./routes/userRoute");
const paymentRoutes = require("./routes/paymentRoute");
const cartRoutes = require("./routes/cartRoute");
const orderRoutes = require("./routes/orderRoute");
const categoryRoutes = require("./routes/categoryRoute");
const cookieParser = require("cookie-parser");

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.use("/shop/users", userRoutes);
app.use("/shop/products", productRoutes);
app.use("/shop/payments", paymentRoutes);
app.use("/shop/carts", cartRoutes);
app.use("/shop/orders", orderRoutes);
app.use("/shop/categories", categoryRoutes)

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port`, process.env.PORT);
    });
  })
  .catch((err) => console.log(err));

//mongodb+srv://admin:admin@cluster0.lu9quyq.mongodb.net/mern-shop?retryWrites=true&w=majority
