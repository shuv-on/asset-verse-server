require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

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


const verifyToken = (req, res, next) => {
  console.log('inside verify token', req.headers.authorization);
  
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

async function run() {
  try {
   
    const db = client.db("assetVerse");
    const usersCollection = db.collection("users");

   
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    });

    // Users API 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    

    app.get('/users', verifyToken, async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
    })
    
    app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await usersCollection.findOne(query);
        res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");

  } finally {
   
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('AssetVerse server is running');
})

app.listen(port, () => {
    console.log(`AssetVerse server is running on port: ${port}`);
})