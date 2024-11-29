const express = require('express');
const path = require('path');

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
    const Products = [
        {topic: 'Martial Arts', location: 'Alabama', price: '40', space: '5'},
        {topic: 'Sports', location: 'Nevada', price: '40', space: '5'},
        {topic: 'Culinary Arts', location: 'Alabama', price: '35', space: '5'},
        {topic: 'Drama and Theatre', location: 'Arizona', price: '30', space: '5'},
        {topic: 'Digital Imaging', location: 'California', price: '50', space: '5'},
        {topic: 'Dance Fusion', location: 'Nevada', price: '25', space: '5'},
        {topic: 'Technology Workshop', location: 'California', price: '45', space: '5'},
        {topic: 'Book Club', location: 'Arizona', price: '20', space: '5'},
        {topic: 'Fashion Designing', location: 'Nevada', price: '35', space: '5'},
        {topic: 'Public Speaking', location: 'Alabama', price: '25', space: '5'}
    ];
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

