
const mongoose = require('mongoose');
const walletSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique:true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactionHistory: [
    {
      transactionType:{
        type:String,
        enum:["credit","debit","RefferalOffer"],
      },
      transactionAmount:{
       type:Number,
      },
      transactionDate:{
          type:Date,
          default:Date.now,
      }
    }
    ],
  });
  
  module.exports = mongoose.model("Wallet", walletSchema);