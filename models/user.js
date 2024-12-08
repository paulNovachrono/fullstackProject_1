// mongoose
const mongoose = require('mongoose');
mongoose.connect(`mongodb://127.0.0.1:27017/miniproject`); //connect

// schema
const userSchema = mongoose.Schema({
    username: String,
    name: String,
    email: String,
    age: Number,
    password: String,
    profilepic:{
        type:String,
        default: "default.png"},
    posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'post'}], // means the post will contain the id of the user who posted it.
});

// modele creation and export
module.exports = mongoose.model('user',userSchema);