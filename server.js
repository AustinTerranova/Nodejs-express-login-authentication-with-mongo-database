
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')


// in the future I would use routers for this to break up the program and make it easier to read
// I would also use a persistant storage for my sessions 

app.use(cookieSession({ //use cookie-session which is stored in the browser
    name: 'session',   
    keys: ["secret key"]
}));

const mongoose = require('mongoose');

var uri = ('mongodb://localhost:27017/my_db');  
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });//connects to the database 

const loginSchema = new mongoose.Schema({  //create the login schema for the database
  username : {
                type: String, 
                unique: true // in the future I plan on using express-validator for validation of users
            }, 
  password: String,
 

});
var Login = mongoose.model('Logins',loginSchema) //create a new login model with my schema

const connection = mongoose.connection 
connection.once("open", function() { //check if the database is connected 
    console.log("MongoDB database connection established successfully");
  });

app.set('views', __dirname );
app.set('view engine', 'ejs'); //setting my view engine as ejs since it makes it significantly easier to use html I used html just to see how it would look pug or jade would have been easier and is what I would use for the future
app.use(express.static('/signup'));



//parse application/json
app.use(bodyParser.json());
// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array());
app.use(cookieParser())


app.get('/', function(req, res) {  
    res.render('signup'); 
});
app.post('/signup', function(req, res){
  
   
    var loginInfo = req.body;
    
    //console.log(loginInfo)
    if(!loginInfo.username || !loginInfo.password){ // if the input of either username or login is missing a username or password then give an error message 
         
         res.send("You entered invalid details");
     }
     else {                                         
             var newLoginInfo = new Login({     //if the input is not missing then create a new login document
                 username: loginInfo.username,
                 password: loginInfo.password,             
                 
             });
                 
                 newLoginInfo.save(function(err, response){     //save the document if there is an err the user already exists 
                 if(err) res.send("This user already exists");
                 res.render('logout', {Login: loginInfo} ); // render the logout page with
                 
                 console.log("in .save session ", req.session.login)
              
                  });
                  req.session.login = newLoginInfo //create new session with the new signup
                  console.log("right outside .savesession", req.session.login)
                  
         
         
     }
    
 });
function checkSignIn(req,res,next){ //check for sign in if there is a session go to logout if there is no session then go to login
    if(req.session.login){
        console.log("checksignin", req.session.login)
        next() // if there is a session proceed to logout page
    }else {
        
        console.log("error session", req.session.login)
        res.redirect('login') // if there isnt a session proceed to the login page
    }
}


app.get('/', checkSignIn, function(req,res){
    res.render('logout', )
})


app.get('/login', function(req, res){
    res.render('login');
 });
 
 app.post('/login', function(req, res){
    
    if(!req.body.username|| !req.body.password){ // if the input is missing a username or password then rerender the login
       res.render('login',);
    } else {
       
        Login.exists({ username: req.body.username, password: req.body.password }, function (err,data) {    //querys the mongo database and compare with values that are entered in the form 
                                                                                                            // if login.exists data is true if there is no match then data is false
           
                if(data){
                    req.session.login = req.body;        //  if the login exists then save the session                                   
                                                        //in cookie-session the sessions are saved when the sesion is modified
                    res.render('logout', {Login: req.session.login}); //render the logout page with the login session information
             
                }else {
                    console.log("That user doesnt exist ") //the login.exists is false then the user does not exist 
                    res.render('signup');                  // since the login doesnt exist go to the signup page and create a login
              
            }
        
       });
       
    }
 });
app.get('/logoutButton',function(req,res,){ //When the button in logout is clicked delete the session 
    
     console.log("logout session before null", req.session.login)
     req.session.login = null //destroys the session
     console.log("logout session after null", req.session.login)
        //User should be authenticated! Redirect him to log in.
     res.redirect('/login'); //once session is destroyed redirect to login
});

app.use('/logout', function(err, req, res, next){
    console.log(err);
       //User should be authenticated Redirect him to log in.
       res.render('/login');
    });

Login.find(function(err, login){ //gets all the logins in the database
    console.log(login); //display the logins to the console
    
});

app.listen(8000, '127.0.0.1');