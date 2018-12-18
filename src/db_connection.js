const mysql = require('mysql')

const pool = mysql.createPool({
  host: "zanner.org.ua",
  port: "33321",
  user: "ka65_05",
  password: "666666",
  database: "ka65_05"
})

module.exports = pool

