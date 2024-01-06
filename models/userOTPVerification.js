const mongoose=require("mongoose")
const { stringify } = require("querystring")

const UserotpVerificationSchema=new mongoose.Schema({
   user:{
      type:String,
      ref:"user"
   },
   Otp:String,
   createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 5,
    },

})

module.exports=mongoose.model("UserotpVerification", UserotpVerificationSchema)