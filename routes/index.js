const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');
// const users = mongoose.connection.collection('users');


router.get('/', async (req, res, next) => {
    try {
        res.status(200).send({'message': 'Welcome to GPPT API'})
    } catch (e) {
        next(e);
    }
});


module.exports = router;