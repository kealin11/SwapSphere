const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "NewPassword123!", 
  database: "swapsphere",
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB ERROR:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

module.exports = db;