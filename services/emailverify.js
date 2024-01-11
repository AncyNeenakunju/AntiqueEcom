const asyncHandler=require("express-async-handler")

const nodemailer=require("nodemailer")
require("dotenv/config")
const sendmail= asyncHandler( async(email,link)=>{
    try{

           console.log(link)
         let transporter= nodemailer.createTransport({
             service:"gmail",
             auth:{
               user:process.env.USER,
               pass:process.env.PASSWORD
             }
         
         });
         //SEND MAIL
          
         let info=await  transporter.sendMail({
             from:process.env.USER,
             to:email,
             subject:"Account verification",
             text:"Welcome",
             html:`
             <div>
             <a href="${link}" class="text-warning">click here to ${link}activate your account</a>
             </div>`
             //mailbody ends
             })
             console.log("mailsend successful")
    }
    catch(error){
 console.log(error)
    }
 })
 const sendotp= asyncHandler( async(email,otp)=>{
   try{
      
        console.log(process.env.USER,process.env.PASSWORD)

        let transporter= nodemailer.createTransport({
            service:"gmail",
            auth:{
              user:process.env.USER,
              pass:process.env.PASSWORD
            }
        
        });
        //SEND MAIL

        let info=await  transporter.sendMail({
         from:process.env.USER,
         to:email,
         subject:"Account verification",
         text:"Welcome",
         html:`
         <div>
         your otp is ${otp}. Use this to login
         </div>`
         //mailbody ends
         })
         console.log("mailsend successful")
   }
   catch(error){
console.log(error)
   }
})

 module.exports={
    sendmail,sendotp
 }