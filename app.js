
const express = require("express");
const app = express();
// const pool = require("./dbPools.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const session = require('express-session');
const bcrypt = require("bcrypt");
const mysql = require('mysql');
const cookieSession = require('cookie-session');
const passport = require('passport');
require('./passport');
const truncate = require('./public/js/main.js');

const port = 3000

app.engine('html', require('ejs').renderFile);
app.use(express.static("public"));

//Configure Session Storage
app.use(cookieSession({
    name: 'session-name',
    keys: ['key1', 'key2']
  }))
app.use(passport.initialize());
app.use(passport.session());
  
function createDBConnection() {
    var conn = mysql.createPool({
        connectionLimit: 10,
        host: "localhost",
        user: "root",
        password: "",
        database: "covid19-dashboard"
    });
    return conn;
};

app.use(express.urlencoded({extended: true}));

// Middleware - Check user is Logged in
const checkUserLoggedIn = (req, res, next) => {
    req.user ? next(): res.sendStatus(401);
}

//Routing
app.get("/", async function(req, res){

    //Get current day to pull statistics
    var longDate = new Date();
    var currentDate = new Date();
    var month = currentDate.getUTCMonth() + 1; //months from 1-12
    var day = currentDate.getUTCDate() - 2;
    if(day < 10)
        day = "0" + day;
    var year = currentDate.getUTCFullYear();
    currentDate = year + "-" + month + "-" + day;

    var url = "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/covid-19-qppza/service/REST-API/incoming_webhook/global?country=US&min_date=" + currentDate + "T00:00:00.000Z";
	
    const data = await getData(url);
    console.log(data);
    
    let dailyDeaths = data[0].deaths_daily;
    let dailyConfirmedCases = data[0].confirmed_daily;
    let totalConfirmedCases = data[0].confirmed;
    let totalDeaths = data[0].deaths;

    dailyDeaths = truncate(dailyDeaths);
    dailyConfirmedCases = truncate(dailyConfirmedCases);
    totalConfirmedCases = truncate(totalConfirmedCases);
    totalDeaths = truncate(totalDeaths);

    res.render("index.ejs", {"dailyDeaths": dailyDeaths, "dailyConfirmedCases": dailyConfirmedCases,
                             "totalConfirmedCases": totalConfirmedCases, "totalDeaths": totalDeaths,
                             "currentDate": currentDate
    });
});

app.get('/profile', checkUserLoggedIn, (req, res) => {
    res.send(`<h1>${req.user.displayName}'s Profile Page</h1>`)
  });

app.get("/statistics", async function(req, res){

    let countyArray = [];
    let populationArray = [];
    let totalConfirmedArray = [];
    let totalDeathsArray = [];
    let confirmedDailyArray = [];
    let deathsDailyArray = [];
    let url = "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/covid-19-qppza/service/REST-API/incoming_webhook/us_only?min_date=2021-11-06T00:00:00.000Z&state=California";
    const data = await getData(url);

    let countiesCount = Object.keys(data).length;

    for(let i = 0; i < countiesCount; i++) {
        countyArray.push(data[i].county);
        populationArray.push(data[i].population);
        totalConfirmedArray.push(data[i].confirmed);
        totalDeathsArray.push(data[i].deaths);
        confirmedDailyArray.push(data[i].confirmed_daily);
        deathsDailyArray.push(data[i].deaths_daily);
    }

	res.render("statistics.ejs", {"countyArray": countyArray, "populationArray": populationArray,
                                "totalConfirmedArray": totalConfirmedArray, "totalDeathsArray":totalDeathsArray,
                                 "confirmedDailyArray": confirmedDailyArray, "deathsDailyArray": deathsDailyArray
    });
});

app.get("/vaccinations", function(req, res){
	res.render("vaccinations.ejs");
});

app.get("/news", async function(req, res){


    let articleArray = [];
    let titleArray = [];
    let descriptionArray =[];
    let contentArray =[];
    let url = `https://newsapi.org/v2/everything?q=Covid_19&apiKey=2aac52b40ffd48ce82355f1ec110f4a4`;

    const data = await getData(url);

    let article = Object.keys(data).length;
    
    for(let i = 0; i < 20; i++)
    {
        articleArray.push(data.articles[i].author);
        titleArray.push(data.articles[i].title);
        descriptionArray.push(data.articles[i].description);
        contentArray.push(data.articles[i].urlToImage);
    }

    res.render("news.ejs",{"articleArray": articleArray, "titleArray": titleArray,
                            "descriptionArray": descriptionArray, "contentArray":contentArray});
});

app.get("/faq", function(req, res){
	res.render("faq.ejs");
});

app.get("/contact", function(req, res){
	res.render("contact.html");
});

// Auth Routes
app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    res.redirect('/');
  }
);

//Logout
app.get('/logout', (req, res) => {
    req.session = null;
    req.logout();
    res.redirect('/');
})

//Utility Functions
async function getData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
  }

function checkEmail(email) {
    let sql = "SELECT * FROM users WHERE email = ?";
    return new Promise(function(resolve, reject) {
        let conn = createDBConnection();
        conn.query(sql, [email], function(err, rows, fields) {
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