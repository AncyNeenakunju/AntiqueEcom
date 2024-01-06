const User= require("../models/userModel")

const asyncHandler=require("express-async-handler")



const loadcustomer= asyncHandler(async(req,res)=>{

    const currentPage="customer"
    var search="";
    if(req.query.search){
       search=req.query.search;
    }
   // const userData= await User.findById({_id:req.session.user_id})
   const user=await User.find({
       isverified:"true",
         $or:[
            {firstname:{$regex:'.*'+search+'.*',$options:'i'}},
           {mobile:{$regex:'.*'+search+'.*',$options:'i'}},
           {email:{$regex:'.*'+search+'.*',$options:'i'}}
        ]
       })

       console.log("user",user)
    res.render("admin/user.ejs",{
        currentPage,
        users:user})
})


    const blockUser = asyncHandler( async (req, res) => {
        try {
            console.log(1)
            const id = req.query.id;
            const userData = await User.findById(id);
            console.log(userData)
        if(userData)
        {
                userData.status = "blocked";
                await userData.save(); // Save the updated user data
                console.log(userData)
                res.json({success:true,message:"user blocked"})// Send a success response
            }
           
        
            else {
                res.json({success:false, message: "User not found" }); // Send a not found response
            }
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: "Internal Server Error" }); // Send an error response
        }
    
    });
    const unblockUser = asyncHandler( async (req, res) => {
        try {
            console.log(1)
            const id = req.query.id;
            const userData = await User.findById(id);
            console.log(userData)
        if(userData)
        {
                userData.status = "Active";
                await userData.save(); // Save the updated user data
                console.log(userData)
                res.json({success:true,message:"user blocked"})// Send a success response
            }
           
        
            else {
                res.json({success:false, message: "User not found" }); // Send a not found response
            }
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: "Internal Server Error" }); // Send an error response
        }
    
    });
    const changeRole = asyncHandler( async (req, res) => {
        try {
            console.log(1)
            const id = req.query.id;
            const userData = await User.findById(id);
            console.log(userData)
        if(userData)
        {
            if (userData.Role==="user") {
                userData.Role = "admin";
                await userData.save(); // Save the updated user data
                console.log(userData)
                res.redirect( "/admin/customers" ); // Send a success response
            }
            else if(userData.Role==="admin"){

                userData.Role = "user";
                await userData.save(); // Save the updated user data
                res.redirect( "/admin/customers" ); // Send a success response

            }
            
        }
            else {
                res.status(404).json({ message: "User not found" }); // Send a not found response
            }
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: "Internal Server Error" }); // Send an error response
        }
    
    });


module.exports={
    loadcustomer,blockUser,changeRole,unblockUser
}