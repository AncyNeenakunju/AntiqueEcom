const dbconnect = require("./config/dbConnect.js");
const express = require("express");
const morgan = require("morgan");
const { notFound, errorHandler, successHandler } = require("./middlewares/errorHandler");
const path = require("path");
const fs=require('fs')
require("dotenv/config");
const app = new express();

const invoiceDirectory = path.join(__dirname, 'invoices');

// Check if the directory exists, create it if not
if (!fs.existsSync(invoiceDirectory)) {
  fs.mkdirSync(invoiceDirectory);
}
//middlewares
app.use(express.urlencoded({ extended: "true" }));
app.use(express.json({ extended: true }));
app.use(morgan("tiny"));
dbconnect();
const api = process.env.API_URL;

const userRouter = require(path.join(__dirname, ".", "routes", "userRoute.js"));
const adminRouter = require(
  path.join(__dirname, ".", "routes", "adminRoute.js"),
);
app.use(`/`, userRouter);
app.use(`/admin`, adminRouter);
app.use(notFound);
app.use(errorHandler);
//product route
//const productRouter=require("../routes/productroute")
//app.use(`${api}/products`,productRouter)


const port = 8080;
const domain = 'antique.com'; // replace with your actual domain

// Updated code
app.listen(port, () => {
  console.log(api);
  console.log(`Server is running http://${domain}:${port}/api/v1`);
});

