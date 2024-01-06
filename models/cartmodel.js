const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    Items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: {
            type:Number,},
        price: Number,
        offerPrice: Number,
    }],
    totalPrice:Number,
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

