const User= require("../models/userModel")
const Razorpay=require('razorpay')
const Token= require("../models/Token")
const OTP=require("../models/userOTPVerification")
const Wallet=require("../models/walletModel")
const asyncHandler=require("express-async-handler")
const bcrypt=require ("bcryptjs")
const nodemailer=require("nodemailer")
const { generateToken } = require("../config/jwtToken")
const {sendmail,sendotp}=require("../services/emailverify")
const generateOTp= require("../services/generateOTP")
const shortid = require("shortid");
require("dotenv/config")
const moment = require('moment');
const userOTPVerification = require("../models/userOTPVerification")
const api=process.env.API_URL
const securePassword=asyncHandler( async(password)=>{
    try{
     const passwordHash= await  bcrypt.hash(password,10);
     return passwordHash;
    }
    catch(error){
          console.log(error.message)
    }
})

 
const loadIndex= asyncHandler(async(req,res)=>{
    try{
        res.render("users/index")
       }catch(error){
           console.log(error.message);
       }
})
//register starts
const loadregister= asyncHandler( async(req,res)=>{
    try{
      const referalCode=req.query.ref;
     res.render("users/register",{
      referalCode
     })
    }catch(error){
        console.log(error.message);
    }
})
function generateReferralCode() {
  // Implement your logic to generate a unique referral code
  // You can use shortid, generate a random string, or any other method
  // Example using shortid library
return shortid.generate();
}

const insertUser= asyncHandler(async (req,res)=>{
    try{
         
        let message="undefined";
        console.log(req.body)
        const email=req.body.email
        const referedCode=req.query.ref;
        console.log(req.query)
        const findUser=await User.findOne({email:email})
        if(!findUser)
        {
              
          const referralCode = generateReferralCode();
            const spassword= await securePassword(req.body.password)
            const user=new  User({
            firstname:req.body.firstName,
            lastname:req.body.lastname,
            email:req.body.email,
            mobile:req.body.mobile,
            password:spassword,
            Role:"user",
            isverified:"false",
            status:"Active",
            referralCode: referralCode,
        
        })
      
        const userData= await  user.save() 
            console.log(userData)
         if(userData){
 
             const wallet=new Wallet({
               user:userData._id
             })

             await wallet.save();
          if (referedCode) {
            // Find the referring user using the referral code
            const referringUser = await User.findOne({ referralCode: referedCode });
            const id=referringUser._id;
            if (referringUser) {
              console.log("ref")
              referringUser.referralHistory.push({
                referredUserId: userData._id,
              });
              await referringUser.save();
              
            const wallet=await Wallet.findOne({user:id})
             
              wallet.transactionHistory.push({
                transactionType: 'RefferalOffer',
                transactionAmount:"100",
                transactionDate: new Date(),
              });
          
              // Update the wallet balance
              wallet.balance = Number(wallet.balance) + 100;
          
          
              // Save the wallet to the database
              await wallet.save();


            }
          }
          const expirationTime = new Date();
          expirationTime.setHours(expirationTime.getHours() + 1);
      
            //generate token
            const token = new Token({
              userId: userData._id,
              token: generateToken(userData._id),
              expiresAt: expirationTime
            });
           const tokenData= await token.save()
            const link=`http://oldwonder.shop/confirm/${tokenData.token}`
            await sendmail(userData.email,link)
          res.render("users/register.ejs",{message:"Registration is done. Please check your mail for verification"})

         }
         else{
            res.render("users/register.ejs",{message:"Registration not done"})
        }
    }
    else{
        res.render("users/register.ejs",{message:"This mail_id  already registered . please login. "})
    }

    }
  
    catch(error){
        
     console.log(error.message)
        
    }

})

//Activate account

const activateAccount = asyncHandler(async (req, res) => {
    try {
      // Find the token in the database
      const token = await Token.findOne({ token: req.params.token });
  
      if (!token) {
        // Token not found, handle the error accordingly
        return res.status(404).send("Token not found.");
      }
  
      // Update the user's account status to "verified"
      await User.updateOne({ _id: token.userId }, { $set: { isverified: true } });
  
      // Remove the used token from the database
      await Token.findByIdAndRemove(token._id);
  
      // Send a response indicating that the account is verified
      //res.send("Account verified");
  
      // Redirect to the login page
      res.redirect("/login");;
    } catch (error) {
      console.log(error.message);
      // Handle the error, e.g., by sending an error response or rendering an error page.
      res.status(500).send("Internal Server Error");
    }
  });
  


//login user method

const loginLoad=asyncHandler(async(req,res)=>{
    try{

      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
          console.log(req.query)
          const intent=req.query.intent
          req.session.productId=req.query.id
           res.render("users/loginpage",{
            intent
          })
    }
    catch(error){
        console.log(error.message)
    }
})


const loginforget=asyncHandler(async(req,res)=>{
  try{
    const intent=req.query.intent
    console.log(intent)
    res.render("users/forget.ejs",{
        intent:intent
    })
}
catch(error){
  console.log(error.message)
}
})

const sendforget=asyncHandler(async(req,res)=>{
     const email=req.body.email
     const intent=req.body.int
     console.log(req.body)
    const userData=await User.findOne({email:email})
    console.log(userData._id)
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);
    if(userData){
      //generate token
      const token = new Token({
        userId: userData._id,
        token: generateToken(userData._id),
        expiresAt: expirationTime
      });
     const tokenData= await token.save()
      const link=`http://oldwonder.shop/resend-password?token=${tokenData.token}&intent=${intent}`
      await sendmail(userData.email,link)
       res.render("users/forget.ejs",{message:". Please check your mail for reset password",
         intent:intent
      })

   }
   else{
      res.render("users/forget.ejs",{message:"user not found"})
  }
})

 const loadresetpassword=asyncHandler(async(req,res)=>{
      const token=req.query.token
      const intent=req.query.intent
      console.log(intent)
      console.log(req.query)

      const tokenData = await Token.findOne({ token: token });
      if (tokenData && tokenData.expiresAt > new Date()) {
        // Token is valid, allow password reset
        res.render("users/reset.ejs",
        {
         token:token,
         intent:intent
        })
      } else {
        // Token has expired or is invalid
        res.render("users/token-expired.ejs");
      }


 })

 const resetpassword=asyncHandler(async(req,res)=>{

try {
    const intent = req.body.intent;
    console.log(req.query);
    const token = req.query.token;

    const spassword = await securePassword(req.body.password);
    const tokenData = await Token.findOne({token: token});
    console.log(tokenData);

    const user = await User.findOneAndUpdate(
        {_id: tokenData.userId},
        {$set: {password: spassword}},
        {new: true}
    );
    console.log(user);

    await Token.findByIdAndRemove(token._id);
    
    if (user) {
        res.redirect(`/login?intent=${intent}`);
    }
} catch (error) {
    console.log(error);
}
 })

 const verifyLogin= asyncHandler(async(req,res)=>{
    try{   

           console.log(req.session)
          const intent=req.query.intent;
          const email=req.body.email;
          const password=req.body.password
          req.session.intent=intent;

           const userData= await User.findOne({email:email})

           

           if(userData)
           {
        
           const expirationTime = new Date();
           expirationTime.setHours(expirationTime.getHours() + 1);
       
           const token = new Token({
             userId: userData._id,
             token: generateToken(userData._id),
             expiresAt: expirationTime
           });
             const tokenData= await token.save()
            if(userData) {
            const passwordMatch= await bcrypt.compare(password,userData.password)
            const username= userData.Name
                       if(passwordMatch)
                   {    
                    
                   res.cookie('jwt',tokenData.token, { httpOnly: true });
                res.redirect(`./send-otp/${tokenData.token}?intent=${intent}`);
                console.log(3)
            }
        else{
            res.render("users/loginpage.ejs",{
              intent:intent,
              
              message:"email and password is incorrect"
            })
        }
       }
      else{
    
        res.render("users/loginpage.ejs",{
          intent:intent,
          message:"email and password is incorrect"})
       }
      }
      else{
        res.render("users/loginpage.ejs",{
          intent:intent,
          message:"User doesn't exist please sign up"})
      }
      }catch(error)
         {
      console.log(error.message)
        }
})
                
const send_otp = asyncHandler(async (req, res) => {
        try {
           console.log(req.session)
           const intent=req.query.intent;
          const token1 = req.params.token;
          const token = await Token.findOne({ token: req.params.token });
          console.log(token)
          const userData = await User.findOne({ _id: token.userId });
          const otp = new OTP({
            user: token.userId,
            Otp: generateOTp(),
          });
       const otpData = await otp.save();
           console.log(userData)
          // Send the OTP to the client
          const clientOTP = otpData.Otp;
          await sendotp(userData.email,clientOTP)
          // Pass the 'expiresAt' as is (a Date object) to the client
          res.render("users/otp.ejs", {
            otp: clientOTP,
            token: token.token,
            intent:intent
          });
        } catch (error) {
          console.log(error.message);
        }
      });
      
  
  
  
      const verifyotp = asyncHandler(async (req, res) => {
        try {
          
          const intent=req.session.intent;
          const productId=req.session.productId;
          console.log(req.session)
          const submitotp = req.body.otp;
          console.log(submitotp)
          const otp= await OTP.find();
          console.log(otp)
          const createdotp=otp[0].Otp;
          const token = await Token.findOne({ token: req.params.token });
      
                 if (!token) {
            return res.status(404).send("Token not found");
                } else {
                  console.log(1)
            const userData = await User.findOne({ _id: token.userId })
      
            if (submitotp === createdotp) {
              console.log(2)
              // OTP is valid
              // Remove the OTP and token or generate a new token here
              await Token.findByIdAndRemove(token._id);
                       req.session.userId=userData._id;
                       res.json({success:true,intent:intent,id:productId})
            } else {
              res.json( {
                success:false,
                message: "Otp has expired. Please click the resend button",
              });
            }
          }
        } catch (error) {
          // Handle database or other errors
          console.error(error);
          return res.status(500).send("Internal Server Error");
        }
      });
      
  

  const resend_otp=asyncHandler( async(req,res)=>{
    // Generate and save OTP as shown above
    try{
          await OTP.deleteMany({})
        const token1= req.params.token
        
    const token = await Token.findOne({ token: req.params.token });

    if (!token) {
        return res.status(404).send("Token not found");
      }
     
    // Get the current time using the moment library
    const currentTime = new Date();
          const expiresAt = new Date(currentTime.getTime() + 20* 1000); // Set expiration to 5 seconds from the current time
      
    
          const userData = await User.findOne({ _id: token.userId});
          const otp = new OTP({
            user: token.userId,
            Otp: generateOTp(),
          });
      
          const otpData = await otp.save();
           console.log(userData)
          // Send the OTP to the client
          const clientOTP = otpData.Otp;
          await sendotp(userData.email,clientOTP)
          // Pass the 'expiresAt' as is (a Date object) to the client
          res.send({ success:true,
            otp: clientOTP,
            token: token.token,
            expires: expiresAt,
          });
        }

        
        catch (error) {
          console.log(error.message);
        }
      });

const showprofile= asyncHandler(async(req,res)=>{
  try {

    console.log(req.session)
    const userId = req.session.userId;

    // Assuming User is your Mongoose model
    const userData = await User.findOne({ _id: userId });
       console.log(userData)
    if (!userData) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Assuming you have an EJS template at 'views/users/profile.ejs'
    res.render("users/profile.ejs", {
        user: userData
    });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
}
})

const updateUser= asyncHandler(async(req,res)=>{
          
  const userId = req.session.userId;

  try {
      // Assuming `userData` is your Mongoose model
      const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          {
              // Update the fields you want to change
              email: req.body.email,
              mobile: req.body.mobile,
              // Add more fields as needed
          },
          { new: true, runValidators: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Optionally, you can send the updated user data in the response
      res.json(updatedUser);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }

})
const updateAddress= asyncHandler(async(req,res)=>{
          
  const userId = req.session.userId;

  try {
      // Assuming `userData` is your Mongoose model
      const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          {
            
           address:[
            {
            houseNo:req.body.houseNo,
            place:req.body.place,
            postOffice:req.body.postOffice,
            District:req.body.District,
            State:req.body.State,
            Country:req.body.Country,
            postalCode:req.body.postalCode  
           }]
          },
          { new: true, runValidators: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Optionally, you can send the updated user data in the response
      res.json(updatedUser);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }

})


const userlogout= async(req,res)=>{
    try{
        const user_Id=req.session.userId
       
        req.session.destroy()
         res.redirect("/")
         res.end();
    }
    catch(error){
        console.log(error.message)
    }
  }


const getReferals=asyncHandler(async(req,res)=>{
  const userId=req.session.userId;

  const userData = await User.findOne({ _id: userId });

  const referalCode=userData.referralCode
  res.render("users/refer.ejs",{
  referalCode
  })

});

const getWallet = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.userId;

    // Assuming you have a Wallet model
    const walletData = await Wallet.findOne({ user:userId });

    // Check if walletData is available
    if (!walletData) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Log walletData to the console
    console.log(walletData);
    res.render("users/wallet.ejs",{
      walletData
    });
  } catch (error) {
    // Handle any errors that might occur during the process
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

const getCredit = asyncHandler(async (req, res) => {
  try {

    const razorpayInstance= new Razorpay({
      key_id: process.env.RAZORPAY_ID_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });
    const creditAmount= req.body.amount;
    console.log(creditAmount)
    const userId = req.session.userId;
    
    // Assuming you have a Wallet model
    const wallet = await Wallet.findOne({ user: userId });

         if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
   
    else{
    // Create a Razorpay order
    const balance=wallet.balance;
    console.log("razor")
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: creditAmount * 100, // Amount in paisa
      currency: 'INR',
      receipt: 'order_receipt_' + Math.floor(Math.random() * 1000),
      payment_capture: 1,
    });

    // Update transaction history
    wallet.transactionHistory.push({
      transactionType: 'credit',
      transactionAmount: creditAmount,
      transactionDate: new Date(),
    });

    // Update the wallet balance
    wallet.balance = Number(wallet.balance) + Number(creditAmount);


    // Save the wallet to the database
    await wallet.save();

    res.json({ success: true, razorpayOrder, wallet, key:razorpayInstance.key_id, });
  }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = {
    loadIndex,
    loadregister,
    insertUser,
  loginLoad,verifyLogin,activateAccount,send_otp,verifyotp,resend_otp,
  userlogout,showprofile,updateUser,loginforget,sendforget,resetpassword,loadresetpassword,updateAddress,getReferals,getWallet,getCredit
}

