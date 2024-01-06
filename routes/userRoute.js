const express = require("express");
const session = require("express-session");
const userRoute = new express();

userRoute.set("view engine", "ejs");
userRoute.use(express.static("views"));
userRoute.use(express.urlencoded({ extended: "true" }));
userRoute.use(
  session({
    secret: "Session Secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
const path = require("path");
const userController = require(
  path.join(__dirname, "..", "controllers", "userController.js"),
);
const productController = require(
  path.join(__dirname, "..", "controllers", "productController.js"),
);
const cartController = require(
  path.join(__dirname, "..", "controllers", "cartController.js"),
);
const orderController = require(
  path.join(__dirname, "..", "controllers", "orderController.js"),
);
const offerController = require(
  path.join(__dirname, "..", "controllers", "offerController.js"),
);

const paymentController = require(
  path.join(__dirname, "..", "controllers", "paymentController.js"),
);

const authe = require("../middlewares/auth.js");
userRoute.get("/", userController.loadIndex);

userRoute.get("/register", authe.IsLogin, userController.loadregister);

userRoute.post("/register", authe.IsLogin, userController.insertUser);
userRoute.get("/confirm/:token", authe.IsLogin, userController.activateAccount);
userRoute.get("/login", authe.IsLogin, userController.loginLoad);
userRoute.post("/login", userController.verifyLogin);
userRoute.get("/send-otp/:token", userController.send_otp);
userRoute.post("/resend-otp/:token",userController.resend_otp);
userRoute.post("/verify-otp/:token",userController.verifyotp);
userRoute.get("/productlists", productController.loadHome);
userRoute.post("/productlists", productController.loadHome);
userRoute.get("/productdetails", authe.IsLogout, productController.loaddetails);
userRoute.post("/productdetails", authe.IsLogout, productController.addreview);
userRoute.get("/cartPage", authe.IsLogout, cartController.getcartPage);
userRoute.post("/add-to-cart", authe.IsLogout,cartController.addtoCart);
userRoute.post("/update-cart", authe.IsLogout, cartController.updateCart);
userRoute.post("/update-cart", authe.IsLogout, cartController.updateCart);
userRoute.get("/Whishlist", authe.IsLogout, cartController.getwishlist);
userRoute.post("/add-to-whishlist", authe.IsLogout, cartController.addtoWhislist);
userRoute.get("/calculate-discount/:offerId", authe.IsLogout, offerController.getofferDetails);
userRoute.delete(
  "/delete-cart/:userId/:productId",
  authe.IsLogout,
  cartController.deleteCart,
);
userRoute.get("/checkout", authe.IsLogout, cartController.getcheckoutpage);
userRoute.post("/checkout", authe.IsLogout, orderController.placeOrder);
userRoute.get("/orders", authe.IsLogout, orderController.getOrder);
userRoute.get("/myOrder", authe.IsLogout, orderController.getOrderPage);
userRoute.post("/cancelOrder", authe.IsLogout, orderController.cancelOrder);
userRoute.get("/forgetpassword", authe.IsLogin, userController.loginforget);
userRoute.post("/forgetpassword", authe.IsLogin, userController.sendforget);

userRoute.get(
  "/resend-password",
  authe.IsLogin,
  userController.loadresetpassword,
);
userRoute.post("/resend-password", authe.IsLogin, userController.resetpassword);
userRoute.get("/profile", authe.IsLogout,userController.showprofile);
userRoute.put("/updateUser", authe.IsLogout, userController.updateUser);
userRoute.put("/updateAddress", authe.IsLogout, userController.updateAddress);
userRoute.get("/referandEarns", authe.IsLogout, userController.getReferals);
userRoute.get("/wallet", authe.IsLogout, userController.getWallet);
userRoute.post("/wallet", authe.IsLogout, userController.getCredit);
userRoute.get("/order-details", authe.IsLogout, orderController.getOrderDetails);
userRoute.post("/webhook", paymentController.getpaymentFailure)
userRoute.post("/updatepaymentStatus/:orderId",authe.IsLogout,paymentController.updatepaymentStatus)
userRoute.get("/check-payment-status",authe.IsLogout,paymentController.checkPaymentStatus)
userRoute.get("/paymentFailure",authe.IsLogout,paymentController.gettryAgain)
userRoute.get("/payment",authe.IsLogout,paymentController.getpaymentPage)
userRoute.get("/update-order", authe.IsLogout, orderController.getOrderupdate);
userRoute.post("/returnProduct",authe.IsLogout, orderController.getOrderReturn)
userRoute.get("/download/invoice/:filename",authe.IsLogout, orderController.getInvoice)
//userRoute.post("/returnProduct", authe.IsLogout, orderController.getOrderReturn);
userRoute.get("/logout", authe.IsLogout, userController.userlogout);

module.exports = userRoute;
