const IsLogin =async(req,res,next)=>{
  try {
    if (req.session.userId) {
        // User is logged in
        next();
    } else {
        // User is not logged in
        console.log("no session");
        next(); // Only call next if you want to proceed to the next middleware/route
    }
} catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
}
}



const IsLogout =async(req,res,next)=>{
    try{
        
       if(req.session.userId)
       {    
         next()
       } 
          else{
         if(req.query.id){
         res.redirect(`/login?intent=${req.query.intent}&id=${req.query.id}`)
    
         }
         else{
            
             
            res.redirect(`/login?intent=${req.query.intent}`)
             
         }

        
          next();
            }  
    }
    catch(error){
        console.log(error.message)
    }
}


module.exports={
    IsLogin,
    IsLogout
}