require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Entry = require('./schema.js');

const app = express();
const port = process.env.PORT || 3202;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'experiment.html'));
});

// MongoDB
let raw_data = fs.readFileSync('mongo_auth.json');
let auth = JSON.parse(raw_data);  
let mongoDBUri = `mongodb://${auth.user}:${auth.password}@127.0.0.1:27017/alvin?authSource=admin`;

mongoose.connect(mongoDBUri)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

// Logging
app.post('/api/log', (req, res) => {
    try {
        console.log("req.body");
        console.log(req.body);
    } catch (error) {
        console.error('Error in POST request:', error);
        res.status(500).send('Internal Server Error');
    }
    const newLog = new Entry(req.body);
    newLog.save()
        .then(() => res.send('Action logged successfully'))
        .catch(err => res.status(500).send('Error logging action: ' + err.message));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});