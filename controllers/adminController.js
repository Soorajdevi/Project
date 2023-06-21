const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Category = require("../models/categorySchema");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const mongoose = require("mongoose");

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
    // console.log(categoryId)
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
    const limit = parseInt(req.query.limit) || 6;

    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = await Product.find().skip(skip).limit(limit);

    res.render("admin/addproduct.ejs", {
      product: paginatedProducts,
      totalPages: totalPages,
      currentPage: page,
      product: productData,
    });
    res.render("admin/productView.ejs", { product: productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("internal server error");
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

    // let errorMessage; // initialize errorMessage variable

    // check if there was an error during the file upload
    // if (req.fileValidationError) {
    //   errorMessage = "not allowed";
    //   return res.render('admin/addproduct.ejs', { errorMessage: errorMessage });
    // }

    const imagepath = req.files.map((file) => file.path);

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
    // console.log(productid)
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
    // console.log(productid)
    const { name, description, price, categoryId, Color, Size, Stock } =
      req.body;
    // console.log(name)
    // console.log(req.body)

    let imagePath = null;
    if (req.file) {
      // Delete the previous image if it exists
      const products = await Product.findById(productid);
      if (products.image) {
        fs.unlinkSync(products.image);
      }

      // Set the new image path
      imagePath = req.files.map((file) => file.path);
    } else {
      // If no file was uploaded, keep the current image path
      const product = await Product.findById(productid);
      imagePath = product.image;
    }

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
          image: imagePath,
        },
      },
      { new: true }
    );
    // console.log(update)
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);

    res.status(500).send("internal server error");
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
      res.redirect("/admin");
    }
  });
};

const loadorder = async (req, res) => {
  try {
    // const address = await Address.findById(addressId);
    // const cart = await Cart.findById(cartId);

    const order = await Order.find();
    res.render("admin/order.ejs", { order });
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
    res.render("admin/editOrder.ejs", { order, price,shippingAddress,orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const updatestaus = (req, res) => {
  try {
    const orderID = req.params.id;
    const status = req.body.status;
    console.log(orderID)
    console.log(status)
    // Update the status logic

    res.send('Status updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}


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
  updatestaus
};
