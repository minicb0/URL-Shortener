const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    fullURL: {
        type: String,
        required: true
    },
    shortURL: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    },
    createdOn: {
        type: Date,
        required: true
    },
    lastAccessed: {
        type: Date,
        expires: 2*24*60*60
    }
})

const Url = mongoose.model('URL', urlSchema);

module.exports = Url;