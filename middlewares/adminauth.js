const isLogin =async(req,res,next)=>{
    try{
        console.log("hi")
          if(req.session.user_id){
          }    
         else{
         next()  
    }
      
    }
    catch(error){
       console.log(error.message)
    }
}



const isLogout =async(req,res,next)=>{
    try{
        console.log("hello")
       if(req.session.user_id)
       {
           next();
       } 
       else{
        res.redirect("/admin/")
       }
    }
    catch(error){
        console.log(error.message)
    }

}

module.exports={
    isLogin,isLogout
}