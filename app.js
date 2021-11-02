
const express = require("express");
const app = express();
// const pool = require("./dbPools.js");
// const fetch = require("node-fetch");
const session = require('express-session');
const bcrypt = require("bcrypt");
const mysql = require('mysql');

const port = 3000

app.engine('html', require('ejs').renderFile);
app.use(express.static("public"));

app.use(session({
    secret: "top Secret!",
    resave: true,
    saveUninitialized: true
}))

// function createDBConnection() {
//     var conn = mysql.createPool({
//         connectionLimit: 10,
//         host: "de1tmi3t63foh7fa.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
//         user: "svwvjtxw27jdshva",
//         password: "fdwslyjayg4pu6oo",
//         database: "b5u5zeiyntiu2as3"
//     });
//     return conn;
// };

app.use(express.urlencoded({extended: true}));



//Routing
app.get("/", function(req, res){
	res.render("index.ejs");
});

app.get("/statistics", function(req, res){
	res.render("statistics.ejs");
});

app.get("/vaccinations", function(req, res){
	res.render("vaccinations.ejs");
});

app.get("/news", function(req, res){
	res.render("news.ejs");
});

app.get("/faq", function(req, res){
	res.render("faq.ejs");
});

app.get("/contact", function(req, res){
	res.render("contact.ejs");
});

app.get("/login", function(req, res){
	res.render("login.ejs");
});

app.get("/login", function(req,res){
    
    let sql = "SELECT * FROM users";
	pool.query(sql, function (err, rows, fields) {
        if (err) throw err;
	
    
    if(req.session.authenticated) {
   //Get Login Table
        res.render("login.ejs", {"currentLogin":true, "rows":rows});
   } else {
        res.render("login.ejs",{"currentLogin":false, "rows":rows});
   }
	});
});

app.post("/login", async function(req,res){
    let username = req.body.username;
    let password = req.body.password;
    let checkbox = req.body.checkbox;
    
    let result = await checkUsername(username);
    
    let hashedPwd = "";
    if (result.length > 0){
        hashedPwd = result[0].pass;
    }
    
    let passwordMatch = await checkPassword(password,hashedPwd);

    if (checkbox == undefined) {
        res.render("login.ejs", {"loginError":true, "message":"You did not agree to the terms before logging in."})    
    } else if (username == "user1" && passwordMatch) {
        req.session.authenticated = true;
        res.render("index.ejs", {"loginError":true, "message": "You have succesfully logged in!"});
    } else {
        res.render("login.ejs", {"loginError":true, "message":"Wrong Credentials entered, please try again!"});
    }
})

app.get("/logout", function(req, res){
    req.session.destroy();
    res.render("index.ejs");
})
  

//Utility Functions
function checkUsername(username) {
    let sql = "SELECT * FROM users WHERE username = ?";
    return new Promise(function(resolve, reject) {
        let conn = createDBConnection();
        conn.query(sql, [username], function(err, rows, fields) {
            if (err) throw err;
            console.log("Rows found: " + rows.length);
            resolve(rows);
        })
    })
}

function checkPassword(password, hashedValue) {    
    return new Promise( function(resolve,reject){
        bcrypt.compare(password, hashedValue, function(err,result){
            console.log("Result: " + result);
            resolve(result);
        })
    })
}


//Starting Server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })