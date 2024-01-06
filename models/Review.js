const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productid: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: Number,
    comment: String,

  });
  const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
