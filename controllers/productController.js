// import models

const User = require("../models/userModel");
const Offer = require("../models/offer");
const Token = require("../models/Token");
const products = require("../models/productModel");
const Category = require("../models/Category");
const Review = require("../models/Review");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const mongoose= require("mongoose")
const loadproducts = asyncHandler(async (req, res) => {
  try {
    const currentPage="products"
    res.render("admin/product.ejs",{
      currentPage
    });
  } catch (error) {
    console.log(error.message);
  }
});

const loadaddproducts = asyncHandler(async (req, res) => {
  try {
    const category = await Category.find();
    console.log(category);
    if (category) {
      console.log(category);
      res.render("admin/addproduct.ejs", {
        category: category,
      });
    } else {
      res.render("admin/addproduct.ejs", {
        category: "undefined",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
});

const addproducts = asyncHandler(async (req, res) => {
  try {
    console.log(req.files)
    if (!req.files) {
      throw Error("FILE_MISSING");
    } else {
      const imageArray = [];

      for (const file of req.files) {
        // Add the file information to the imageArray
        imageArray.push({
          filename: file.filename,
        });
      }
      console.log(req.body);

      const product = new products({
        name: req.body.name,
        description: req.body.Description,
        price: req.body.price,
        category: req.body.category,
        subcategory: req.body.subcategory,
        brand: req.body.brand,
        images: imageArray,
        stockQuantity: req.body.stock,
        weight: req.body.Weight,
        dimensions: {
          length: req.body.Length,
          width: req.body.Width,
          height: req.body.Height,
        },
        variations: {
          color: req.body.Color,
        },
      });

      const productData = await product.save();
      console.log(productData);
      if (productData) {
        const category = await Category.find();
        console.log(category);
        res.render("admin/addproduct.ejs", {
          category: category,
          message: "Product added successfully",
        });
      } else {
        res.render("admin/addproduct.ejs", { message: "Some error" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
});

const loadHome = asyncHandler(async (req, res) => {
  console.log(req.body.priceRange)
  const categoryvalue = req.body.category;
const minRating = req.body.customRadio;
const priceRanges = req.body.priceRange;
const searchQuery = req.body.q;
const sortOption = req.body.sort;
console.log(priceRanges)
  try {
    let productData
    const query = {Isdeleted: false};
    if (searchQuery) {
      query.$or = [
        { category: { $regex: new RegExp(searchQuery, 'i') } },
        { name: { $regex: new RegExp(searchQuery, 'i') }},
      ];
    } else if (categoryvalue || minRating || priceRanges) {
      if (categoryvalue) query.category = categoryvalue;
      if (minRating) query.rating = { $gte: minRating };
      if (priceRanges) {
        const priceRangesArray = Array.isArray(priceRanges) ? priceRanges : [priceRanges];
        const priceRangeQueries = priceRangesArray.map(range => {
          if (range.endsWith('-')) {
            // Handle "3000 & above" option
            const minPrice = parseInt(range, 10);
            return { price: { $gte: minPrice } ,Isdeleted: false};
          } else {
            const [minPrice, maxPrice] = range.split('-');
            return { price: { $gte: minPrice, $lte: maxPrice }};
          }
        });
        query.$or = [...(query.$or || []), ...priceRangeQueries];
      }
    }
  console.log(query)
    // Retrieve products based on the filter
    productData = await products.find(query);
     console.log(productData)
    // Sort the products based on the selected option
    console.log(sortOption)
    if (sortOption) {
      switch (sortOption) {
        case 'Ascending - Price':
          productData.sort((a, b) => a.price - b.price);
          break;
        case 'Descending - Price':
          productData.sort((a, b) => b.price - a.price);
          break;
        case 'Ascending - Ratings':
          productData.sort((a, b) => a.rating - b.rating);
          break;
        case 'Descending - Ratings':
          productData.sort((a, b) => b.rating - a.rating);
          break;
        // Add more sorting options as needed
        default:
          // Default sorting
          break;
      }
    }
  
    // Paginate the products
    const page = req.query.page || 1;
    const perPage = 6; // Number of products per page
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
  
    const paginatedProducts = productData.slice(startIndex, endIndex);

    const category = await Category.find();
    const offer=[];

    if (paginatedProducts.length > 0) {
      const imageUrls = [];

      for (const product of paginatedProducts) {
        try {
          const offerData = await Offer.findOne({ _id: product.offer });
          offer.push(offerData);

          const productImageUrls = await Promise.all(
            product.images.map(async (image) => {
              const fullImageUrl = await cropAndUploadImage(image);
              const croppedImageUrl = fullImageUrl.split(path.sep + 'views' + path.sep)[1];
              return croppedImageUrl ;
            }),
          );

          imageUrls.push(productImageUrls);
          console.log(imageUrls);
        } 
        catch (cropError) {
          console.error("Error cropping images for a product:", cropError);
        }
      }

      res.render("users/product.ejs", {
        products: paginatedProducts,
        imageUrls: imageUrls,
        category: category,
        offer: offer,
        quantity: 1,
        currentPage: page, // Pass the current page to the view
        totalPages: Math.ceil(productData.length / perPage), // Calculate total pages
      });
    } else {
      // Handle case when there are no products to display
      res.render("users/product.ejs", {
        products: [],
        imageUrls: [],
        category: category,
        offer: offer,
        quantity: 1,
        currentPage: 1,
        totalPages: 1,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

const cropAndUploadImage = async (image) => {
  const imageFilePath = path.join(
    __dirname,
    "../views",
    "uploads",
    `${image.filename}`,
  );

  const croppedImageDir = path.join(__dirname, "../views/uploads");
  const croppedImageName = `cropped_${image.filename}`;
  const croppedImagePath = path.join(croppedImageDir, croppedImageName);

  try {
    // Read the original image
    const imageBuffer = fs.readFileSync(imageFilePath);

    // Use Sharp to resize and rotate the image
    await sharp(imageBuffer)
      .resize(300, 500)
      .rotate()
      .toFile(croppedImagePath);

    console.log("Image cropped successfully:", croppedImagePath);
 
    return croppedImagePath;
  } catch (cropError) {
    console.error("Error cropping image:", cropError);
    throw cropError; // Rethrow the error to handle it at a higher level if needed
  }
};


const loaddetails = asyncHandler(async (req, res) => {
  
  const productId = req.query.id;
  const productData = await products.findOne({ _id: productId });
  const review = await Review.find({ productid: productId });
  function calculateAverageRating(reviews) {
    if (reviews.length === 0) {
      return 0; // Handle the case when there are no reviews.
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    return averageRating;
  }

  // Calculate the average rating from the reviews
  const averageRating = calculateAverageRating(review);
  const imageUrls = [];
  try {
    const productImageUrls = await Promise.all(
      productData.images.map(async (image) => {
        const FullImageUrl = await cropAndUploadImage(image);
        const croppedImageUrl = FullImageUrl.split(path.sep + 'views' + path.sep)[1];
        return croppedImageUrl ;
      }),
    );

    imageUrls.push(productImageUrls);
    console.log(imageUrls);
  } catch (cropError) {
    console.error("Error cropping images for a product:", cropError);
  }
   delete req.session.productId;
   delete req.session.intent;
  res.render("users/productdetail.ejs", {
    averageRating: averageRating,
    review: review,
    products: productData,
    imageUrls: imageUrls,
  });
});

const addreview = asyncHandler(async (req, res) => {
  const rating = req.body.rating;
  const name = req.body.Name;
  const comment = req.body.message;
  const userData = await User.findOne({ email: req.body.email });
  const productId = req.query.productId;
  const review = new Review({
    name: name,
    userId: userData._id,
    productid: productId,
    rating: rating,
    comment: comment,
  });
  const reviewData = await review.save();

  res.redirect(
    `/productdetails?productId=${productId}`,
  );
});

const pagination = asyncHandler(async (req, res) => {
  console.log(req.body);
});

const loadadminproducts = asyncHandler(async (req, res) => {
  try {
    // Fetch product data (replace this with your data source, e.g., a database query)
    const productData = await products.find()
    const offers=await Offer.find()
    const category = await Category.find();
    console.log(productData);
    if (productData) {
      const imageUrls = [];

      for (const product of productData) {
        try {
          console.log(product);
          const productImageUrls = await Promise.all(
            product.images.map(async (image) => {
              const FullImageUrl = await cropAndUploadImage(image);
              const croppedImageUrl = FullImageUrl.split("views\\")[1];
              return croppedImageUrl;
            }),
          );

          imageUrls.push(productImageUrls);
        } catch (cropError) {
          console.error("Error cropping images for a product:", cropError);
        }
      }
      console.log(category);
      res.render("admin/product.ejs", {
        products: productData,
        category: category,
        imageUrls: imageUrls,
        offers
      });
    } else {
      console.log("No data found");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
});

const loadeditproducts = asyncHandler(async (req, res) => {
  try {
    console.log(req.body);
    const currentPage="products"
    const productId = req.query.id;
    console.log(productId);
    const productData = await products.findOne({ _id: productId });
   
    console.log(productData);
    const offers=await Offer.find();
    console.log(offers)
    if (productData) {
      const imageUrls = [];

      try {
        const productImageUrls = await Promise.all(
          productData.images.map(async (image) => {
            const FullImageUrl = await cropAndUploadImage(image);
            const croppedImageUrl = FullImageUrl.split("views\\")[1];
            return croppedImageUrl;
          }),
        );

        imageUrls.push(productImageUrls);
      } catch (cropError) {
        console.error("Error cropping images for a product:", cropError);
      }
     
      res.render("admin/edit.ejs", {
        productData: productData,
        imageUrls: imageUrls,
        currentPage,
        offers
      });
    } else {
      res.status(404).send("Database error: Product not found");
    }
  } catch (error) {
    console.log(error.message);
  }
});

const editproducts = asyncHandler(async (req, res) => {
  try {
    console.log(req.query);
    const productId = req.query.id;
    console.log(req.files);
    
    if (!req.files) {
      // No new images, update the database without images
      const updatedProduct = await products.findByIdAndUpdate(
        { _id: productId },
        {
          $set: {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            brand: req.body.brand,
            weight: req.body.weight,
            stockQuantity: req.body.stock,
            dimensions: {
              length: req.body.Length,
              width: req.body.Width,
              height: req.body.Height,
            },
            Material: req.body.Material,
          },
        },
        { new: true },
      );

      if (!updatedProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      res.redirect("/admin/products");
    } else {
      // New images are uploaded, update the database including images
      const imageArray = [];

      for (const file of req.files) {
        // Add the file information to the imageArray
        imageArray.push({
          filename: file.filename,
        });
      }

      const updatedProduct = await products.findByIdAndUpdate(
        productId,
        {
          $set: {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            brand: req.body.brand,
            weight: req.body.weight,
            stockQuantity: req.body.stock,
            dimensions: {
              length: req.body.Length,
              width: req.body.Width,
              height: req.body.Height,
            },
            Material: req.body.Material,
            images: imageArray,
            // Add other fields as needed
          },
        },
        { new: true },
      );

      if (!updatedProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const deleteproducts = async (req, res) => {
  try {
    console.log(1);
    const productId = req.query.id; // Assuming the product ID is passed as a query parameter
    const productData = await products.findByIdAndUpdate(
      { _id: productId },
      { availability: false, Isdeleted: true }, // Update both properties
      { new: true } // Add this option if you want to get the updated document in the response
    );

 console.log(productData)
    if (productData) {
      res
        .status(200)
        .json({ success: true, message: "Item deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting product",
        error: error,
      });
  }
};
const restoreproducts = async (req, res) => {
  try {
    console.log(1);
    const productId = req.query.id; // Assuming the product ID is passed as a query parameter
    const productData = await products.findByIdAndUpdate(
      { _id: productId },
      { availability: true, Isdeleted: false }, // Update both properties
      { new: true } // Add this option if you want to get the updated document in the response
    );

    if (productData) {
      res
        .status(200)
        .json({ success: true, message: "Item deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting product",
        error: error,
      });
  }
};

const addOffer = asyncHandler(async (req, res) => {


  try {
    console.log(req.query)
      const { productId, selectedOfferId } = req.query;
    // Check if the category and offer exist
    const product = await products.findById(productId);
    const offer = await Offer.findById(selectedOfferId);

    if (!product || !offer) {
      return res.status(404).json({ success: false, message: 'Category or Offer not found' });
    }

    // Update the category with the selected offer
    await products.findByIdAndUpdate(productId, { offer: selectedOfferId });

    res.status(200).json({ success: true, message: 'Category updated with offer successfully' });
  } catch (error) {
    console.error('Error updating category with offer:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = {
  loadproducts,
  loadaddproducts,
  addproducts,
  loadHome,
  loadadminproducts,
  loadeditproducts,
  editproducts,
  deleteproducts,
  loaddetails,
  addreview,
  restoreproducts,addOffer
};
