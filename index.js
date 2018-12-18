// подключаем основные библиотеки
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const session = require("express-session")
const fs = require('fs')
const app = express()

// настраиваем основной вьюшкой html( можно было бы выставить шаблонизаторы pug, jage, handlebars etc)
app.set('view engine', 'html')
app.use(cookieParser())// позволяет работать с куки
app.use(express.static('views'))// папка views теперь на сервере(повзоляет подключать css к html)

app.use(session({
    secret: "myOwnSecret",// это пароль к шифру сессий(можешь свой настроить)
    cookie: { maxAge: 1000 * 60 * 60 * 3 }, // 3 часа живет сессия, после этого система тебя разлогинивает и нужно заново логиниться
    resave: true,
    saveUninitialized: true
}))

app.use(cors())// это просто так
app.use(bodyParser.urlencoded({ extended: true }))// позволяет забирать данные с пост форм
app.use(bodyParser.json());// хз зачем она, но всегда пишу и все работает

require('./src/routes')(app)// подключаем обработчики всех линков

http.createServer(app).listen(process.env.PORT || 5000, function(){// создаем сервак который слушает на порту 3000
    console.log(`Go to http://localhost:${5000}`)
})
