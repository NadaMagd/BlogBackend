const mongoose=require('mongoose');
const bcrypt = require('bcryptjs');
const e = require('express');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePicture: {
        type: String,
        default: 'https://example.com/default-profile-picture.png' // Default profile picture URL
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('User', userSchema);