const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  Color: {
    type: String,
    required: true,
  },
  Size: {
    type: String,
    required: true,
  },
  Stock: {
    type: String,
    required: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  image: {
    type:[String],
    required: true,
  },
  isdeleted: {
    type: Boolean,
    default: false,
  },
});

const Product = mongoose.model("Product", productSchema);
 module.exports=Product