const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb'); // to ensure they work with mongo db

const app = express();
app.use(express.json()); // Parse JSON request bodies
app.set('port', 3000); // server port

// Logging Middleware 
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Middleware for CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // allows all origina
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // allowed https methods
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

MongoClient.connect(mongoUri, { useUnifiedTopology: true }) // connect to mongodb atlas
    .then(client => {
        db = client.db('webstore');
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

    //search functionality
    app.get('/search', async (req, res) => { // <-- NEW ROUTE
        const query = req.query.q; // search query from the request parameters
    
        if (!query) {
            return res.status(400).json({ msg: 'Search query is required' }); // validate search queries
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
            console.error('Error during search:', err); // log errors
            res.status(500).send({ msg: 'Error performing search' });
        }
    });



// get all products
app.get('/products', async (req, res) => {
    try {
        const products = await db.collection('products').find().toArray(); // fetch all products
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send({ message: 'Error fetching products' });
    }
});

// Handling order submission
app.post('/order', async (req, res) => {
    const order = req.body;

    console.log('Received Order:', order); // log receive order

    // Validate required fields
    if (!order.firstName || !order.lastName || !order.cart || !order.cart.length) {
        return res.status(400).send({ message: 'Invalid order data' });
    }

    // Ensure `isGift` is defined
    if (typeof order.isGift === 'undefined') {
        order.isGift = false;
    }

    try {
        // Save order to MongoDB
        await db.collection('orders').insertOne(order);
        console.log('Order Saved:', order);

        //update inventory for each product in mongo db
        const updatePromises = order.cart.map(item =>
            db.collection('products').updateOne(
                {_id: new ObjectId(item.id) },
                { $inc: { availableInventory: -item.quantity} }
            )
        );  
        
        await Promise.all(updatePromises);
        console.log('Inventory Updated for Order');
        
        res.status(201).send({ message: 'Order Received Successfully!' });
    } catch (err) {
        console.error('Error saving order to MongoDB:', err); //log errors
        res.status(500).send({ message: 'Failed to save order' });
    }
});

app.put('/products/:id', (req, res, next) => { // update products availability
    const availableInventory = req.body.availableInventory; // update inventory value

    // Validate `availableInventory`: must be a non-negative number**
    if (typeof availableInventory !== 'number' || availableInventory < 0) {
        return res.status(400).send({ msg: 'Invalid availableInventory value' });
    }

    // Validate `id`: must a valid ObjectId**
    const productId = req.params.id;
    if (!ObjectId.isValid(productId)) { // <-- Added validation for ID format
        return res.status(400).send({ msg: 'Invalid product ID format' });
    }
    // update products availability in mongodb
    db.collection('products').updateOne(
        { _id: new ObjectId(productId) }, // match by product id
        { $set: { availableInventory } }, // updates availableInventory field               
        { safe: true, multi: false },
        (err, result) => {
            if (err) {
                console.error('Error updating product:', err); //error logging
                return next(err); // error handling
            }
            res.send(result.modifiedCount === 1 ? { msg: 'success' } : { msg: 'No product updated' }); // <-- Clarified response
        }
    );
});


// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`); // server startup
});
