const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
});

// Create a TTL index on the endDate field
offerSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
