const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json()); // Parse JSON request bodies
app.set('port', 3000);

// **Logging Middleware - Place It Here**
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Middleware for CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, Accept, Content-Type, X-Requested-With, Access-Control-Allow-Headers'
    );
    next();
});

// MongoDB connection
const mongoUri = 'mongodb+srv://hamzaakhan24:mdx986868@cst3144.sq6yv.mongodb.net/';
let db;

MongoClient.connect(mongoUri, { useUnifiedTopology: true })
    .then(client => {
        db = client.db('webstore');
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });



// Serve products data from MongoDB
app.get('/Products', async (req, res) => {
    try {
        const products = await db.collection('products').find().toArray();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send({ message: 'Error fetching products' });
    }
});

// Handle order submission
app.post('/order', async (req, res) => {
    const order = req.body;

    console.log('Received Order:', order); // Log the received order

    if (!order.firstName || !order.lastName || !order.cart || !order.cart.length) {
        return res.status(400).send({ message: 'Invalid order data' });
    }

    try {
        await db.collection('orders').insertOne(order);
        console.log('Order Saved:', order);
        res.status(201).send({ message: 'Order Received Successfully!' });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).send({ message: 'Failed to save order' });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
