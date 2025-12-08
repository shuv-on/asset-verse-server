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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// collections
let db;
let usersCollection;
let assetsCollection;
let requestsCollection;


async function connectDB() {
  if (db) return; 
  try {
    await client.connect();
    db = client.db("assetVerse");
    usersCollection = db.collection("users");
    assetsCollection = db.collection("assets");
    requestsCollection = db.collection("requests");
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


// Root route
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

//Add asset
app.post('/assets', verifyToken, async (req, res) => {
  await connectDB();
  const asset = req.body;
  const result = await assetsCollection.insertOne(asset);
  res.send(result);
})

//Get asset
app.get('/assets', verifyToken, async (req, res) => {
  await connectDB();
  const email = req.query.email;
  const search = req.query.search || "";
  const filter = req.query.filter || "";

  
  let query = {
    hrEmail: email,
    productName: { $regex: search, $options: 'i' } 
  };

  if (filter) {
    query.productType = filter;
  }

  const result = await assetsCollection.find(query).toArray();
  res.send(result);
})

//Asset delte
app.delete('/assets/:id', verifyToken, async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await assetsCollection.deleteOne(query);
  res.send(result);
})

//get asset by id
app.get('/assets/:id', verifyToken, async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await assetsCollection.findOne(query);
  res.send(result);
})

//Update asset 
app.patch('/assets/:id', verifyToken, async(req, res) =>{
  await connectDB();
  const id = req.params.id;
  const item = req.body;
  const filter = {_id: new ObjectId(id)};
  const updatedDoc = {
    $set: {
      productName: item.productName,
      productType: item.productType,
      productQuantity: item.productQuantity
    }
  }
  const result = await assetsCollection.updateOne(filter, updatedDoc);
  res.send(result);
})

//Get available assets
app.get('/assets-available', verifyToken, async (req, res) => { 
    await connectDB();
    const search = req.query.search || "";
    const filter = req.query.filter || "";

    let query = {
        productName: { $regex: search, $options: 'i' }, 
        productQuantity: { $gt: 0 } 
    };

    if (filter) {
        query.productType = filter;
    }

    const result = await assetsCollection.find(query).toArray();
    res.send(result);
});

//Request asset
app.post('/requests', verifyToken, async (req, res) => {
    await connectDB();
    const request = req.body;
    const result = await requestsCollection.insertOne(request);
    res.send(result);
});


app.get('/requests', verifyToken, async (req, res) => {
    await connectDB();
    const email = req.query.email;
    let query = {};
    if (email) {
        query = { hrEmail: email };
    }
    const result = await requestsCollection.find(query).toArray();
    res.send(result);
});
//HR Action
/* app.patch('/requests/:id', verifyToken, async (req, res) => {
    await connectDB();
    const id = req.params.id;
    const { status, assetId } = req.body; 

    const query = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: { status: status }
    };

    const result = await requestsCollection.updateOne(query, updateDoc);

    
    if (status === 'approved' && result.modifiedCount > 0) {
        const assetQuery = { _id: new ObjectId(assetId) };
        const updateAssetDoc = {
            $inc: { productQuantity: -1 }
        };
        await assetsCollection.updateOne(assetQuery, updateAssetDoc);
    }

    res.send(result);
}); */

//Get my rqst
app.get('/my-requested-assets', verifyToken, async (req, res) => {
    await connectDB();
    const email = req.query.email;
    const query = { requesterEmail: email };
    const result = await requestsCollection.find(query).toArray();
    res.send(result);
});

//Cancel my rqst
app.delete('/requests/:id', verifyToken, async (req, res) => {
    await connectDB();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await requestsCollection.deleteOne(query);
    res.send(result);
});

//HR affialtes
app.patch('/requests/:id', verifyToken, async (req, res) => {
    await connectDB();
    const id = req.params.id;
    const { status, assetId, requesterEmail, hrEmail } = req.body;

    
    if (status === 'approved') {
        const hrUser = await usersCollection.findOne({ email: hrEmail });
     
        if (!hrUser) {
            return res.status(404).send({ message: "HR not found" });
        }

        const currentEmps = hrUser.currentEmployees || 0;
       
        let limit = 5;
        if (hrUser.packageLimit !== undefined) {
            limit = hrUser.packageLimit;
        }

       
        if (currentEmps >= limit) {
            return res.send({ message: "limit_reached" }); 
        }
    }

    
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: { status: status }
    };

    const result = await requestsCollection.updateOne(query, updateDoc);

   
    if (status === 'approved' && result.modifiedCount > 0) {
        
       
        const assetQuery = { _id: new ObjectId(assetId) };
        const updateAssetDoc = { $inc: { productQuantity: -1 } };
        await assetsCollection.updateOne(assetQuery, updateAssetDoc);

        
        const hrUser = await usersCollection.findOne({ email: hrEmail });
        
        if (hrUser) {
            const userQuery = { email: requesterEmail };
            const updateUserDoc = {
                $set: { 
                    companyName: hrUser.companyName,
                    companyLogo: hrUser.companyLogo,
                    role: 'employee', 
                    hrEmail: hrEmail
                }
            };
            await usersCollection.updateOne(userQuery, updateUserDoc);

            await usersCollection.updateOne(
                { email: hrEmail },
                { $inc: { currentEmployees: 1 } }
            );
        }
    }

    res.send(result);
});


//My employess
app.get('/my-employees', verifyToken, async (req, res) => {
    await connectDB();
    const email = req.query.email;
    
    
    const hrUser = await usersCollection.findOne({ email: email });
    if (!hrUser) {
        return res.send([]);
    }

    
    const query = { 
        companyName: hrUser.companyName,
        role: 'employee'
    };
    
    const result = await usersCollection.find(query).toArray();
    res.send(result);
});


//Remove employee
app.patch('/users/remove/:id', verifyToken, async (req, res) => {
    await connectDB();
    const userId = req.params.id; 
    const { hrEmail } = req.body; 

  
    const query = { _id: new ObjectId(userId) };
    const updateDoc = {
        $set: { 
            companyName: "",
            companyLogo: "",
            hrEmail: ""
           
        }
    };

    const result = await usersCollection.updateOne(query, updateDoc);

    
    if (result.modifiedCount > 0) {
        const hrQuery = { email: hrEmail };
        const updateHrDoc = { $inc: { currentEmployees: -1 } };
        await usersCollection.updateOne(hrQuery, updateHrDoc);
    }

    res.send(result);
});

//Create payment
app.post('/create-payment-intent', verifyToken, async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    
    console.log(amount, 'amount inside the intent')

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
    });

    res.send({
        clientSecret: paymentIntent.client_secret
    })
});

//Save payment
app.post('/payments', verifyToken, async (req, res) => {
    await connectDB();
    const payment = req.body;
    const paymentResult = await db.collection("payments").insertOne(payment);
    const query = { email: payment.email };
    const updateDoc = {
        $set: { 
            packageLimit: payment.limit 
        }
    };
    
    const updateResult = await usersCollection.updateOne(query, updateDoc);

    res.send({ paymentResult, updateResult });
});

//Profile pic updated
app.put('/users/:email', verifyToken, async (req, res) => {
    await connectDB();
    const email = req.params.email;
    const updateData = req.body;
    
    const filter = { email: email };
    const updateDoc = {
        $set: updateData
    };
    
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
});


// Start Server
app.listen(port, () => {
  console.log(`AssetVerse server is running on port: ${port}`);
})