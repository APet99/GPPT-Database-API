const express = require('express');
const router = express.Router();


router.route('/addAuth').post(async (req, res) =>{
    const authEntry = new Auth({
        auth : '9cK03i8JwSRfajBz'
    });
    authEntry.save()
        .then((result) => {

            res.send(result);
            res.status(200);
        })
        .catch((err) => {
            console.log(err);
        });
});

module.exports = router;
