const Offers = require("../models/offer");
const Token = require("../models/Token");
const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");

const loadofferlists = asyncHandler(async (req, res) => {
  try {
    const currentPage = "offers";
    const offers = await Offers.find();
    console.log(offers);
    res.render("admin/offerlists.ejs", {
      currentPage,
      offers,
    });
  } catch (error) {
    console.log(error);

    // Assuming `res` is available in your context, send an error response
    res.status(500).send("Internal Server Error");
  }
});

const loadoffers = asyncHandler(async (req, res) => {
  try {
    const currentPage = "offers";
    res.render("admin/offers.ejs", {
      currentPage,
    });
  } catch (error) {
    console.log(error.message);
  }
});

const addOffers = asyncHandler(async (req, res) => {
  try {
    // Extract coupon details from the request body
    console.log(1);
    console.log(req.body);
    const { couponTitle, discountType, discountAmount, startDate, endDate } =
      req.body;

    // Create a new coupon instance
    const newOffers = new Offers({
      offerName: couponTitle,
      discountType: discountType,

      discountAmount: discountAmount,

      startDate: startDate,

      endDate: endDate,
    });

    // Save the coupon to the database
    await newOffers.save();

    // Send a success response to the client
    res
      .status(200)
      .json({ success: true, message: "Coupon added successfully!" });
  } catch (error) {
    // Handle errors and send an error response
    console.error(error);
    res.status(500).json({ success: false, message: "InternalServerError!" });
  }
});

const deleteOffer = asyncHandler(async (req, res) => {
  const offerId = req.params.id;

  try {
    // Find the coupon in the database by ID and remove it
    const deletedOffer = await Offers.findByIdAndDelete(offerId);

    if (deletedOffer) {
      // Coupon found and deleted successfully
      res.json({ success: true });
    } else {
      // Coupon not found
      res.status(404).json({ success: false, error: "Coupon not found" });
    }
  } catch (error) {
    // Handle any errors that occur during the deletion
    console.error("Error during coupon deletion:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const getofferDetails = asyncHandler(async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offerDetail = await Offers.findOne({ _id: offerId });

    // Check if the offerDetail is found
    if (!offerDetail) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Send the offerDetail as a JSON response
    res.json(offerDetail);
  } catch (error) {
    // Handle errors
    console.error('Error fetching offer details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = {
  loadoffers,
  addOffers,
  loadofferlists,
  deleteOffer,
getofferDetails
};
