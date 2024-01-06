const express = require("express");
const session = require("express-session");
const adminRoute = new express();
const multer = require("multer");

adminRoute.set("view engine", "ejs");
adminRoute.use(express.static("views"));
adminRoute.use(express.urlencoded({ extended: "true" }));
adminRoute.use(
  session({
    secret: "Session Secret",
    resave: false,
    saveUninitialized: true,
  }),
);

const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "..", "views", "uploads"));
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(
      null,
      file.fieldname + "-" + uniqueSuffix + "-" + file.originalname,
    ); // Define the filename
  },
});

const upload = multer({ storage: storage });

const adminauth = require("../middlewares/adminauth.js");
const adminController = require(
  path.join(__dirname, "..", "controllers", "adminController.js"),
);
const customerController = require(
  path.join(__dirname, "..", "controllers", "customerController.js"),
);
const productController = require(
  path.join(__dirname, "..", "controllers", "productController.js"),
);
const categoryController = require(
  path.join(__dirname, "..", "controllers", "categoryController.js"),
);
const couponController = require(
  path.join(__dirname, "..", "controllers", "couponController.js"),
);

const orderController = require(
  path.join(__dirname, "..", "controllers", "orderController.js"),
);

const offerController = require(
  path.join(__dirname, "..", "controllers", "offerController.js"),
);

adminRoute.get("/", adminauth.isLogin, adminController.loadlogin);
adminRoute.post("/", adminauth.isLogin, adminController.verifyLogin);
adminRoute.get("/dashboard", adminauth.isLogout, adminController.loaddashboard);

adminRoute.get('/salesreport',  adminauth.isLogout,adminController.getSalesReport);
adminRoute.get('/salesreportpdf',  adminauth.isLogout,adminController.getSalesReportpdf);
adminRoute.post('/getOrdersByDate',adminauth.isLogout,adminController.filter)
adminRoute.get(
  "/customers",
  adminauth.isLogout,
  customerController.loadcustomer,
);
adminRoute.post(
  "/block-user",
  adminauth.isLogout,
  customerController.blockUser,
);
adminRoute.post(
  "/unblock-user",
  adminauth.isLogout,
  customerController.unblockUser,
);
adminRoute.get(
  "/changeRole-user",
  adminauth.isLogout,
  customerController.changeRole,
);
adminRoute.get(
  "/products",
  adminauth.isLogout,
  productController.loadadminproducts,
);
adminRoute.get(
  "/addproducts",
  adminauth.isLogout,
  productController.loadaddproducts,
);
adminRoute.get(
  "/subcategories",
  adminauth.isLogout,
  categoryController.subcategory,
);

adminRoute.get(
  "/category",
  adminauth.isLogout,
  categoryController.loadCategory,
);

adminRoute.get(
  "/editCategory",
  adminauth.isLogout,
  categoryController.loadeditCategory,
);
adminRoute.post(
  "/editCategory",
  adminauth.isLogout,
  categoryController.editCategory,
);
adminRoute.post(
  "/addproducts",
  upload.array("images", 10),
  productController.addproducts,
);
adminRoute.get(
  "/editproducts",
  adminauth.isLogout,
  productController.loadeditproducts,
);
adminRoute.post(
  "/editproducts",
  adminauth.isLogout,
  upload.array("images", 10),
  productController.editproducts,
);
adminRoute.delete(
  "/deleteproducts",
  adminauth.isLogout,
  productController.deleteproducts,
);
adminRoute.put(
  "/restoreproducts",
  adminauth.isLogout,
  productController.restoreproducts,
);
adminRoute.get(
  "/addcategory",
  adminauth.isLogout,
  categoryController.loadaddcategory,
);
adminRoute.post(
  "/addcategory",
  adminauth.isLogout,
  categoryController.addcategory,
);
adminRoute.post(
  "/subcategory",
  adminauth.isLogout,
  categoryController.addsubcategory,
);
adminRoute.delete(
  "/deletecategory",
  adminauth.isLogout,
  categoryController.deletecategory,
);

adminRoute.get("/order", adminauth.isLogout, orderController.order);

adminRoute.get("/orderDetail", adminauth.isLogout, orderController.orderDetail);
adminRoute.get("/coupon", adminauth.isLogout, couponController.loadcouponlists);
adminRoute.get("/add-coupon", adminauth.isLogout, couponController.loadcoupons);
adminRoute.post("/add-coupon", adminauth.isLogout, couponController.addCoupon);
adminRoute.delete("/delete-coupon/:id", adminauth.isLogout, couponController.deleteCoupon);
adminRoute.get("/offers", adminauth.isLogout, offerController.loadofferlists);
adminRoute.get("/add-offers", adminauth.isLogout, offerController.loadoffers);
adminRoute.post("/add-offers", adminauth.isLogout, offerController.addOffers);
adminRoute.delete("/delete-offer/:id", adminauth.isLogout, offerController.deleteOffer);
adminRoute.put("/updateCategoryWithOffer",adminauth.isLogout,categoryController.addOffer)
adminRoute.put("/updateProductWithOffer",adminauth.isLogout,productController.addOffer)
adminRoute.post("/changeOrderStatus",adminauth.isLogout,orderController.changeStatus)
adminRoute.get("/logout", adminauth.isLogout, adminController.adminlogout);

module.exports = adminRoute;
