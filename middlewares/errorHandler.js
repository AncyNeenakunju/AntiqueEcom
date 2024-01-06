//not found
const path=require('path')
const notFound= (req,res,next)=>{
    const error =new Error(`Not Found: ${req.originalUrl}`);
    res.status(404);
    next(error)
}

//error handler

const errorHandler =(err,req,res,next)=>{
    const statuscode=res.statusCode===200 ? 500 :res.statusCode;
    res.status(statuscode)
    console.log(statuscode)
    if(statuscode===404){
    res.sendFile(path.join(__dirname,'..' ,'views', '404.html'));
    }
    if(statuscode===500){
        res.sendFile(path.join(__dirname,'..' ,'views', '500.html'));
    }
    /*res.json({
        message:err?.message,
        stack:err?.stack
    })*/
};
module.exports={ errorHandler,notFound}