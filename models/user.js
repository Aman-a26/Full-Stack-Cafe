const mongoose = require('mongoose');

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
        lowercase: true,
        trim: true 
    },
    // Added to match your Signup EJS field
    collegeId: { 
        type: String, 
        required: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // Updated enum to include 'student' to match your controller default
    role: { 
        type: String, 
        enum: ['student', 'admin', 'user'], 
        default: 'student' 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);