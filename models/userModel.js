const mongoose=require("mongoose")
const { stringify } = require("querystring")

const userschema=new mongoose.Schema({
    firstname:{
        type:String,
       required:true,
       index:true,
    },
    lastname:{
        type:String,
       required:true,
       index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:"Active"
    },
     address:[{
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
     }],

    Role:{
        type:String,
        default:"user"
    },
    isverified:{
        type:Boolean,
        default:false
    },
    referralCode: {
        type: String,
        unique: true,
      },
      referralHistory: [{
        referredUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        referredAt: {
          type: Date,
          default: Date.now,
        },
      }],
    createddate:{
        type:Date,
        default:Date.now
    }  
})
module.exports=mongoose.model("User",userschema)