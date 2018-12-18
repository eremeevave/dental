
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const session = require("express-session")
const fs = require('fs')
const app = express()


app.set('view engine', 'html')
app.use(cookieParser())
app.use(express.static('views'))

app.use(session({
    secret: "myOwnSecret",
    cookie: { maxAge: 1000 * 60 * 60 * 3 }, 
    resave: true,
    saveUninitialized: true
}))

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

require('./src/routes')(app)

http.createServer(app).listen(process.env.PORT || 5000, function(){
    console.log(`Go to http://localhost:${5000}`)
})
