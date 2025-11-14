const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const path = require("path");
const PropertiesReader = require("properties-reader");

// Load properties from dbconnection.properties
const propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
const properties = PropertiesReader(propertiesPath);

const uri = `${properties.get("db.prefix")}${properties.get("db.user")}:${properties.get("db.password")}${properties.get("db.host")}${properties.get("db.params")}`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db; // database reference

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(properties.get("db.name"));
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB();

// GET /lessons
app.get('/lessons', async (req, res, next) => {
  try {
    const lessonsCollection = db.collection("lessons");
    const lessons = await lessonsCollection.find({}).toArray();
    res.json(lessons);
  } catch (err) {
    next(err);
  }
});

app.post('/orders', async (req, res) => {
  try {
    const ordersCollection = db.collection("orders");
    console.log("POST request to collection:", req.params.collectionName);
    console.log("Order data:", req.body);

    const result = await ordersCollection.insertOne(req.body);

    res.json({
      message: "Order saved successfully",
      insertedId: result.insertedId
    });

  } catch (err) {
    console.error("Error inserting document:", err.message);
    res.status(500).json({ error: "Failed to insert document" });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});


