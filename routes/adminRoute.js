const express = require("express");
const router = express.Router({ body: true });

const adminController = require("../controllers/adminController");
const upload =require("../middleware/multer")

const adminAuth=require("../middleware/adminAuth")


router.get("/",  adminAuth.notLogged, adminController.loadLogin);

// router.post("/",adminController.verify)

router.post("/login", adminController.verifyLogin)

router.get("/user",adminAuth.isLogged, adminController.getUsers);

router.put("/users/:id/block",  adminController.blockUser);

router.get("/category",adminAuth.isLogged, adminController.getCategory)


router.get("/category/addUser",adminAuth.isLogged,adminController.getaddUser)

router.post("/category/addCategory",adminAuth.isLogged,adminController.addCategory)

router.get("/category/editCategory/:id",adminAuth.isLogged, adminController.editCategory)

router.post("/category/editCategory/:id",adminAuth.isLogged,adminController.updateCategory)

router.put('/category/deleteCategory/:id', adminAuth.isLogged,adminController.deleteCategory);


router.get("/product",adminAuth.isLogged,adminController.getproduct)

router.get("/product/addproduct",adminAuth.isLogged,adminController.getAddproduct)


router.post("/product/addproduct" ,adminAuth.isLogged,upload.array('image', 2)  ,adminController.addProduct)

router.get("/product/editProduct/:id",adminAuth.isLogged,upload.array('image', 2),adminController.editProduct)

router.post("/product/editProduct/:id",adminAuth.isLogged,upload.array('image', 2),adminController.updateproduct)

router.put("/product/deleteProduct/:id",adminAuth.isLogged,adminController.deleteProduct)

router.get("/orderadmin",adminAuth.isLogged,adminController.loadorder)

router.get("/editOrder/:id", adminController.loadEdit);

router.post("/editOrder/:id", adminController.updatestaus);



// router.post("/editOrder/:id",adminController.loadEdit)



router.get("/logout",adminController.adminLogout)



module.exports = router;
