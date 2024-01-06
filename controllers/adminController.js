const User= require("../models/userModel")
const Token= require("../models/Token")
const Order= require("../models/orderModel")
const products= require("../models/productModel")
const asyncHandler=require("express-async-handler")
const bcrypt=require ("bcryptjs")
const nodemailer=require("nodemailer")
const { generateToken } = require("../config/jwtToken")
require("dotenv/config")
const moment = require('moment')
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

 
const loadlogin= asyncHandler(async(req,res)=>{
    try{
        res.render("admin/login.ejs")
       }catch(error){
           console.log(error.message);
       }
})

const verifyLogin= asyncHandler(async(req,res)=>{
    try{
       
          const email=req.body.email
          const password=req.body.password
           const userData= await User.findOne({email:email})
           console.log(userData)
           const expirationTime = new Date();
           expirationTime.setHours(expirationTime.getHours() + 1);
       
           const token = new Token({
             userId: userData._id,
             token: generateToken(userData._id),
             expiresAt: expirationTime
           });
      const tokenData= await token.save()
            if(userData && userData.Role==="admin") {
            const passwordMatch= await bcrypt.compare(password,userData.password)
            const username= userData.Name
            if(passwordMatch)
            {    
                console.log(userData)
                req.session.user_id=userData._id
                res.cookie('jwt',tokenData.token, { httpOnly: true });
                res.redirect(`/admin/dashboard`);

                
            }
        
        else{
            res.render("admin/login.ejs",{message:"email and password is incorrect"})
        }
       }
      else{
    
        res.render("admin/login.ejs",{message:"email and password is incorrect"})
       }
      }catch(error)
         {
      console.log(error.message)
        }
})
                




const loaddashboard = asyncHandler(async (req, res) => {
    try {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's revenue
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: today },
                    paymentStatus: "paid"
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch total revenue
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid"
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch today's sales count
        const todaySales = await Order.countDocuments({
            orderDate: { $gte: today },
            paymentStatus: "paid"
        });

        // Fetch total sales count
        const totalSales = await Order.countDocuments({status: { $ne: 'Pending' }});

        console.log('Today Revenue:', todayRevenue);
        console.log('Total Revenue:', totalRevenue);
        console.log('Today Sales:', todaySales);
        console.log('Total Sales:', totalSales);

        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        // Fetch monthly revenue
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: new Date(today.getFullYear(), 0, 1) },
                    paymentStatus: "paid"
                },
            },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch monthly sales count
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: new Date(today.getFullYear(), 0, 1) },
                    paymentStatus: "paid"
                },
            },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const filledMonthlyRevenue = allMonths.map(month => ({
            _id: month,
            total: (monthlyRevenue.find(entry => entry._id === month) || { total: 0 }).total,
        }));

        const filledMonthlySales = allMonths.map(month => ({
            _id: month,
            count: (monthlySales.find(entry => entry._id === month) || { count: 0 }).count,
        }));
       console.log(filledMonthlyRevenue)
        // Render the home template with the fetched data
        const currentPage="dashboard"
        res.render("admin/dash.ejs",{
            currentPage,
            todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            todaySales,
            totalSales,
            monthlyRevenue,
            monthlySales,
            filledMonthlyRevenue,
            filledMonthlySales,
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}


       
);

const  addcategory= asyncHandler(async(req,res)=>{

    try{
        res.render("admin/category.ejs")
       }catch(error){
           console.log(error.message);
       }

})


const getSalesReport = asyncHandler(async (req, res) => {
    try {

        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Define a filter object based on the provided dates
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createddate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            dateFilter.createddate = { $gte: new Date(startDate) };
        } else if (endDate) {
            dateFilter.createddate = { $lte: new Date(endDate) };
        }

        const orders = await Order.find(dateFilter);

        const orderCountsByMonth = orders.reduce((acc, order) => {
            const orderMonth = order.orderDate.getMonth();
            const orderYear = order.orderDate.getFullYear();
            const key = `${orderYear}-${orderMonth + 1}`;

            acc[key] = (acc[key] || 0) + 1;

            return acc;
        }, {});

        const salesChartData = {
            labels: Object.keys(orderCountsByMonth),
            values: Object.values(orderCountsByMonth)
        };

        res.json({ success: true,sales:salesChartData })
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});


const getSalesReportpdf= asyncHandler(async(req,res)=>{
    try {
        const admin = req.session
        const orderDta = await Order.find()
        .sort({orderDate:-1})
        .populate({
            path : 'orderItems.productId',
            model : 'Product',
         })
        .populate('userId')
        
        res.render('admin/salesReport.ejs',{
           
            order : orderDta
        })
    } catch (error) {
        console.log(error.message);
    }
})

const filter = asyncHandler( async (req, res) => {
    try {
        const { startDate, endDate, statusFilter } = req.body;
        console.log(req.body);

        const query = {};

        if (statusFilter !== "") {
            query.paymentStatus = statusFilter;
        }

        if (startDate && endDate) {
            query.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
 console.log(query)
        const orders = await Order.find(query)
            .populate({
                path: 'orderItems.productId',
                model: 'Product',
              
            })
            .populate('userId')
            .sort({orderDate:-1})
            .exec();
console.log(orders)
        res.json({ result: orders });
    } catch (error) {
        console.error("Error in getOrdersByDate:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const adminlogout= async(req,res)=>{
    try{
        const user_Id=req.session.user_id
        const token = await Token.findOne({ userId:user_Id});
        await Token.findByIdAndRemove(token._id);
        req.session.destroy()
         res.redirect("/admin/")
         res.end();
    }
    catch(error){
        console.log(error.message)
    }
  }

module.exports= {
    loadlogin,verifyLogin,loaddashboard,addcategory,adminlogout,getSalesReport,getSalesReportpdf,filter
}