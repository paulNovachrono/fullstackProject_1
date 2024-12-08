// express
const express = require('express');
const app = express();

// models
const userModel = require('./models/user'); // user model
const postModel = require('./models/post') // post model

// set view engine as ejs
app.set('view engine', 'ejs');

// path
const path = require('path');

// static file
app.use(express.static(path.join(__dirname,'public')));

// type conversion
app.use(express.json());
app.use(express.urlencoded({extended: true}))

// cookieparser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// bcrypt for password hashing
const bcrypt = require('bcrypt');

// jwt 
const jwt = require('jsonwebtoken');

// multer from configs
const upload = require('./configs/multer');


// routs
app.get('/', function(req, res){
    res.render('index');
});

// register
app.post('/register', async function(req, res){
    // in this route we are going to crate an user
    // before create a user 1st check if the user already exist

    // desturing and getting the data from the req.body
    const {username, name, age, email, password} = req.body;
    let user = await userModel.findOne({email}); // check if the user already exist by email
    if(user) return res.status(500).send("User already exists");

    // if the user does not exist then create an user and hash the password
    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(password, salt, async function(err, hash){
            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            }); // create an user with hashed password
            // generating a toke for login perpous
            const token = jwt.sign({email, userid:user._id},"thesecretkey");
            res.cookie("token", token); // setting token as cookie
            res.send('registerd');
        });
    });
    
});

// login routs
app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', async function(req, res){
    const {email, password} = req.body;

    // Validate email and password are provided
    if (!email || !password) {
        return res.status(400).send("Email and password are required"); // Stop here if empty
    }

    let user = await userModel.findOne({email}); // check if the user already exist by email
    if(!user || user == false) return res.status(500).send("Something went wrong"); // if user does not exists

    // since the user exists we will compare the password 
    bcrypt.compare(password, user.password, function(err, result){ // pass comming from form vs registered pass
        if(result) { // if the result is true then generate a token for cookie
        let token = jwt.sign({email, userid:user._id}, "thesecretkey");
        res.cookie("token", token);
        res.status(200).redirect('/profile');
        }
        else res.redirect('/login');
    });
});

// logout routs
app.get('/logout', function(req, res){
    res.render('logout');
});

app.post('/logout', function(req, res){
    res.cookie("token", ""); // removing the token value to logout
    res.redirect("/login");
});

// profile
app.get('/profile',isLoggedIn, async function(req, res){
    // find the profile
    const user = await userModel.findOne({email: req.user.email}).populate("posts"); // Populate the posts array
    // alway use populate after using the findOne method.
     res.render('profile', {user: user}); // sending the user data to the profile page.
    
});



// posts
app.post('/post',isLoggedIn, async function(req, res){
    // findout the user logged in
    let user = await userModel.findOne({email: req.user.email});
    
    let {content} = req.body; // getting the content from the text area
    // create the post
    let post = await postModel.create({
        user: user._id,
        content,
    });
    user.posts.push(post._id); // add the post id to the user posts array in the model
    await user.save(); // save the user model
    res.redirect('/profile')
});


// like
app.get('/like/:id',isLoggedIn, async function(req, res){
    // find the post
    const post = await postModel.findOne({_id: req.params.id}).populate("user"); // populating the user array
    
    // checking if the user already liked the post
    if(post.likes.indexOf(req.user.userid) === -1){
        // if not then add the user id to the likes array 
        post.likes.push(req.user.userid);
    }
    else{
        // remove the same userid we have found
        post.likes.splice(post.likes.indexOf(req.user.usreid), 1);
    }
    await post.save();
    res.redirect('/profile');
});

// edit
app.get('/edit/:id',isLoggedIn, async function(req, res){
    // find the post
    const post = await postModel.findOne({_id: req.params.id}).populate("user"); // populating the user array
    
    res.render('edit',{post});
});

// update
app.post('/update/:id',isLoggedIn, async function(req, res){
    // find the post and update
    const post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.contentUpdate});
    res.redirect('/profile');
});

// profile images
app.get('/profile/upload', function(req, res){
    res.render('profileupload');
});

app.post('/upload',isLoggedIn, upload.single("image"),async function(req, res){ // inputfield name => image
    let user = await userModel.findOne({email:req.user.email});
    user.profilepic = req.file.filename ;// updating the default value of the pic getting from the input field
    await user.save();
    res.redirect('profile');
});



// middlewhere for protected route
function isLoggedIn(req, res, next) {
    // Check if the token exists and is valid
    if (!req.cookies.token || req.cookies.token === "") {
        return res.redirect('/login'); // Add `return` to stop further execution
    }

    try {
        // Verify the token
        let data = jwt.verify(req.cookies.token, "thesecretkey");
        req.user = data; // Store the user data in `req.user`
        next(); // Proceed to the next middleware or route
    } catch (error) {
        return res.status(401).send('Invalid token!'); // Stop execution if token is invalid
    }
}


app.listen(3000);