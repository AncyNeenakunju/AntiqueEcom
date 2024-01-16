// Define a MongoDB schema for products
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create a schema for the Product collection
const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offers",
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  SKU: {
    type: String,
    unique: true,
  },
  category: {
    type: String,
    
  },
  subcategory: {
    type: String,
  },
  brand: {
    type: String,
  },
  weight: {
    type: Number,
  },
  dimensions: {
    length: {
      type: Number,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
  },
  images: [
    {
      filename: {
        type: String,
      }, // An array of image URLs or file paths
    },
  ],
  variations: [
    {
      size: {
        type: String,
      },
      color: {
        type: String,
      },
      // Add more variation attributes as needed
    },
  ],
  Isdeleted: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
  },
  numberOfReviews: {
    type: Number,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  stockQuantity: {
    type: Number,
  },
  
  
  // Add more fields as necessary
});

// Create a Product model based on the productSchema
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
