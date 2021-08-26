const express = require('express');
const app = express();
const dotenv = require('dotenv');
const flash = require("connect-flash");
const session = require("express-session");
const fetch = require('node-fetch');
const Url = require("./models/urlSchema")

// setting view engine
app.set('view engine', 'ejs')

// load assets
app.use('/public', express.static("public"))

dotenv.config({ path: './config.env' })
require('./db/mongoose.js')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'thisisasecret',
    saveUninitialized: false,
    resave: false
}));

app.use(flash());

app.get('/', (req, res) => {
    res.render('index', { message: req.flash('message') })
})

app.post('/createURL', async (req, res) => {
    const { fullURL } = req.body

    try {
        //setting random url
        var shortURL = '';
        const allCharacters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 6; i++) {
            var randomCharacter = allCharacters[Math.floor(Math.random() * allCharacters.length)];
            shortURL += `${randomCharacter}`;
        }

        // initially values
        var clicks = 0
        var createdOn = new Date();

        // saving in mongodb
        const url = new Url({ fullURL, shortURL, clicks, createdOn })

        await url.save();

        // redirecting
        req.flash('message', 'URL shortened successfully to - '+ url.shortURL)
        res.redirect('/stats?id='+shortURL)
    } catch (err) {
        console.log(err)
    }
})

app.get('/stats', async (req, res) => {
    try {
        const id = req.query.id
        const url = await Url.findOne({ shortURL: id })
        if (url == null) {
            res.render('404')
        } else {
            res.render('stats', {  url, message: req.flash('message') })
        }
    } catch (err) {
        console.log(err)
    }
})

app.get('/:id', async (req, res) => {
    try {
        const url = await Url.findOne({ shortURL: req.params.id })
        if(url == null) {
            res.render('404')
        } else {
            // geting client's IP
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            // console.log(ip);
            if (ip == '::1') { //local host ip address
                ip = '157.38.248.184' // asia ip address example
                // ip = '23.235.60.92' // north america ip address example
            }
            var responseAPI = await fetch(`http://ip-api.com/json/${ip}?fields=continent`)
            var continent = await responseAPI.json();
            continent = continent.continent
            // console.log(continent)
            // console.log(url.continents)
            var counted = false;
            for (let i = 0; i < url.continents.length; i++) {
                if (url.continents[i].continentName == continent) {
                    url.continents[i].count++
                    counted = true;
                }
            }
            if (counted == false) {
                url.continents.push({
                    continentName: continent,
                    count: 1
                })
            }
            // console.log(url.continents)
            url.clicks ++
            url.lastAccessed = new Date();
            await url.save()
            res.redirect(url.fullURL)
        }
    } catch (err) {
        console.log(err)
    }
})

app.post('/custom/url/:id', async (req, res) => {
    try {
        const customURL = req.body.customURL
        const url = await Url.findOne({ shortURL: req.params.id })

        //check if the url already exists
        const allURLS = await Url.find({})
        for (let i = 0; i < allURLS.length; i++) {
            if (allURLS[i].shortURL == customURL) {
                req.flash('message', 'This URL already exists. Kindly choose a different name')
                return res.redirect('/stats?id='+url.shortURL)
            }
        }

        url.shortURL = customURL;
        await url.save();
        req.flash('message', 'URL shortened successfully to - '+ url.shortURL)
        res.redirect('/stats?id='+url.shortURL)
    } catch (err) {
        console.log(err)
    }
})

const PORT = process.env.PORT
//Listening to port
app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
})