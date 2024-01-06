const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponTitle: {
    type: String,
    required: true,
    unique: true,
  },
  couponDescription: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: {
    type: String,
    required: true,
  },
  flatamount:{
     type: Number
  },
  discountAmount: {
    type: Number,
  
  },
  minPurchase:{
    type:Number
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true, // Add createdAt and updatedAt timestamps
});

// Calculate the TTL dynamically based on the difference between validUntil and the current date
couponSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
