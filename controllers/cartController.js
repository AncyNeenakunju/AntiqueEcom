const products = require("../models/productModel");
const Users = require("../models/userModel");
const Wallet= require("../models/walletModel");
const Wishlists= require("../models/whishlistModel");
const Coupon = require("../models/coupon");
const Category = require("../models/Category");
const Cart = require("../models/cartmodel.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const he = require("he");
const asyncHandler = require("express-async-handler");
const { log } = require("console");
const { objectId } = require("mongodb");
const { compileFunction } = require("vm");

const getcartPage = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log(userId);

    const cartData = await Cart.findOne({ userId: userId }).populate('Items.product_id');
         console.log(cartData)
    if (cartData) {
      const productInfo = cartData.Items.map(item => ({
        quantity: item.quantity,
        productData: item.product_id,
}));
      const totalprice = cartData.totalPrice;

      res.render("users/cartpage.ejs", {
        cart: productInfo,
        userId,
        totalprice,
      });
    } else {
      res.render("users/cartpage.ejs", {
        cart: [],
        userId,
      });
    }

  } catch (error) {
    console.error("Error fetching cart data:", error);
    // Handle the error, perhaps by sending an error response to the client
    res.status(500).send("Internal Server Error");
  }
});

  

const addtoCart = asyncHandler(async (req, res) => {
  
    try {
      console.log(req.query.id);
      const userId = req.session.userId;
      const productId = req.query.id;
      const product = await products.findOne({ _id: productId });
      const cart = await Cart.findOne({ userId: userId });
      console.log(cart);
    
      // Check if the product exists and has sufficient stock
      if (!product || product.stockQuantity <= 0) {
        return res.status(400).json({ success: false, message: 'Product not available or out of stock.' });
      }
    
      if (cart) {
        console.log(1);
        const itemIndex = cart.Items.findIndex((p) => p.product_id.toString() === product._id.toString());
        console.log(itemIndex);
        if (itemIndex > -1) {
          // Product exists in the cart, update the quantity
          let productItem = cart.Items[itemIndex];
    
          // Check if adding one more quantity will exceed the available stock
          if (productItem.quantity + 1 > product.stockQuantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock.' });
          }
    
          productItem.quantity++;
          cart.Items[itemIndex] = productItem;
        } else {
          // Check if adding a new product will exceed the available stock
          if (cart.Items.length + 1 > product.stockQuantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock.' });
          }
    
          cart.Items.push({
            product_id: product._id,
            quantity: 1,
            price: product.price,
          });
        }
    
        cart.totalPrice = cart.Items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
    
        const totalItemCount = cart.Items.reduce(
          (count, item) => count + item.quantity,
          0,
        );
    
        const cartData = await cart.save();
        res.json({ cartData, totalItemCount });
      } else {
        // Check if creating a new cart will exceed the available stock
        if (1 > product.stockQuantity) {
          return res.status(400).json({ success: false, message: 'Insufficient stock.' });
        }
    
        const price = product.price;
        const newCart = new Cart({
          userId: userId,
          Items: [
            {
              product_id: productId,
              quantity: 1,
              price: price,
            },
          ],
          totalPrice: price,
        });
    
        const cartData = await newCart.save();
        res.status(200).json({
          success: true,
          message: 'Added to cart Successfully',
          cart: cartData,
          totalItemCount: 1,
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
    
});

const updateCart = asyncHandler(async (req, res) => {
 // Assuming you have a Product model

  // Your existing code..
    console.log(req.body);
    const userId = req.session.userId; // Assuming userId is stored in the session
  
    const updatedCart = req.body.cart;
    const totalprice = req.body.totalprice;
  
    try {
      // Fetch product details for the products in the cart
      const productIds = updatedCart.map((product) => product.product_id);
      const Products = await products.find({ _id: { $in: productIds } });
  
      // Check if the quantity in the cart exceeds the available stock for any product
      const stockCheck = Products.every((product, index) => {
        return product.stockQuantity >= updatedCart[index].quantity;
      });
  
      if (!stockCheck) {
        return res.json({ success: false, message: 'Not enough stock for some products' });
      }
  
      // Continue with the cart update logic
      const filterForCart = { userId: userId };
      const updateForCart = {
        Items: updatedCart,
        totalPrice: totalprice,
      };
  
      const updatedCartDoc = await Cart.findOneAndUpdate(
        filterForCart,
        updateForCart,
        { new: true, upsert: true },
      );
  
      console.log("Cart updated successfully");
      res.json({ success: true, message: "Cart updated successfully", cart: updatedCartDoc });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });
  

const deleteCart=asyncHandler(async(req,res)=>{
  const userId = req.params.userId;
  const productId = req.params.productId;
  console.log(userId,productId)
  // Use Mongoose to find the user's cart and update it to remove the specified product
  const updatedCart = await Cart.findOneAndUpdate(
    { userId: userId },
    { $pull: { Items: { product_id: productId } } },
    { new: true }
  );

  if (updatedCart) {
    res.status(200).json({ success: true, message: 'Item removed from the cart successfully', cart: updatedCart });
  } else {
    res.status(404).json({ success: false, message: 'User or product not found in the cart' });
  }
})

const getcheckoutpage = asyncHandler(async (req, res) =>{
    try {
  
          const orderTotal = req.query.total;
      const userId = req.session.userId;
      const userDetails = await Users.findOne({ _id: userId });
      const cartDetails = await Cart.findOne({ userId: userId }).populate('Items.product_id');
      const coupon=await Coupon.find();
      const walletData=await Wallet.findOne({user:userId})
      const productDetails = cartDetails.Items.map(item => ({
        productData: item.product_id,
        quantity: item.quantity,
        offerPrice:item.offerPrice
      }));
       console.log(productDetails)
      const totalprice = cartDetails.totalPrice;
      console.log(userDetails)
      let Discount=0;
      const savedAddress = userDetails.address ? true : false;
  /*    if(userDetails.referralHistory.length>0){
              console.log(userDetails.referralHistory)
             for(i=0;i<userDetails.referralHistory.length;i++){
                Discount=Discount+10;
             }   
             userDetails.referralHistory = [];

             // Save the updated user data to the database
             await userDetails.save();
        }*/
      res.render("users/checkoutpage.ejs", {
        Discount,
        coupon:coupon,
        user: userDetails,
        totalprice: totalprice,
        cart: productDetails,
        savedAddress: savedAddress,
        orderTotal,
        walletData
      });
    
    } catch (error) {
      console.log(error.message);
    }    
});


const getwishlist = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log(userId);

    const wishlistData = await Wishlists.findOne({ user: userId }).populate('products.product');
       console.log(wishlistData)
    if (wishlistData) {
      const productInfo = wishlistData.products.map(item => ({
        quantity: item.quantity,
        productData: item.product,
         }));
    

      res.render("users/whishlist.ejs", {
        wishlist: productInfo,
        userId,
      
      });
    } else {
      res.render("users/whishlist.ejs", {
       wishlist: [],
        userId,
      });
    }

  } catch (error) {
    console.error("Error fetching whishlist data:", error);
    // Handle the error, perhaps by sending an error response to the client
    res.status(500).send("Internal Server Error");
  }
});


const addtoWhislist = asyncHandler(async (req, res) => {
  try {

    console.log("1")
    const userId = req.session.userId;
    const productId = req.query.id;
 console.log(productId)
    // Step 1: Check if the user has a wishlist
    let wishlist = await Wishlists.findOne({ user: userId });

    // Step 2: If the wishlist exists
    if (wishlist) {
      // Step 3: Check if the product is already in the wishlist
      const itemIndex = wishlist.products.findIndex((p) => p.product.toString() === productId.toString()
      );

      // Step 4: If the product is already in the wishlist
      if (itemIndex > -1) {
        return res.status(400).json({
          success: false,
          message: 'Product is already in the wishlist.',
        });
      }

      // Step 5: If the product is not in the wishlist, add it
      wishlist.products.push({
        product: productId,
        // Add other product details like quantity, price, etc. as needed
      });

      console.log(wishlist)
      wishlist = await wishlist.save();
      res.json({
        success: true,
        message: 'Product added to wishlist successfully.',
        wishlist: wishlist,
      });
    } else {
      // Step 6: If the user doesn't have a wishlist, create a new wishlist
      wishlist = new Wishlists({
        user: userId,
        products: [
          {
            product: productId,
            
          },
        ],
      });

      // Save the new wishlist
      wishlist = await wishlist.save();
    }

    // Step 7: Respond with success message
    res.json({
      success: true,
      message: 'Product added to wishlist successfully.',
      wishlist: wishlist,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, error: error.message });
  }
});

  

module.exports = {
  getcartPage,
  addtoCart,
  getcheckoutpage,
  updateCart,
  deleteCart,
  getwishlist,
  addtoWhislist
};
