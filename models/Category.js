const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryname: {
        type: String,
        required: true,
        unique:true
    },
    sub_category: {
        type: [String] // Assuming subcategories are stored as strings
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',

    },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

