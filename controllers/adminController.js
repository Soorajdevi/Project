const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Category = require("../models/categorySchema");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const Coupon = require("../models/coupenSchema");
const Banner = require("../models/banner");
const Return = require("../models/returnSchema");
const Offer = require("../models/offerSchema");
const mongoose = require("mongoose");
const fs = require("fs");

const loadLogin = (req, res) => {
  try {
    res.render("admin/login.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server");
  }
};

const verifyLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const adminData = await Admin.findOne({ email: email });
    if (!adminData) {
      return res.render("admin/login", {
        message: "Admin not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, adminData.password);
    if (!passwordMatch) {
      return res.render("admin/login", {
        message: "Invalid username or password",
      });
    }

    req.session.admin_id = adminData._id;
    req.session.email = adminData.email;
    req.session.admin1 = true;

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getUsers = async (req, res) => {
  try {
    const USerData = await User.find();
    res.render("admin/users.ejs", { user: USerData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const blockUser = async (req, res) => {
  const userId = req.params.id;
  console.log(req);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.is_block = !user.is_block;
    await user.save();

    res.status(200).send("Successfully updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getCategory = async (req, res) => {
  try {
    const cataData = await Category.find({ deleted: false });
    res.render("admin/category.ejs", { category: cataData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const getaddUser = (req, res) => {
  try {
    res.render("admin/AddCata.ejs");
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const namenew = req.body.name;
    const newdisc = req.body.description;
    console.log(namenew);
    console.log(newdisc);

    const newCategory = new Category({ name: namenew, description: newdisc });
    await newCategory.save();

    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.render("admin/AddCata.ejs", {
      message: "Already Existing pls Use Uniqe",
    });
  }
};

const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const category = await Category.findById(categoryId);
    // console.log(category)
    if (category) {
      res.render("admin/editCata.ejs", { category });
    } else {
      res.redirect("admin/category");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const { name, description } = req.body;

    const update = await Category.findByIdAndUpdate(
      categoryId,
      {
        $set: { name, description },
      },
      { new: true }
    );

    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log(categoryId);
    const softDelete = await Category.findByIdAndUpdate(categoryId, {
      $set: {
        deleted: true,
      },
    });

    if (!softDelete) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getproduct = async (req, res) => {
  try {
    const productData = await Product.find({ isdeleted: false }).populate(
      "categoryId"
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;

    const skip = (page - 1) * limit;

    const totalProducts = productData.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = productData.slice(skip, skip + limit);

    res.render("admin/productView.ejs", {
      product: paginatedProducts,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const getAddproduct = async (req, res) => {
  try {
    const productData = await Category.find({ deleted: false });
    res.render("admin/addproduct.ejs", { product: productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const getEditproduct = async (req, res) => {
  try {
    const productData = await Category.find({ deleted: false });
    res.render("admin/editProduct.ejs", { product: productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId, Color, Size, Stock } =
      req.body;

    const imagepath = req.files.map((file) => file.path);

    const stocknum = 0;
    const pricenum = 0;

    if (Stock < stocknum || price < pricenum) {
      throw new Error("Stock or price is below the minimum threshold.");
    }

    const newproduct = new Product({
      name,
      description,
      categoryId,
      price,
      Color,
      Size,
      Stock,
      image: imagepath,
    });

    await newproduct.save();
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/product/addproduct");
  }
};
const editProduct = async (req, res) => {
  try {
    const productid = req.params.id;
    console.log(productid);
    const productData = await Category.find({ deleted: false });
    const products = await Product.findById(productid);
    // console.log(products);
    if (products) {
      res.render("admin/editProduct.ejs", { products, product: productData });
    } else {
      res.redirect("admin/product");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
  }
};

const updateproduct = async (req, res) => {
  try {
    const productid = req.params.id;
    const { name, description, price, categoryId, Color, Size, Stock } =
      req.body;

    const product = await Product.findById(productid);
    const imagepath = req.files.map((file) => file.path);
    console.log(imagepath);

    console.log(product);

    const update = await Product.findByIdAndUpdate(
      productid,
      {
        $set: {
          name,
          description,
          price,
          categoryId,
          Color,
          Size,
          Stock,
          image: imagepath,
        },
      },
      { new: true }
    );

    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    // console.log(productId)
    const softDelete = await Product.findByIdAndUpdate(productId, {
      $set: {
        isdeleted: true,
      },
    });

    if (!softDelete) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const adminLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error destroying session");
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/admin/login");
    }
  });
};

const loadorder = async (req, res) => {
  try {
    // const address = await Address.findById(addressId);
    // const cart = await Cart.findById(cartId);

    const orders = await Order.find();
    res.render("admin/order.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadEdit = async (req, res) => {
  try {
    const orderid = req.params.id;

    // console.log(orderid);

    const order = await Order.findById(orderid).populate("user");
    const shippingAddressId = order.shippingAddress;
    const shippingAddress = order.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );

    // console.log(order);
    const price = await Cart.find();

    const orders = await Order.findById(orderid).populate("items.product");
    res.render("admin/editOrder.ejs", {
      order,
      price,
      shippingAddress,
      orders,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateStatus = async (req, res) => {
  try {
    const orderID = req.params.id;
    const status = req.body.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderID,
      { $set: { status: status } },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.find();
    res.render("admin/Acoupon.ejs", { coupon });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddCoupon = async (req, res) => {
  try {
    res.render("admin/AddCoupon.ejs");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, discount, minValue, validUntil } = req.body;

    const stocknum = 0;
    const pricenum = 0;

    if (discount < stocknum || minValue < pricenum) {
      throw new Error("discount or minValue is below the minimum threshold.");
    }
    if (discount > minValue) {
      throw new Error("it not possible");
    }
    const newCoupon = new Coupon({
      code,
      discount,
      minValue,
      validUntil,
    });
    await newCoupon.save();
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
    res.render("admin/AddCoupon.ejs", {
      message: "discount or minValue is below the minimum threshold.",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.body.id;
    console.log(couponId);

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      // Coupon not found
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon deleted successfully",
      deletedCouponId: couponId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findById(id);
    res.render("admin/editCoupon.ejs", { coupon });
    console.log(id);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const { code, discount, validUntil, minValue } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        $set: {
          code,
          discount,
          validUntil,
          minValue,
        },
      },
      { new: true }
    );

    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadbanner = async (req, res) => {
  try {
    const banner = await Banner.find();

    for (const banners of banner) {
      if (banners.createdAt > banners.ExpiryAt) {
        banners.active = false;
      }
    }

    res.render("admin/baneer.ejs", { banner });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddbanner = async (req, res) => {
  try {
    const banner = await Banner.find();
    res.render("admin/addBanner.ejs", { banner });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addbanner = async (req, res) => {
  try {
    const { title, description, text, button, ExpiryAt } = req.body;
    // console.log(title, description, text, button, ExpiryAt);

    const imagepath = req.files.map((file) => file.path);
    // console.log(imagepath);

    const newbanner = new Banner({
      title,
      description,
      text,
      button,
      ExpiryAt,
      imagepath,
    });

    await newbanner.save();
    res.status(200).send("banner added successfully");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadEditbanner = async (req, res) => {
  try {
    const bannerid = req.params.id;
    console.log(bannerid);

    const banner = await Banner.findById(bannerid);
    // console.log(banner)
    res.render("admin/editBanner.ejs", { banner });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateBanner = async (req, res) => {
  try {
    const bannerid = req.params.id;
    console.log(bannerid);

    const { title, button, description, ExpiryAt, text } = req.body;

    const imagepaths = req.files.map((file) => file.path);

    const banner = await Banner.findByIdAndUpdate(
      bannerid,
      {
        $set: {
          title,
          button,
          description,
          ExpiryAt,
          text,
          imagepath: imagepaths,
        },
      },
      { new: true }
    );

    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const loadreturn = async (req, res) => {
  try {
    const returns = await Return.find();
    res.render("admin/return.ejs", { returns });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const returnOrder = async (req, res) => {
  try {
    const returnReason = req.body.returnReason;
    const resolutionType = req.body.resolutionType;
    const orderid = req.body.orderId;
    console.log(returnReason, resolutionType, orderid);

    const user = req.session.user_id;

    const newreturn = new Return({
      orderId: orderid,
      userId: user,
      returnReason: returnReason,
      resolutionType: resolutionType,
    });

    await newreturn.save();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadeditReturn = async (req, res) => {
  try {
    const returnId = req.params.id;
    // console.log(returnId)

    const returns = await Return.findById(returnId);

    const orderid = returns.orderId;

    const order = await Order.findById(orderid).populate("user");

    const shippingAddressId = order.shippingAddress;
    const shippingAddress = order.user.addresses.find(
      (address) => address._id.toString() === shippingAddressId.toString()
    );

    const orders = await Order.findById(orderid).populate("items.product");

    res.render("admin/editReturn.ejs", {
      order,
      returns,
      shippingAddress,
      orders,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editreturn = async (req, res) => {
  try {
    const ReturnID = req.params.id;
    // console.log(ReturnID);

    const returns = await Return.findById(ReturnID);
    const orderId = returns.orderId;
    // console.log(orderId);

    const status = req.body.status;
    // console.log(status);
    const value = returns.status;
    // console.log(typeof value)
    const updatedOrder = await Return.findByIdAndUpdate(
      ReturnID,
      {
        $set: { status: status },
      },
      { new: true }
    );

    if (value.trim() == "Approved") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: "returned" } },
        { new: true }
      );
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const rePayamount = async (req, res) => {
  try {
    const returnId = req.body.returnId;
    const returns = await Return.findById(returnId);
    const orderId = returns.orderId;
    const order = await Order.findById(orderId);
    const userId = returns.userId;
    const userData = await User.findById(userId);

    const amount = order.totalPrice;
    console.log(amount);

    if (amount > 0) {
      userData.Wallet.push({ amount: amount });
    }
    await userData.save();

    order.totalPrice = 0;
    await order.save();

    console.log(returnId);
    res.status(200).json({ message: "Amount repaid successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const offerManagment = async (req, res) => {
  try {
    const offer = await Offer.find();
    res.render("admin/offer.ejs", { offer });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const changePrice = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    console.log(offerId);

    const offer = await Offer.findById(offerId).populate("categoryId");
    console.log(offer);

    const categoryId = offer.categoryId;
    console.log(categoryId);

    const products = await Product.find({ categoryId: categoryId });
    console.log(products);

    products.forEach((product) => {
      var newPrice = (product.price * offer.offerValue) / 100;
      console.log(newPrice);
      Product.findByIdAndUpdate(
        { categoryId: categoryId },
        { $set: { offerPrice: newPrice } },
        { multi: true }
      );
      // product.price = newPrice;
    });

    // const offerPrice = offer.map((off) => off.offerValue);
    // console.log(offerPrice);

    // const productprice= products.map((pro)=>pro.price)
    // console.log(productprice)
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadaddoffer = async (req, res) => {
  try {
    const product = await Category.find({ deleted: false });
    res.render("admin/addOffer.ejs", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addofferManagment = async (req, res) => {
  try {
    const offerName = req.body.offerName;
    const offerValue = req.body.offerValue;
    const categoryId = req.body.categoryId;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    // console.log(offerName, offerValue, offerType, startDate, endDate);

    // const product = await Product.find();
    // const productIDs = product.map((product) => product._id);
    // console.log(productIDs);

    // const category = await Category.find();
    // const categoryIDs = category.map((category) => category._id);
    // console.log(categoryIDs);

    const offer = new Offer({
      offerName: offerName,
      offerValue: offerValue,
      categoryId: categoryId,
      startDate: startDate,
      endDate: endDate,
    });
    await offer.save();
    res.redirect("/admin/offer");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const editOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    console.log(offerId);

    const offer = await Offer.findById(offerId);

    res.render("admin/editOffer.ejs", { offer });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const { offerName, offerValue, offerType, startDate, endDate } = req.body;
    console.log(offerId, offerName, offerValue, offerType, startDate, endDate);

    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      {
        $set: {
          offerName,
          offerValue,
          offerType,
          startDate,
          endDate,
        },
      },
      { new: true }
    );

    console.log(updatedOffer);
    res.redirect("/admin/offer");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadAdmin = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalPrice: { $sum: "$totalPrice" } } },
      { $project: { _id: 0, totalPrice: 1 } },
    ]);
    const revenue = totalRevenue[0].totalPrice.toFixed(0);
    console.log(revenue);

    const count = await Order.countDocuments();
    console.log(count);

    const usercount = await User.countDocuments();

    const currentDate = new Date(); // Get the current date
    const startOfWeek = new Date(currentDate); // Clone the current date

    // Calculate the start of the week (previous Tuesday)
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 5) % 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Set the end of the week (current Monday + 6 days)

    const weeklyData = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    console.log(weeklyData);

    // const monthlyData = [];

    // for (let month = 0; month < 12; month++) {
    //   const startOfMonth = new Date();
    //   startOfMonth.setFullYear(new Date().getFullYear(), month, 1);
    //   startOfMonth.setHours(0, 0, 0, 0);

    //   const endOfMonth = new Date(startOfMonth);
    //   endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    //   endOfMonth.setHours(23, 59, 59, 999);

    //   const result = await Order.aggregate([
    //     {
    //       $match: {
    //         status: "delivered",
    //         createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: null,
    //         totalSales: { $sum: "$totalPrice" },
    //       },
    //     },
    //   ]);

    //   const totalSales = result.length > 0 ? result[0].totalSales : 0;
    //   monthlyData.push(totalSales);
    // }

    // console.log(monthlyData);

    // const startYear = 2018;
    // const currentYear = new Date().getFullYear();
    // const yearlyData = [];

    // for (let year = startYear; year <= currentYear; year++) {
    //   const startOfYear = new Date(year, 0, 1);
    //   startOfYear.setHours(0, 0, 0, 0);

    //   const endOfYear = new Date(year, 11, 31);
    //   endOfYear.setHours(23, 59, 59, 999);

    //   const result = await Order.aggregate([
    //     {
    //       $match: {
    //         status: "delivered",
    //         createdAt: { $gte: startOfYear, $lte: endOfYear },
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: null,
    //         totalSales: { $sum: "$totalPrice" },
    //       },
    //     },
    //   ]);

    //   const totalSales = result.length > 0 ? result[0].totalSales : 0;
    //   yearlyData.push(totalSales);
    // }

    // console.log(yearlyData);

    res.render("admin/adminDashboard.ejs", { revenue, count, usercount });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const weekData = async (req, res) => {
  try {
    const currentDate = new Date(); // Get the current date
    const startOfWeek = new Date(currentDate); // Clone the current date

    // Calculate the start of the week (previous Tuesday)
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 5) % 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Set the end of the week (current Monday + 6 days)

    const weeklyData = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    console.log(weeklyData);
    res.json(weeklyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const monthData = async (req, res) => {
  try {
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date();
      startOfMonth.setFullYear(new Date().getFullYear(), month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]);

      const totalSales = result.length > 0 ? result[0].totalSales : 0;
      monthlyData.push(totalSales);
    }
    console.log(monthData);
    res.json(monthlyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const yearData = async (req, res) => {
  try {
    const startYear = 2018;
    const currentYear = new Date().getFullYear();
    const yearlyData = [];

    for (let year = startYear; year <= currentYear; year++) {
      const startOfYear = new Date(year, 0, 1);
      startOfYear.setHours(0, 0, 0, 0);

      const endOfYear = new Date(year, 11, 31);
      endOfYear.setHours(23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalPrice" },
          },
        },
      ]);

      const totalSales = result.length > 0 ? result[0].totalSales : 0;
      yearlyData.push(totalSales);
    }
    console.log(yearData);
    res.json(yearlyData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  getUsers,
  blockUser,
  getCategory,
  getaddUser,
  addCategory,
  editCategory,
  updateCategory,
  deleteCategory,
  getproduct,
  getAddproduct,
  getEditproduct,
  addProduct,
  editProduct,
  updateproduct,
  deleteProduct,
  adminLogout,
  loadorder,
  loadEdit,
  updateStatus,
  loadaddCoupon,
  addCoupon,
  loadCoupon,
  deleteCoupon,
  loadaddbanner,
  addbanner,
  loadbanner,
  loadEditbanner,
  updateBanner,
  loadreturn,
  returnOrder,
  loadeditReturn,
  editreturn,
  editCoupon,
  updateCoupon,
  rePayamount,
  loadAdmin,
  weekData,
  monthData,
  yearData,
  offerManagment,
  addofferManagment,
  loadaddoffer,
  editOffer,
  updateOffer,
  changePrice,
};
