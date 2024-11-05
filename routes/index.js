var express = require('express');
var router = express.Router();
const userModel = require("./users");
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require('./multer')
const postModel = require('./post');
const post = require('./post');
// const feed = require('./feed');
//const user = require('user')

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index' , {nav:false});

});

router.get('/register', function(req, res, next) {
  res.render('register' , {nav:false});
});

router.post('/register', function(req, res, next) {
  const data = new userModel({
    name:req.body.name,
    username :req.body.username,
    email:req.body.password, 
    contact: req.body.contact,
  });

  userModel.register(data, req.body.password).then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile')
    });
  })  
});

router.get('/profile', isLoggedin , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts")

  res.render('profile' , {user , nav:true});
});

router.get('/add', isLoggedin , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
  res.render('add' , {user , nav:true});
});

router.post('/login', passport.authenticate('local', {
  failureRedirect : '/',
  successRedirect : '/profile',
}),function(req, res, next) {
});

router.get("/logout", function(req , res , next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

router.get("/show/posts", isLoggedin ,async function(req , res , next){
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('show' , {user , nav:true});
});

router.get('/feed', isLoggedin, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  const posts = await postModel.find().populate("user");
  res.render('feed', { user, posts, nav: true });
});


router.post('/fileupload', isLoggedin , upload.single("image"), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile')
});

router.post('/createpost', isLoggedin , upload.single("postImage") , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description : req.body.description,
    image: req.file.filename,
  });
  
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile')
});


function isLoggedin(req , res , next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}
module.exports = router;
