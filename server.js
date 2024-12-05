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
app.use('/images*', (req, res) => {
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

    //search functionality
    app.get('/search', async (req, res) => { // <-- NEW ROUTE
        const query = req.query.q; // Get the search query from the request parameters
    
        if (!query) {
            return res.status(400).json({ msg: 'Search query is required' });
        }
    
        try {
            const results = await db.collection('products').find({
                $or: [
                    { title: { $regex: query, $options: 'i' } }, // Case-insensitive match for `title`
                    { description: { $regex: query, $options: 'i' } }, // Case-insensitive match for `description`
                    { Location: { $regex: query, $options: 'i' } } // Case-insensitive match for `Location`
                ]
            }).toArray();
    
            res.json(results); // Return filtered results
        } catch (err) {
            console.error('Error during search:', err);
            res.status(500).send({ msg: 'Error performing search' });
        }
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
    const availableInventory = req.body.availableInventory;

    // **Add: Validate `availableInventory`: Ensure it's a non-negative number**
    if (typeof availableInventory !== 'number' || availableInventory < 0) {
        return res.status(400).send({ msg: 'Invalid availableInventory value' });
    }

    // **Add: Validate `id`: Ensure it's a valid ObjectId**
    const productId = req.params.id;
    if (!ObjectId.isValid(productId)) { // <-- Added validation for ID format
        return res.status(400).send({ msg: 'Invalid product ID format' });
    }

    db.collection('products').updateOne(
        { _id: new ObjectId(productId) }, // <-- Highlight: ObjectId conversion
        { $set: { availableInventory } },                
        { safe: true, multi: false },
        (err, result) => {
            if (err) {
                console.error('Error updating product:', err); // <-- Add error logging
                return next(err); // <-- Add error handling
            }
            res.send(result.modifiedCount === 1 ? { msg: 'success' } : { msg: 'No product updated' }); // <-- Clarified response
        }
    );
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
