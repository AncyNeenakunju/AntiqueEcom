const mongoose=require("mongoose")
const { stringify } = require("querystring")



const tokenSchema=new mongoose.Schema({
   userId:{
    type:String,
    ref:"user",
    required:true
   },
   token:{
    type:String,
    required:true
   },
   expiresAt: {
      type: Date,
      required: true
   }

})

module.exports=mongoose.model("token",tokenSchema)