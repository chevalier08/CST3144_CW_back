const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); //"logger" middleware

const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const path = require("path");
const PropertiesReader = require("properties-reader");

//Load properties from dbconnection.properties
const propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
const properties = PropertiesReader(propertiesPath);

const uri = `${properties.get("db.prefix")}${properties.get("db.user")}:${properties.get("db.password")}${properties.get("db.host")}${properties.get("db.params")}`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db; //Database reference

//Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db(properties.get("db.name"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB();

//Static middleware returning lessons images for demonstration purposes
app.get('/images/:img', (req, res) => {
  const filePath = path.join(__dirname, 'images', req.params.img);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: "Image file does not exist" });
  }
});


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

// POST /orders
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

// PUT /lessons/:id
app.put('/lessons/:id', async (req, res) => {
    const lessonId = req.params.id;
    const updateData = req.body;  

    try {
        const result = await db.collection('lessons').updateOne(
            { _id: new ObjectId(lessonId) }, 
            { $set: updateData }
        );

        res.status(200).json({ message: "Lesson updated", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Search functionality
app.get('/search', async (req, res) => {
  const q = (req.query.query || "").trim();
  const regex = new RegExp(q, "i");

  const num = Number(q);
  const isNum = !isNaN(num);

  try {
    const results = await db.collection("lessons").find({
      $or: [
        { subject: regex },
        { location: regex },
        ...(isNum ? [{ price: num }, { spaces: num }] : [])
      ]
    }).toArray();

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


