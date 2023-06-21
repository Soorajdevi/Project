const User = require("../models/userSchema");
const OTP = require("../models/otp");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const mongoose = require("mongoose");
const Cart = require("../models/cartSchema");
// const Address = require("../models/addressSchema");
const randomstring = require("randomstring");
const Order = require("../models/order");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_wuu2yhm284NSc9",
  key_secret: "0d9i71utS7Fzzf7J59eMcDBj",
});

const loadhome = async (req, res) => {
  try {
    res.render("users/index.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadhomes = async (req, res) => {
  try {
    const products = await Product.find({ isdeleted: false });
    const user = await User.find({ is_block: false });
    res.render("users/home.ejs", { products, user });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loginpage = async (req, res) => {
  try {
    res.render("users/login.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifylogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await User.findOne({ email: email });
    // console.log(userData);

    if (!userData) {
      return res.render("users/login.ejs", {
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    // console.log(passwordMatch);
    if (!passwordMatch) {
      return res.render("users/login.ejs", {
        message: "Invalid username or password",
      });
    }

    if (userData.is_block) {
      return res.render("users/login.ejs", {
        message:
          "Your account is blocked. Please contact the administrator for assistance.",
      });
    }

    if (passwordMatch) {
      req.session.user_id = userData._id;
      req.session.email = userData.email;
      req.session.user1 = true;

      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const accountSid = "ACec49a27ee210e84a9c7808a645827073";
const authToken = "67a9ea7b8c48cc4d580056548f0f6f9e";
const client = require("twilio")(accountSid, authToken);

function generateOTP() {
  const otpe = Math.floor(100000 + Math.random() * 900000);
  return otpe.toString();
}

const sendOTP = async (req, res) => {
  try {
    // const { mobile } = req.body;
    const otp = generateOTP();

    client.messages
      .create({
        body: otp,
        from: "+13159080660",
        to: req.body.otp,
      })
      .then((message) => console.log(message.sid));

    // console.log(otp);
  } catch (error) {
    console.log(error);
  }
};

const loadsignUp = async (req, res) => {
  try {
    const message = req.query.message;
    res.render("users/signUp.ejs", { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const insertUser = async (req, res) => {
  // console.log("before" + req.body.password);
  const salt = bcrypt.genSaltSync(10);
  const password = bcrypt.hashSync(req.body.password, salt);

  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password,
    });

    const userData = await user.save();
    // console.log(userData);

    if (userData) {
      const otp = generateOTP();
      client.messages
        .create({
          body: otp,
          from: "+13159080660",
          to: `+91${req.body.mobile}`,
        })
        .then((message) => console.log(message.sid));

      const newOtp = new OTP({
        mobile: req.body.mobile,
        otp,
      });
      await newOtp.save();

      res.render("users/otp.ejs");
    } else {
      res.redirect("/signUp?message=registration-failed");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifyOtp = async (req, res) => {
  const enteredOtp = req.body.otp; // OTP entered by the user
  const newOtp = enteredOtp.join("");

  try {
    const otpData = await OTP.findOne({ otp: newOtp });
    // console.log(otpData);

    if (!otpData) {
      // OTP data not found in the database
      console.log("OTP data not found");
      res.render("users/otp.ejs", { message: "Invalid OTP" });
      return;
    }

    const storedOtp = otpData.otp;

    if (newOtp === storedOtp) {
      console.log("OTP verified successfully");
      res.render("users/login.ejs");
    } else {
      // Incorrect OTP
      console.log("Invalid OTP");
      res.render("users/otp.ejs", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log("Error verifying OTP:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

const userLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error destroying session");
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    }
  });
};
const getShop = async (req, res) => {
  try {
    const filterOptions = {};

    if (req.query.priceRange) {
      const [minPrice, maxPrice] = req.query.priceRange.split("-");
      filterOptions.price = { $gte: minPrice, $lte: maxPrice };
    }

    let productsQuery;

    if (Object.keys(filterOptions).length > 0) {
      productsQuery = Product.find({ isdeleted: false, ...filterOptions });
    } else {
      productsQuery = Product.find({ isdeleted: false });
    }

    const sortType = req.query.sort || "asc";
    if (sortType === "asc") {
      productsQuery = productsQuery.sort({ price: 1 });
    } else if (sortType === "desc") {
      productsQuery = productsQuery.sort({ price: -1 });
    }

    const products = await productsQuery.exec();
    const user = await User.find({ is_block: false });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    const paginatedProducts = products.slice(skip, skip + limit);

    const totalPages = Math.ceil(products.length / limit);
    console.log(totalPages)
    res.render("users/shop.ejs", {
      products: paginatedProducts,
      totalPages: totalPages,
      currentPage: page,
      user: user,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const getSingle = async (req, res) => {
  try {
    const productid = req.params.id;
    // console.log(productid);
    const products = await Product.findById(productid);

    const user = await User.find({ is_block: false });
    // console.log(user);
    // res.render("users/single.ejs", { products });
    res.render("users/single.ejs", { products });
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  try {
    const userData = req.session.user_id;
    // console.log(userData);
    if (userData) {
      const cart = await Cart.find().populate("items.product");
      // console.log(cart);

      res.render("users/cart.ejs", { cart });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addtoCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user_id;

    // const { quantity } = req.body;
    // console.log(req.body);

    let qty = 1;

    const product = await Product.findById(productId);

    const cart = await Cart.findOne({ user: user });

    if (cart) {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );
      // console.log(existingItem);

      if (existingItem) {
        existingItem.quantity += qty;
        existingItem.price = product.price * existingItem.quantity;
      } else {
        const newItem = {
          product: productId,
          quantity: qty,
          price: product.price * qty,
        };

        cart.items.push(newItem);
      }

      await cart.save();
    } else {
      const newCart = new Cart({
        user: user,
        items: [
          {
            product: productId,
            quantity: qty,
            price: product.price * qty,
          },
        ],
      });

      await newCart.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error storing data in cart");
  }
};
const updateCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.session.user_id });
    const existingItem = cart.items.find(
      (item) => item.product.toString() === itemId
    );
    console.log(existingItem);
    const initialQuantity = existingItem.quantity;
    const quantitydiff = quantity - initialQuantity;
    existingItem.quantity = quantity;

    const product = await Product.findOne({ _id: itemId });
    product.Stock -= quantitydiff;

    await cart.save();
    await Product.updateOne({ _id: itemId }, product);

    existingItem.price = quantity * product.price;
    // console.log(existingItem.price);
    const total = cart.items.reduce((acc, item) => acc + item.price, 0);
    cart.price = total;
    // console.log(cart.subtotal);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("interal sever error");
  }
};

const deleteCart = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(productId);
    const userId = req.session.user_id;
    // console.log(userId);

    const result = await Cart.updateOne(
      { user: userId },
      { $pull: { items: { product: productId } } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: "Product not found in cart" });
    }
    // res.redirect("/cart")

    res.json({ message: "Product removed from cart" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadcheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = user.addresses;
    const productId = await Cart.find().populate("items.product");
    const price = await Cart.find();
    // console.log(user);
    // console.log(productId);
    if (user) {
      res.render("users/checkout.ejs", { user, price, productId, address });
    }
    // console.log(address);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddress = async (req, res) => {
  try {
    res.render("users/address.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress = async (req, res) => {
  try {
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;

    const userId = req.session.user_id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/address");
    }

    // Add the new address to the user's addresses array
    user.addresses.push({
      firstname,
      lastname,
      country,
      address,
      city,
      state,
      post,
      mobile,
    });

    // Save the updated user object
    await user.save();

    // Redirect or send a response
    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getEditaddress = async (req, res) => {
  try {
    const addId = req.params.id;
    // console.log(addId);
    const user = await User.findById(req.session.user_id);
    const address = user.addresses.find(
      (addr) => addr._id.toString() === addId
    );
    // console.log(address);
    res.render("users/editAddress.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const UpdateAddress = async (req, res) => {
  try {
    const addId = req.params.id;
    console.log(addId);
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;
    console.log(req.body);

    const user = await User.findById(req.session.user_id);

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addId
    );

    if (addressIndex !== -1) {
      // Update the specific address within the addresses array
      user.addresses[addressIndex] = {
        _id: addId,
        firstname,
        lastname,
        country,
        address,
        city,
        state,
        post,
        mobile,
      };

      await user.save();

      res.redirect("/checkout");
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const forgetPassword = (req, res) => {
  try {
    res.render("users/forget.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    // console.log(email);
    const userData = await User.findOne({ email: email });
    // console.log(userData);

    if (userData) {
      if (userData.is_block) {
        res.render("users/forget.ejs", { message: "please verify your email" });
      } else {
        const randomString = randomstring.generate();
        const updatedata = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendVerifyemail(userData.name, userData.email, randomString);
        res.render("users/forget.ejs", {
          message: "please check your email to reset your password",
        });
      }
    } else {
      res.render("users/forget.ejs", { message: "your email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const sendVerifyemail = (name, email, token) => {
  // create reusable transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "hanginghammer21@gmail.com",
      pass: "dmuqptimnxuyyacx",
    },
  });
  const mailOptions = {
    from: "hanginghammer21@gmail.com",
    to: email,
    subject: "Hello",
    text: "For Reset Password",
    html:
      "<p>Hii " +
      name +
      ', please click here to <a href="http://127.0.0.1:3000/forgetVerify?token=' +
      token +
      '">reset</a> your password </p>',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: %s", info.messageId);
    }
  });
};

const loadreset = async (req, res) => {
  try {
    const token = req.query.token;
    const tokendata = await User.findOne({ token: token });
    if (tokendata) {
      res.render("users/reset.ejs", { user_id: tokendata._id });
    } else {
      res.redirect("/forget");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const restpass = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure = await securepassword(password);

    const Userdata = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure, token: "" } }
    );

    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const securepassword = async (password) => {
  try {
    const passHash = await bcrypt.hash(password, 10);
    return passHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadorder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log(userId);
    const order = await Order.find({ user: userId }).populate("items.product");
    console.log(order);
    res.render("users/orders.ejs", { order });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editOrder = async (req, res) => {
  try {
    const orderid = req.query.orderid;
    console.log(orderid);
    const oneorder = await Order.findById(orderid).populate("user");
    const shippingAddressId = oneorder.shippingAddress;
    const shippingAddress = oneorder.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );
    console.log(shippingAddress);
    const orders = await Order.findById(orderid).populate("items.product");
    console.log(orders);

    // console.log(oneorder)
    res.render("users/editOrder.ejs", { oneorder, shippingAddress, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const CreateOrder = async (req, res) => {
  try {
    const addressId = req.body.selectedItemId;
    const userData = req.session.user_id;

    const user = await User.findById(userData);
    const cart = await Cart.find({ user: userData });

    const selectedAddress = user.addresses.find(
      (address) => address._id.toString() === addressId
    );
    const selectaddress = selectedAddress._id;

    const orderID = uuidv4();

    const orderItems = cart[0].items.map((item) => {
      return {
        product: item.product,
        quantity: item.quantity,
      };
    });

    const subtotal = cart[0].items.reduce(
      (total, item) => total + item.price,
      0
    );
    const discount = subtotal * 0.1;
    const shipping = 5;
    const totalPrice = subtotal - discount + shipping;

    const paymentMethod = req.body.selectedmethod;

    const order = new Order({
      orderID,
      user: user,
      items: orderItems,
      shippingAddress: selectaddress,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
    });

    if (paymentMethod == "cash_on_delivery") {
      console.log("i aM Sved");
      await order.save();
      return res.json('Sucess');
    } else {
      const generateRazorpay = (orderId) => {
        return new Promise((resolve, reject) => {
          const orderOptions = {
            amount: totalPrice * 100, 
            currency: "INR",
            receipt: "order_receipt",
            payment_capture: 1,
          };
          instance.orders.create(orderOptions, function (err, order) {
            if (err) {
              reject(err);
            } else {
              resolve(order);
            }
          });
        });
      };

      const generatedOrder = await generateRazorpay(orderID);
      console.log(generatedOrder);

      // Handle the generated order object and any further processing
      await order.save();
      return res.render("users/sucess.ejs");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// const loadpayement = async (req, res) => {
//   try {
//     const order= await Order.find()

//     const price = await Cart.find();
//     res.render("users/payement.ejs", { price,order });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

// const choosepay = async (req, res) => {
//   try {
//     const { paymentMethod ,orderId } = req.body;
//     // const orderId = req.query.id; // Assuming you have the order ID available
// console.log(req.body)
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       { paymentMethod },
//       { new: true } // This option returns the updated order in the response
//     );

//     if (!updatedOrder) {
//       // Handle case when the order is not found
//       return res.status(404).send("Order not found");
//     }

//     res.render("users/sucess.ejs");
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

const loadSuccess = async (req, res) => {
  try {
    res.render("users/sucess.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadProfile = async (req, res) => {
  try {
    const user = req.session.user_id;
    const users = await User.findById({ _id: user });

    res.render("users/profile.ejs", { users });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadmanage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = user.addresses;
    res.render("users/manageaddress.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editProfiladdress = async (req, res) => {
  try {
    const editId = req.params.id;
    // console.log(addId);
    const user = await User.findById(req.session.user_id);
    const address = user.addresses.find(
      (addr) => addr._id.toString() === editId
    );
    // console.log(address);
    res.render("users/editProfileadd.ejs", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const UpdateprofileAddress = async (req, res) => {
  try {
    const addId = req.params.id;
    console.log(addId);
    const { firstname, lastname, country, address, city, state, post, mobile } =
      req.body;
    console.log(req.body);

    const user = await User.findById(req.session.user_id);

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addId
    );

    if (addressIndex !== -1) {
      user.addresses[addressIndex] = {
        _id: addId,
        firstname,
        lastname,
        country,
        address,
        city,
        state,
        post,
        mobile,
      };

      await user.save();

      res.redirect("/manageaddress");
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const deleId = req.params.id;
    console.log(deleId);
    const user = await User.findById(req.session.user_id);
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === deleId
    );

    if (addressIndex !== -1) {
      user.addresses.splice(addressIndex, 1);
      await user.save();
    }

    res.redirect("/manageaddress");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editProfile = async (req, res) => {
  try {
    const user = req.session.user_id;
    //  console.log(user)
    const Userdata = await User.findById(user);
    //  console.log(Userdata)
    res.render("users/editprofile.ejs", { Userdata });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const Updateprofile = async (req, res) => {
  try {
    const user = req.session.user_id;
    console.log(user);
    //  const Userdata=await User.findById(user)
    //  console.log(Userdata)
    const { name, email, mobile } = req.body;
    console.log(req.body);

    const update = await User.findByIdAndUpdate(
      user,
      {
        $set: {
          name,
          email,
          mobile,
        },
      },
      { new: true }
    );
    // console.log(update)

    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  loadhome,
  loadhomes,
  loginpage,
  loadsignUp,
  insertUser,
  sendOTP,
  verifyOtp,
  verifylogin,
  userLogout,
  getShop,
  getSingle,
  loadCart,
  addtoCart,
  updateCart,
  loadcheckout,
  loadaddress,
  addAddress,
  forgetPassword,
  forgetVerify,
  loadorder,

  loadreset,
  deleteCart,
  CreateOrder,
  loadSuccess,
  loadProfile,
  loadmanage,
  getEditaddress,
  UpdateAddress,
  editProfiladdress,
  UpdateprofileAddress,
  deleteAddress,
  restpass,
  editOrder,
  editProfile,
  Updateprofile,
};
