require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tk04nnw.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


let db;
let usersCollection;


async function connectDB() {
  if (db) return; 
  try {
    await client.connect();
    db = client.db("assetVerse");
    usersCollection = db.collection("users");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

// Verify Token 
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.decoded = decoded;
    next();
  })
}


// Root Route
app.get('/', (req, res) => {
  res.send('AssetVerse server is running');
})

// JWT API
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  res.send({ token });
});

// Create User
app.post('/users', async (req, res) => {
  await connectDB(); 
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: 'user already exists', insertedId: null })
  }
  const result = await usersCollection.insertOne(user);
  res.send(result);
});

// Get All Userr
app.get('/users', verifyToken, async (req, res) => {
  await connectDB();
  const result = await usersCollection.find().toArray();
  res.send(result);
})

// Get Specific User
app.get('/users/:email', async (req, res) => {
  await connectDB();
  const email = req.params.email;
  const query = { email: email };
  const result = await usersCollection.findOne(query);
  res.send(result);
})

// Start Server
app.listen(port, () => {
  console.log(`AssetVerse server is running on port: ${port}`);
})