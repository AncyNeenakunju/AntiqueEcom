const mongoose= require("mongoose")

const dbconnect= ()=>{
    try{
    const conn=mongoose.connect("mongodb://127.0.0.1:27017/E-SHOP")
    console.log("DB connected succesfully")
    }
    catch(error){
      console.log("Database error")
    }
}


module.exports=(
  dbconnect
  )