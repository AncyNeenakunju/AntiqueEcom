const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  orderDate: {
     type: Date,
     default: Date.now 
  }, 

  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },

  totalAmount: { 
    type: Number,
    required: true 
  }, 

 paymentMethod: { 
    type: String, 
    required: true 
}, 


shippingAddress:{
  name:String,
  houseNo:String,
  place:String,
  postOffice:String,
  District:String,
  State:String,
  Country:String,
  postalCode:String,
  email:String,
  mobile:Number
},
couponOffer:{type:Number},


shipping:{
 type:Number,
 default:50
},
orderItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number },
      price:{type:Number},
     
      Orderstatus: { 
        type: String, 
        enum: ['Pending', 'Shipped', 'Delivered','cancelled'], 
        default:'Pending' 
      },
      
    }
  ],
  paymentId:{
    type:String
  },
  paymentStatus:{
    type:String
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;