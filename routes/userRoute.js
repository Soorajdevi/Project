const express = require("express");
const router = express.Router({ body: true });

const userController = require("../controllers/userController");
const auth = require("../middleware/userAuth");

router.get("/", auth.notLoggd, userController.loadhome);

router.get("/login", auth.notLoggd, userController.loginpage);
router.post("/login",   auth.notLoggd, userController.verifylogin);

router.get("/home",auth.isLogged ,userController.loadhomes);

router.get("/signUp", auth.notLoggd, userController.loadsignUp);
router.post("/signUp", userController.insertUser);

router.get("/forget",userController.forgetPassword)



// router.get("/forget",userController.forgetVerify)

router.post("/forget",userController.forgetVerify)

router.get("/forgetVerify",userController.loadreset)

router.post("/forgetVerify",userController.restpass)


// still not used
router.post("/generateOTP", userController.sendOTP);

router.post("/login", auth.notLoggd, userController.verifyOtp);

router.get("/logout", userController.userLogout);

router.get("/shop",auth.isLogged,  userController.getShop);

router.post("/shop",auth.isLogged,  userController.getShop);

router.post("/shopfilter",auth.isLogged,  userController.shopFilter);




router.get("/single/:id", auth.isLogged, userController.getSingle);

// router.get("/single", userController.single);

router.use(auth.isLogged)
router.get("/cart",userController.loadCart)

router.post("/cart",userController.couponManagment)

router.get("/removecoupon",userController.removeCoupon)

router.get("/addCart/:id",userController.addtoCart)

router.post("/addCart",userController.updateCart)

router.delete("/cart/:id",userController.deleteCart)



router.get("/checkout",userController.loadcheckout)

router.get("/address",userController.loadaddress)

router.post("/address",userController.addAddress)

router.get("/address/edit/:id",userController.getEditaddress)

router.post("/address/edit/:id",userController.UpdateAddress)




router.get("/order",userController.loadorder)

router.post("/order",userController.cancelOrder)


 router.get("/searcProduct",userController.getShop)

 router.post("/searchProduct",userController.searchProduct)


router.get("/editorder",userController.editOrder)

router.post("/editorder",userController.invoice)


// router.post("/order",userController.CreateOrder)

// router.get('/payment', userController.loadpayement);

// router.post("/payment",userController.choosepay)

router.post("/checkout",userController.CreateOrder)

router.get("/sucess",userController.loadSuccess)

router.post("/sucess",userController.verifyPayment)


router.get("/profile",userController.loadProfile)

router.get("/editprofile",userController.editProfile)

router.post("/editprofile",userController.Updateprofile)

router.get("/manageaddress",userController.loadmanage)

router.get("/manageaddress/edit/:id",userController.editProfiladdress)

router.post("/manageaddress/edit/:id",userController.UpdateprofileAddress)

router.get("/manageaddress/delete/:id",userController.deleteAddress)




module.exports = router;