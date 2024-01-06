const mongoose = require('mongoose');
const Razorpay=require('razorpay')
const products = require("../models/productModel");
const Users = require("../models/userModel");
const Category = require("../models/Category");
const Cart = require("../models/cartmodel.js");
const Order = require("../models/orderModel.js");
const Wallet = require("../models/walletModel.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const he = require("he");
const asyncHandler = require("express-async-handler");

const { log } = require("console");
require("dotenv/config");



const getpaymentFailure = asyncHandler(async (req, res) => {
  
    const eventData = req.body;
   
    // Extract relevant information
    const orderId = eventData.payload.payment.entity.order_id;
    const paymentId = eventData.payload.payment.entity.id;
    const failureReason = eventData.payload.payment.entity.failure_reason || 'Unknown reason';
    // Update database with payment failure status
    const order = await Order.findOne( {paymentId:orderId});
    console.log(order)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Update the order status
  order.paymentStatus = "failed";
   await order.save();
  
   res.status(200).send('Webhook received successfully');
   
  
  });
  
  const updatepaymentStatus=asyncHandler(async(req,res)=>{
   try{
    const orderId = req.params.orderId;
    const { status } = req.body;
    let order;
        console.log(orderId,status)
    // Find the order in the database
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      // If orderId is a valid ObjectId, query by _id
      order = await Order.findOne({ _id: orderId });
    } else {
      // If orderId is not a valid ObjectId, query by razorpayOrderId
      order = await Order.findOne({ paymentId: orderId });
    }
    console.log(order)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
  
    // Update the order status
    order.paymentStatus = status;
    if(status==="COD"){
        order.paymentMethod="COD";
        order.paymentId="failed";
    }
     await order.save();
    // Respond with the updated order
    res.json({ success: true, order });
  }catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

const checkPaymentStatus=asyncHandler(async(req,res)=>{
    const orderId = req.query.orderId;
    const order = await Order.findOne({ paymentId: orderId });
  
    if (!order) {
      return res.json({ success: false, failure: false });
    }
  
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true ,});
    } else if (order.paymentStatus === 'failed') {
      return res.json({ failure: true ,orderId:order._id});
    }
  
    res.json({ success: false, failure: false });
  });


  const gettryAgain = asyncHandler(async (req, res) => {
    try {
      // Assuming you have an Order model, replace it with your actual model
  
  
      // Get the orderId from the request parameters
      const orderId = req.query.orderId; // Adjust this based on your route
       
      // Fetch the order from the Order model using the orderId
      const orderDetails = await Order.findById(orderId)
      
      .populate({
        path: 'orderItems.productId',
        model: 'Product', // Adjust the model name based on your actual product model
      });
      // Check if the order exists
      if (!orderDetails) {
        // Handle case where order is not found
        return res.status(404).send('Order not found');
      }
      
      // Render the tryAgain page and pass the order data
      res.render('users/tryAgain', { order: orderDetails });
    } catch (error) {
      // Handle any errors that occurred during the try block
      console.error('Error fetching order:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
const getpaymentPage=asyncHandler(async(req,res)=>{
    
        try {
            const orderId = req.query.orderId;
    
            // Assuming you have a function to fetch order details from the database
            const orderDetails = await Order.findOne({_id:orderId});
    
            // Assuming you have an order page template (e.g., "orderPage.ejs")
            res.render('users/payment', { orderDetails });
        } catch (error) {
            // Handle errors appropriately
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
    


  module.exports={
       getpaymentFailure,checkPaymentStatus,updatepaymentStatus,gettryAgain,getpaymentPage
  }