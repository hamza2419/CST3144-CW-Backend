const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

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

//static middleware for the images
app.use('/images', express.static(path.join(__dirname, 'images')));

//middleware for missing images
app.use('/images', (req, res) => {
    res.status(404).json({ error: 'Image file does not exist' });
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
app.get('/products', async (req, res) => {
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

    console.log('Received Order:', order);

    // Validate required fields
    if (!order.firstName || !order.lastName || !order.cart || !order.cart.length) {
        return res.status(400).send({ message: 'Invalid order data' });
    }

    // Ensure `isGift` is defined
    if (typeof order.isGift === 'undefined') {
        order.isGift = false;
    }

    try {
        // Save the order to MongoDB
        await db.collection('orders').insertOne(order);
        console.log('Order Saved:', order);
        res.status(201).send({ message: 'Order Received Successfully!' });
    } catch (err) {
        console.error('Error saving order to MongoDB:', err);
        res.status(500).send({ message: 'Failed to save order' });
    }
});

app.put('/products/:id', (req, res, next) => {
    const availableInventory = req.body.availableInventory; // Extract spaces from the request body

    // Validate spaces: ensure it's a non-negative number
    if (typeof availableInventory !== 'number' || availableInventory < 0) {
        return res.status(400).send({ msg: 'Invalid availableInventory value' });
    }

    db.collection('products').updateOne(
        { _id: new ObjectId(req.params.id) }, // Match by product ID
        { $set: { availableInventory } },                // Update the spaces field
        { safe: true, multi: false },
        (err, result) => {
            if (err) return next(err);
            res.send(result.modifiedCount === 1 ? { msg: 'success' } : { msg: 'error' });
        }
    );
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
