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
const easyinvoice = require('easyinvoice');
const fs = require("fs");
const he = require("he");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require('uuid');

const { log } = require("console");
require("dotenv/config");



const placeOrder=asyncHandler(async(req,res)=>{
    try{
      const razorpayInstance= new Razorpay({
        key_id: process.env.RAZORPAY_ID_KEY,
        key_secret: process.env.RAZORPAY_SECRET_KEY,
      });
    console.log(req.body)
    const userId = req.session.userId;
    
    console.log(req.session.userId)
    const user = await Users.findOne({ _id: userId });
     const paymentMethod=req.body.paymentMethod;
     const shipping=req.body.shipping
     console.log(shipping)
    // Assuming you have shipping address and total price in the request body
    const  totalPrice  = req.body.total;
    const couponOffer= req.body.couponOffer;
    const cartData = await Cart.findOne({ userId: userId }).populate('Items.product_id');
      console.log(cartData)
    const orderItems = cartData.Items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price:item.offerPrice,
     
    }));
    
//update stock
for (const item of orderItems) {
  const product = await products.findById(item.productId);
  if (product) {
      // Deduct ordered quantity from available stock
      product.stockQuantity -= item.quantity;
      await product.save();
  }
}

    if(paymentMethod==="COD")
    {
      const uniquePaymentId = uuidv4();
    const newOrder = new Order({
      userId: userId,
      totalAmount: totalPrice, 
      shippingAddress:shipping,
      couponOffer,
      paymentMethod:req.body.paymentMethod,
      paymentStatus:"COD",
      orderItems,
      paymentId: uniquePaymentId,
      });

    // Save the new order to the database
   await saveOrder(user,newOrder,shipping)
    
  res.status(200).json({ success: true, message: 'Order placed successfully.',paymentMethod:"COD" })
    }
  else if(paymentMethod==="online"){
    try{
      amount=totalPrice*100
    const razorpayOrder = await razorpayInstance.orders.create({
        amount: totalPrice * 100, // Amount in paisa
        currency: 'INR',
        receipt: 'order_receipt_' + Math.floor(Math.random() * 1000),
        payment_capture: 1,
    });

   console.log(razorpayOrder)
    // Create a new order with Razorpay details
    const newOrder = new Order({
        userId: userId,
        totalAmount: totalPrice,
        paymentMethod: paymentMethod,
        shippingAddress:shipping,
        paymentStatus:"pending",
        couponOffer,
        orderItems,
        paymentId: razorpayOrder.id, // Store Razorpay Order ID in your order document
    });

    // Save the new order to the database
    await saveOrder(user,newOrder,shipping)
 +
    // Return the Razorpay Order ID and redirect URL to the client
    res.status(200).json({
        success: true,
        key:razorpayInstance.key_id,
        message: 'Order placed successfully.',
        paymentMethod:'Online',         
        razorpayOrder
    });
  }catch (error) {
    console.error("Razorpay Order Creation Error:", error);

    
}

}
  else if (paymentMethod === "wallet") {
        try {
          // Assuming you have a Wallet model with a 'balance' field
          const wallet = await Wallet.findOne({ user: userId });
      
          if (!wallet) {
            return res.status(400).json({ success: false, message: 'Wallet not found for the user.' ,paymentMethod:"wallet" });
          }
      
          console.log(wallet.balance);
            
          if (wallet.balance >= totalPrice) {
            // Sufficient balance, proceed with the order
            // Deduct the total price from the wallet balance
            wallet.balance -= totalPrice;

            wallet.transactionHistory.push({
              transactionType: 'debit',
              transactionAmount: totalPrice,
              transactionDate: new Date(),
            });
            await wallet.save();
            const uniquePaymentId = uuidv4();
            // Create a new order
            const newOrder = new Order({
              userId: userId,
              totalAmount: totalPrice,
              paymentMethod: 'wallet',
              shippingAddress: shipping,
              couponOffer,
              paymentStatus:"paid",
              orderItems,
              paymentId: uniquePaymentId,
            });
      
            // Save the new order to the database
            await saveOrder(user,newOrder,shipping)
        
          } else {
            // Insufficient balance, return an error message
            res.status(400).json({ success: false, message: 'Insufficient wallet balance.',paymentMethod:"wallet"});
          }


          res.status(200).json({ success: true, message: 'Order placed successfully.',paymentMethod:"wallet" })


        } catch (error) {
          console.error("Error processing wallet payment:", error);
          res.status(500).json({ success: false, message: 'Internal Server Error' ,paymentMethod:"wallet"});
        }
      }
      
    }
  
catch (error) {      
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }



});



   
async function saveOrder(user,newOrder,shipping,){
  
  const userId=user._id;
  if (user.address && user.address.length > 0) {

    console.log("code")
    const isSameAddress = user.address.some((address) => {
      // Compare each field of the address
      console.log("address:",address)
      console.log("shipping",shipping)
      return (
       
          address.name === shipping.name &&
        address.houseNo === shipping.houseNo &&
          address.place === shipping.place &&
          address.postOffice === shipping.postOffice &&
          address.District === shipping.District &&
          address.State=== shipping.State &&
          address.Country === shipping.Country &&
          address.postalCode === shipping.postalCode &&
          address.email === shipping.email &&
          address.mobile=== parseInt(shipping.mobile)
      )
  });
  console.log("hello",isSameAddress)
    if (isSameAddress) {
      // If the address already exists, save the new order and update the cart
      await newOrder.save();
      await Cart.findOneAndUpdate({ userId: user._id }, { $set: { Items: [], totalPrice: 0 } });
  } else {
      // If the address doesn't exist, add it to the user's address array
      user.address.push(shipping);
      await user.save();
      await newOrder.save();
      await Cart.findOneAndUpdate({ userId: user._id }, { $set: { Items: [], totalPrice: 0 } });
  }
} 
 else{
  user.address = shipping;
    await user.save();
    await newOrder.save();
    await Cart.findOneAndUpdate({ userId: user._id }, { $set: { Items: [], totalPrice: 0 } });
  }
}


const order= asyncHandler(async(req,res)=>{

  try{
    const orders = await Order.find().populate('userId', 'firstname lastname').exec();
    const currentPage="order"
      res.render("admin/order.ejs",{
        currentPage,
        order:orders
      })
     }catch(error){
         console.log(error.message);
     }

})
const orderDetail= asyncHandler(async(req,res)=>{

  try{
    const orderId = req.query.id;
    console.log(orderId)
     const currentPage="orderDetails";
    // Use Mongoose to find the order by ID and populate the related user and product data
    const orderDetails = await Order.findById(orderId)
      .populate({
        path: 'userId',
        model: 'User', // Adjust the model name based on your actual user model
        
      })
      .populate({
        path: 'orderItems.productId',
        model: 'Product', // Adjust the model name based on your actual product model
      });

console.log(orderDetails.orderItems)

  res.render("admin/orderDetail.ejs",{
     order: orderDetails,
      currentPage
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

})

const getOrderupdate=asyncHandler(async(req,res)=>{
  const { orderId, status } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update the order status
    order.paymentStatus = status;
    await order.save();

    return res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
})

const getOrder= asyncHandler(async(req,res)=>{

  try{

    console.log("orderpage")
    const userId = req.session.userId
     const currentPage="orderDetails";
    // Use Mongoose to find the order by ID and populate the related user and product data
    const orderDetails = await Order.find({userId:userId}).sort({orderDate:-1})
      .populate({
        path: 'userId',
        model: 'User', // Adjust the model name based on your actual user model
        
      })
      .populate({
        path: 'orderItems.productId',
        model: 'Product', // Adjust the model name based on your actual product model
      });
   console.log(orderDetails)
  res.render("users/order.ejs",{
     order: orderDetails,
      currentPage
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

const getOrderPage= asyncHandler(async(req,res)=>{

  try{

    console.log("orderpage")
    const userId = req.session.userId
     const currentPage="orderDetails";
    // Use Mongoose to find the order by ID and populate the related user and product data
    const orderDetails = await Order.find({userId:userId}).sort({orderDate:-1})
      .populate({
        path: 'userId',
        model: 'User', // Adjust the model name based on your actual user model
        
      })
      .populate({
        path: 'orderItems.productId',
        model: 'Product', // Adjust the model name based on your actual product model
      });
   console.log(orderDetails)
  res.render("users/yourOrder.ejs",{
     order: orderDetails,
      currentPage
  })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})








const cancelOrder=asyncHandler(async(req,res)=>{

 
  try {
    console.log(req.body)
    console.log(1)
    const userId=req.session.userId;
    const orderId= req.body.orderId;
    const orderItemId=req.body.itemId
    const productId=req.body.productId
    // Retrieve the order and product details
    const order = await Order.findById(orderId);
    const product=await products.findById(productId)
    const cancelledProduct = order.orderItems.find(item => item._id.toString() === orderItemId.toString());
   
    if (!cancelledProduct) {
      return res.status(404).json({ success:false,message: 'Product not found in the order' });
    }

    // Check if the product has already been returned
    if (cancelledProduct.status === 'Cancelled') {
      return res.status(400).json({ success:false, message: 'Product already returned' });
    }

    // Update the status of the returned produc

    // Implement your logic to add credit amount to the wallet for online payment
    // This is a placeholder, and you should replace it with your actual logic
    if (order.paymentMethod === 'online'||order.paymentMethod === 'wallet') {
      let averageCoupon=0;
      if(order.couponOffer){
       const ItemNumber=order.orderItems.length;
        averageCoupon=(order.couponOffer)/ItemNumber;
      }
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
   return res.status(404).json({ success: false, message: 'Wallet not found' });
 }
 let amount;
   if(cancelledProduct.price!==null){
       amount=(cancelledProduct.price*returnedProduct.quantity)-averageCoupon
      }
      else{
     amount=(product.price*cancelledProduct.quantity)-averageCoupon
     }

// Update the wallet balance
wallet.balance = Number(wallet.balance) + Number(amount);
console.log(wallet.balance)
wallet.transactionHistory.push({
  transactionType: 'credit',
  transactionAmount: amount,
  transactionDate: new Date(),
});

// Save the wallet to the database
await wallet.save();
    }
 console.log(1)
    // Save the changes to the order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'orderItems._id': orderItemId },
      { $set: { 'orderItems.$.Orderstatus': "cancelled" } },
      { new: true }
    );
    product.stockQuantity += cancelledProduct.quantity;

    // Save the changes to the product
    await product.save();

console.log("updatedOrder:",updatedOrder)
    // Respond with success
    res.json({ message: 'Product returned successfully' });
  } catch (error) {
    console.error('Error returning product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

const getOrderDetails=asyncHandler(async(req,res)=>{
  try{

   
    const orderId = req.query.id;
    console.log(orderId)
     const currentPage="orderDetails";
    // Use Mongoose to find the order by ID and populate the related user and product data
    const orderDetails = await Order.findById(orderId)
      .populate({
        path: 'userId',
        model: 'User', // Adjust the model name based on your actual user model
        
      })
      .populate({
        path: 'orderItems.productId',
        model: 'Product', // Adjust the model name based on your actual product model
      });

console.log(orderDetails.orderItems)
if (!orderDetails.invoiceFilePath) {
  const invoice = await generateInvoice(orderDetails);

  // Save the invoice file
  const invoiceFilePath = path.join(__dirname, '..', 'invoices', `invoice_${orderId}.pdf`);
  fs.writeFileSync(invoiceFilePath, invoice.pdf, 'base64');

  // Update the order with the invoice file path
  orderDetails.invoiceFilePath = invoiceFilePath;
  await orderDetails.save();
}

// Provide a download route to the EJS template
const invoiceFileName = path.basename(orderDetails.invoiceFilePath);
const invoiceDownloadRoute = `/download/invoice/${encodeURIComponent(invoiceFileName)}`;

res.render('users/orderDetail.ejs', {
  order: orderDetails,
  invoiceDownloadRoute,
});

 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

})



const generateInvoice = async (order) => {

  
 /* const data = {
    documentTitle: 'Invoice', // Your document title
    currency: 'INR', // Currency code
    taxNotation: 'gst', // One of ['vat', 'gst']
    marginTop: 25,
    marginBottom: 25,
    sender: {
      company: 'Your Company',
      address: 'Your Address',
      zip: '12345',
      city: 'Your City',
      country: 'Your Country',
    },
    client: {
      company: order.userId.firstname + ' ' + order.userId.lastname,
      address: order.shippingAddress.name,
      zip: order.shippingAddress.postalCode,
      city: order.shippingAddress.District,
      country: order.shippingAddress.Country,
    },
    invoiceNumber: order._id.toString(),
    invoiceDate: new Date(),
    products: order.orderItems.map((item) => ({
      quantity: item.quantity,
      description: item.productId.name,
      tax: 18, // Tax rate in percent
      price: item.price,
    })),
  };
console.log(data)*/

console.log(order)
var data = {
  // If not using the free version, set your API key
  // "apiKey": "123abc", // Get apiKey through: https://app.budgetinvoice.com/register
  
  // Customize enables you to provide your own templates
  // Please review the documentation for instructions and examples
  "customize": {
      //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
  },
  "images": {
      // The logo on top of your invoice
    
      // The invoice background
      
  },
  // Your own data
  "sender": {
      "company": "Antique Shop",
      "address": "Flash House",
      "zip": "Patukulangara",
      "city": "Thuravoor",
      "country": "India"
      //"custom1": "custom value 1",
      //"custom2": "custom value 2",
      //"custom3": "custom value 3"
  },
  // Your recipient
  "client": {
   
    address: order.shippingAddress.name,
    zip: order.shippingAddress.postalCode,
    city: order.shippingAddress.District,
    country: order.shippingAddress.Country,
      // "custom1": "custom value 1",
      // "custom2": "custom value 2",
      // "custom3": "custom value 3"
  },
  "information": {
    "ShippingCharge":order.shipping,
      // Invoice number
      "number": order._id,
      // Invoice data
      "date": new Date().toLocaleDateString(),
       
  },
  // The products you would like to see on your invoice
  // Total values are being calculated automatically
  "products": order.orderItems.map((item) => ({
    "quantity": item.quantity,
    "description": item.productId.name,
    "Shipping Charge":50,
    "tax-rate":0,
    "price": item.price ? item.price : item.productId.price,
    "total": ((item.price ? item.price : item.productId.price) * item.quantity)
  })),
  
  // Omitting tax property to exclude VAT

  // The message you would like to display on the bottom of your invoice
  "bottom-notice":
    "ShippingCharge:Rs50",
   
  // Settings to customize your invoice
  "settings": {
      "currency": "USD", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
      // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
      // "margin-top": 25, // Defaults to '25'
      // "margin-right": 25, // Defaults to '25'
      // "margin-left": 25, // Defaults to '25'
      // "margin-bottom": 25, // Defaults to '25'
      // "format": "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
      // "height": "1000px", // allowed units: mm, cm, in, px
      // "width": "500px", // allowed units: mm, cm, in, px
      // "orientation": "landscape", // portrait or landscape, defaults to portrait
  },
  // Translate your invoice to your preferred language
  "translate": {
      // "invoice": "FACTUUR",  // Default to 'INVOICE'
      // "number": "Nummer", // Defaults to 'Number'
      // "date": "Datum", // Default to 'Date'
      // "due-date": "Verloopdatum", // Defaults to 'Due Date'
      // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
      // "products": "Producten", // Defaults to 'Products'
      // "quantity": "Aantal", // Default to 'Quantity'
      // "price": "Prijs", // Defaults to 'Price'
      // "product-total": "Totaal", // Defaults to 'Total'
      // "total": "Totaal", // Defaults to 'Total'
      // "vat": "btw" // Defaults to 'vat'
  },
};

//Create your invoice! Easy!
try{
  const invoice = await easyinvoice.createInvoice(data);
  
  return invoice;
} catch (error) {
  console.error('Error generating invoice:', error)

}
  
};

const getInvoice=asyncHandler(async(req,res)=>{
  try {
    const filename = req.params.filename;
    const invoiceFilePath = path.join(__dirname, '..', 'invoices', filename);

    // Send the invoice file as a downloadable attachment
    res.download(invoiceFilePath, filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

const changeStatus=asyncHandler(async(req,res)=>{
  try {
    const { orderId, orderItemId, newStatus } = req.body; 
    // Validate inputs (you may want to add more validation)
   
    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    // Update the order status in the database
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'orderItems._id': orderItemId },
      { $set: { 'orderItems.$.Orderstatus': newStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
})
 

const getOrderReturn=asyncHandler(async(req,res)=>{
  try {
    console.log(req.body)
    console.log(1)
    const userId=req.session.userId;
    const orderId= req.body.orderId;
    const orderItemId=req.body.ordeItemId
    const productId=req.body.productId
    // Retrieve the order and product details
    const order = await Order.findById(orderId);
    const product=await products.findById(productId)
    const returnedProduct = order.orderItems.find(item => item._id.toString() === orderItemId.toString());
    console.log("order:",order)
    console.log("returned:",returnedProduct)
    if (!returnedProduct) {
      return res.status(404).json({ success:false,message: 'Product not found in the order' });
    }

    // Check if the product has already been returned
    if (returnedProduct.status === 'Returned') {
      return res.status(400).json({ success:false, message: 'Product already returned' });
    }

    // Update the status of the returned produc

    // Implement your logic to add credit amount to the wallet for online payment
    // This is a placeholder, and you should replace it with your actual logic
    if (order.paymentMethod === 'online'||order.paymentMethod === 'wallet') {
      let averageCoupon=0;
      if(order.couponOffer){
       const ItemNumber=order.orderItems.length;
        averageCoupon=(order.couponOffer)/ItemNumber;
      }
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
   return res.status(404).json({ success: false, message: 'Wallet not found' });
 }
 let amount;
   if(returnedProduct.price!==null){
       amount=(returnedProduct.price*returnedProduct.quantity)-averageCoupon
      }
      else{
     amount=(product.price*returnedProduct.quantity)-averageCoupon
     }

// Update the wallet balance
wallet.balance = Number(wallet.balance) + Number(amount);
console.log(wallet.balance)
wallet.transactionHistory.push({
  transactionType: 'credit',
  transactionAmount: amount,
  transactionDate: new Date(),
});

// Save the wallet to the database
await wallet.save();
    }
 console.log(1)
    // Save the changes to the order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'orderItems._id': orderItemId },
      { $set: { 'orderItems.$.Orderstatus': "returned" } },
      { new: true }
    );

    product.stockQuantity += returnedProduct.Product.quantity;

    
    await product.save();

console.log("updatedOrder:",updatedOrder)
    // Respond with success
    res.json({ message: 'Product returned successfully' });
  } catch (error) {
    console.error('Error returning product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports={
    placeOrder,order,orderDetail,getOrder,getOrderPage,cancelOrder,getOrderDetails,getOrderupdate,changeStatus,getOrderReturn,getInvoice
}