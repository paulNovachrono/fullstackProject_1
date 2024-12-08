// mongoose
const mongoose = require('mongoose');


// schema
const postSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "user"}, // post contains the id of the user who created it
    date: {type: Date, default: Date.now},
    content: String,
    likes: [{type:mongoose.Schema.Types.ObjectId, ref: "user" }] // like will content the id of the all users who liked the post
});

// modele creation and export
module.exports = mongoose.model('post',postSchema);