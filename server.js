const express = require('express');
const path = require('path');

const products = require('./Products');

const app = express();

app.use(express.json());
app.set('port', 3000);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    next();
});

const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://hamzaakhan24:mdx986868@cst3144.sq6yv.mongodb.net/', (err, client) => {
    db = client.db('webstore');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'AfterSchoolActivities.html'));

});

app.get('./Products', (req, res) => {
    res.json(Products);
});

app.post('./order', (req, res) => {
    const order = req.body;

    console.log('Order Received:', order);

    res.status(201).send({ message: 'Order Received Successfully!'});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

