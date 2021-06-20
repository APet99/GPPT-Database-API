const express = require('express');
const router = express.Router();
const Save = require("../models/Save");


router.get('/', function(req, res, next) {
    res.send('HelloWorld');
});



router.route('/addSave').post(async (req, res) =>{
    const saveEntry = new Save({
        userName : 'testUser',
        objects : ['Object1', 'Object2']
    });
    saveEntry.save()
        .then((result) => {

            res.send(result);
            res.status(200);
        })
        .catch((err) => {
            console.log(err);
        });
});


module.exports = router;
