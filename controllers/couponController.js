const Coupon= require("../models/coupon")
const Token= require("../models/Token")
const Order= require("../models/orderModel")
const asyncHandler=require("express-async-handler")

const loadcouponlists=asyncHandler(async(req,res)=>{
  try {
   
    const currentPage = "coupons";
    const coupons = await Coupon.find();
     console.log(coupons)
    res.render("admin/couponlists.ejs", {
      currentPage,
      coupons,
    });
  } catch (error) {
    console.log(error);
  
    // Assuming `res` is available in your context, send an error response
    res.status(500).send("Internal Server Error");
  }
  
})

const loadcoupons= asyncHandler(async(req,res)=>{

    try{
        const currentPage="coupons"
        res.render("admin/coupon.ejs",{
            currentPage
        })

        
       }catch(error){
           console.log(error.message);
       }

})

const addCoupon=asyncHandler(async (req, res) => {
    try {
      // Extract coupon details from the request body
      console.log(req.body)
      const {couponTitle,couponDescription, couponCode,  discountType, discountAmount,
      flatDiscountAmount,
      minPurchase, validFrom, validUntil } = req.body;
  
       
      // Create a new coupon instance
      const newCoupon = new Coupon({
        couponTitle:couponTitle,
        couponDescription:couponDescription,
        code:couponCode,
        discountType: discountType,
        discountAmount:discountAmount,
        flatamount:flatDiscountAmount,
        minPurchase:  minPurchase,
        validFrom,
        validUntil,
      });
  
      // Save the coupon to the database
      await newCoupon.save();
  
      // Send a success response to the client
      res.status(200).json({ success: true, message: 'Coupon added successfully!' });
    } catch (error) {
      // Handle errors and send an error response
      console.error(error);
      res.status(500).json({ success: false, message: 'InternalServerError!' });
    }
  });

   const deleteCoupon=asyncHandler(async(req,res)=>{
    const couponId = req.params.id;

    try {
      // Find the coupon in the database by ID and remove it
      const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
  
      if (deletedCoupon) {
        // Coupon found and deleted successfully
        res.json({ success: true });
      } else {
        // Coupon not found
        res.status(404).json({ success: false, error: 'Coupon not found' });
      }
    } catch (error) {
      // Handle any errors that occur during the deletion
      console.error('Error during coupon deletion:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
   })


  module.exports={
    loadcoupons,addCoupon,loadcouponlists,deleteCoupon
  }