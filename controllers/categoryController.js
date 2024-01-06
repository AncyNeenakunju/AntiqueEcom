const products= require("../models/productModel")
const Category= require("../models/Category")
const Offer= require("../models/offer")
const asyncHandler=require("express-async-handler")


const loadCategory=asyncHandler(async(req,res)=>{
    const offers=await Offer.find()
    const category = await Category.find();
   
    const currentPage="dashboard"
    res.render("admin/Category.ejs",{
        category:category,
        currentPage,
        offers
      }) 
}) 

const loadeditCategory=asyncHandler(async(req,res)=>{
    
    const categoryId = req.query.id; // Assuming the category_id is in the query parameters

    try {
        // Find the category based on the categoryId
        const category = await Category.findById(categoryId);

        if (!category) {
            // Handle case where category is not found
            return res.status(404).send('Category not found');
        }

        const currentPage = "dashboard";
        res.render("admin/editCategory.ejs", {
            category: category,
            currentPage,
        });
    } catch (error) {
        // Handle other errors (e.g., database error)
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}) 


const loadaddcategory=asyncHandler(async(req,res)=>{
     
    const category=await Category.find()
    if(category)
    {
    res.render("admin/addcategory.ejs",{
        category:category,
    
      })
    }
    else{
        res.render("admin/addcategory.ejs",{
            category:undefined,
        })    

    }



})

const  addcategory=asyncHandler(async(req,res)=>{
      try{
       
       let message="undefined"
       
        const name=req.body.categoryName
        console.log(name)
        const categ=await Category.findOne({categoryname:name})
        
        if(categ){
            res.render("admin/addcategory.ejs",{
                category:categ,
            message :"This category already exists"
               })
        }
        else{
        const category= new Category({
            categoryname:name
       })
         const savedcategory= await category.save()
    
          if(savedcategory){
 
              const category=await Category.find()
            
             res.render("admin/addcategory.ejs",{
                category:category,
            message :"Category added can add  subfield if any "
               })
    }
        else{
            res.render("admin/addcategory.ejs",{
                message :"Category not added database error "
               })
          }
          } 
        }

    catch(error){
        console.log(error.message)
    }
         
})
    

const editCategory=asyncHandler(async(req,res)=>{
    const categoryId = req.query.id; // Assuming the id is in the query parameters
    const updatedName = req.body.categoryName; // Assuming the category name is in the request body

    try {
        // Find the category based on the categoryId
        const category = await Category.findById(categoryId);

        if (!category) {
            // Handle case where category is not found
            res.render("admin/editCategory.ejs",{
                category:[],
                message:"Category not found"
            })
        }

        // Check if the category name already exists
        const existingCategory = await Category.findOne({ categoryname: updatedName });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            // Handle case where the updated category name already exists
            res.render("admin/editCategory.ejs",{
                category:existingCategory,
                message:"Category already exists"
            })
        }

        // Update the category name
        category.categoryname = updatedName;
        
        // Save the updated category
        await category.save();
            
        res.redirect("/admin/category")
    } catch (error) {
        // Handle other errors (e.g., database error)
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

const addsubcategory= asyncHandler(async(req,res)=>{
try{
     const subcategory=req.body.subcategoryName
     const category=req.body.categoryName
      console.log(req.body)
     const categoryData=await Category.findOneAndUpdate({categoryname:category},{$push:{sub_category:subcategory}},{upsert:true})
     if(categoryData){
        const category=await Category.find()
            res.redirect("http://localhost:3000/api/v1/admin/addcategory")
            alert("subcategory added")
    }
     


}
 catch(error){
    console.log(error.message)
 }       

})


const subcategory= asyncHandler(async(req,res)=>{
    try{
    const category=req.query.category

    const categoryData= await Category.findOne({categoryname:category})
    const subcategory=categoryData.sub_category
   
    res.status(200).json({ 
        success: true,
       subcategory:subcategory 
    });
}
catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'An error occurred' });
}
})


const deletecategory=asyncHandler(async(req,res)=>{
    try{
        console.log(req.query.id)
        const catId=req.query.id
        const deleteCategory= await Category.findByIdAndDelete({_id:catId})
        
        if(deleteCategory){
        res.json({success:true})
        }
        else{
            res.json({success:false})
        }
    }
    catch(error){
      console.log(error.message)
    }
})


const addOffer = asyncHandler(async (req, res) => {
    const { categoryId, selectedOfferId } = req.query;
  
    try {
        const { categoryId, selectedOfferId } = req.query;
      // Check if the category and offer exist
      const category = await Category.findById(categoryId);
      const offer = await Offer.findById(selectedOfferId);
  
      if (!category || !offer) {
        return res.status(404).json({ success: false, message: 'Category or Offer not found' });
      }
  
      // Update the category with the selected offer
      await Category.findByIdAndUpdate(categoryId, { offer: selectedOfferId });
  
      res.status(200).json({ success: true, message: 'Category updated with offer successfully' });
    } catch (error) {
      console.error('Error updating category with offer:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });
  
module.exports={
    loadaddcategory,addcategory,addsubcategory,subcategory,deletecategory,addOffer,loadCategory,loadeditCategory,editCategory
}