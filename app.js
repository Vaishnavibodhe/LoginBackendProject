const express=require('express');
const app=express();
const userModel=require("./models/user");
const postModel=require("./models/post");
const bcrypt=require("bcrypt");
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path=require("path");
//require multer file
const upload=require("./utils/multer");


app.set("view engine" ,'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());



//image get
app.get('/profile/upload' ,function(req,res){
    res.render("profileupload");
})
//image upload
app.post("/upload" , upload.single("image") ,function(req,res){
    console.log(req.file);
})
app.get('/' ,function(req,res){
    res.render("index");
})
app.post("/register" , async function(req,res){
   let {username ,name,email,age,password}=req.body;
    let user=await userModel.findOne({email});
    if(user) return res.status(500).send("user already register");
        
    bcrypt.genSalt(10,function(err,salt){
        //console.log(salt);
        bcrypt.hash(password,salt, async function(err,hash){
            //console.log(hash);
            let user= await userModel.create({
                name,
                username,
                email,
                age,
                password: hash,//hash saved as password
            })
           let token= jwt.sign({email:email, userId:user._id},"secret")
            res.cookie("token",token);
            res.send("registered");
        })
    })
})
//gor login rendering
app.get("/login", isLoggedIn,function(req,res){
    res.render("login")
})
app.post("/login" , async function(req,res){
    let {email,password}=req.body;
     let user=await userModel.findOne({email});
     if(!user) return res.status(500).send("something went wrong");
         //now compare for cheking is user available
         bcrypt.compare(password,user.password,function(err,result){
            if(result) res.status(300).redirect("/profile");//if same password then 
            else res.redirect("/login");//return bhej dena nahito
         })
         
     })
    //protected rout means with profile rout also we can get user data
    app.get("/profile",isLoggedIn, async function(req,res){
        //console.log(req.user);//isse user details jisne login kra hai vo data dikhega
    let user= await userModel.findOne({email:req.user.email}).populate("posts")
      res.render("profile",{user});//populate means content dikhega posts ka
    })

    //like
    app.get("/like/:id",isLoggedIn, async function(req,res){
        let post= await postModel.findOne({_id: req.params.id}).populate("user");
     if(post.likes.indexOf(req.user.userId)=== -1){
        post.likes.push(req.user.userId);// agar userid likes array me nhi hai to hme likes bdhana hai
     }
     else{//nhi to likes hatana hai vo bhi ek bnde ko htao
post.likes.splice(post.likes.indexOf(req.user.userId),1);

     }
     await post.save();
     //console.log(req.user);
        res.redirect("/profile");
})
// get edit
app.get("/edit/:id",isLoggedIn, async function(req,res){
    let post= await postModel.findOne({_id: req.params.id}).populate("user");
  res.render("edit",{post});//post ka data bhejna

})
//post edit
app.post("/update/:id",isLoggedIn , async function(req,res){
    let post=await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content});
res.redirect("/profile");
})


    //post 
    //post tbhi dikhegi jbb hm loggein ho so here needed isLoggedin fun
    app.post("/post",isLoggedIn, async function(req,res){
        let user= await userModel.findOne({email:req.user.email})
        let {content}=req.body;

        let post= await postModel.create({
        user:user._id,
        content
        //date is default so dont take it
      });
      user.posts.push(post._id);//user me jo posts schema hai usme post ki id se data jaega sara
    await user.save();
    res.redirect("profile");
    })

    //logout
 app.get('/logout',function(req,res){
    res.cookie("token","")//just empty tok*en logout will happen
 res.redirect("login");
}) 
//middleware
//login hai ya  nhii ye btaega ye
function isLoggedIn(req,res,next){
if(req.cookies.token==="") res.redirect("/login");
else{
    let data=jwt.verify(req.cookies.token, "secret");//hme data me token ka sara data mil jaega
 req.user=data;//data daal diya means hm koi bhi router me isloggedIn lgakr ye msg popup kr skte hai
 next();
}
} 

 
app.listen(3000);