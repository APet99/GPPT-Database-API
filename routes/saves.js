const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const saves = mongoose.connection.collection('saves');

/*
* Common functionality seen across multiple endpoints
* */

/*
* Determines if a save exists, given a steamName and/or steamID.
*
* steamName: Display name belonging to a steam account.
* steamID: 17 Digit unique steam identifier
*
* If both are given, the save MUST have a matching name and id to return true. If one of the two differs, the save does
* not exist. If only one field is supplied, only that field would be queried.
* */
async function doesSaveExist(steamName = '', steamID = '') {
    if (!steamName && !steamID) {
        throw new Error('Steam Name or Steam ID not provided');
    }
    // check if a save exists where name or ID is found
    let query = {}

    if (steamName) {
        query.Nickname = `${steamName}`;
    }
    if (steamID) {
        query.Description = {'$regex': `${steamID}`};
    }

    const numDoc = await saves.countDocuments(query);

    return numDoc > 0;
}

async function insertUser(json) {
    return await saves.insertOne(json)
}

async function getByName(steamName) {
    try {
        return await saves.findOne({'Nickname': steamName});
    } catch (e) {
        console.log(e);
    }
}

async function getByID(steamID) {
    try {
        return await saves.findOne({'Description': {'$regex': steamID}});
    } catch (e) {
        console.log(e);
    }
}

// Sanity Check: Determine if the api is successfully being reached.
router.get('/', async (req, res, next) => {
    try {
        res.status(200).send({'message': 'Request Successful'})
    } catch (e) {
        next(e);
    }
});


/*CREATE*/
router.route('/add').post(async (req, res, next) => {       //todo what if body is none?
    const bodyData = req.body;
    try {
        res.status(200).send(await insertUser(bodyData));
    } catch (e) {
        next(e);
    }
});

router.route('/addMultiple').post(async (req, res, next) => {
    const data = (req.body);

    try {
        for (let saveBox of data.ObjectStates[0].ContainedObjects) {
            await insertUser(saveBox);
        }
        res.status(200).send(data.ObjectStates[0].ContainedObjects);
    } catch (e) {
        next(e);
    }
});


/*READ*/
router.route('/getByName').get(async (req, res, next) => {
    try {
        const steamName = req.query.steamName;
        if (!steamName) {
            next('Steam Name not provided');
        }
        const result = await getByName(steamName);
        if (result){
            res.send(await getByName(steamName));
        }else{
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.route('/getByID').get(async (req, res, next) => {
    try {
        const steamID = req.query.steamID;
        if (!steamID) {
            next('Steam ID not provided');
        }
        const result = await getByID(steamID);
        if (result){
            res.send(result);
        }else{
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.route('/get').get(async (req, res, next) => {
    try {
        const steamName = req.query.steamName;
        const steamID = req.query.steamID;
        if (!steamName && !steamID) {
            throw new Error('Steam Name or Steam ID not provided');
        }
        // check if a save exists where name or ID is found
        let query = {}

        if (steamName) {
            query.Nickname = `${steamName}`;
        }
        if (steamID) {
            query.Description = {'$regex': `${steamID}`};
        }
        const result = await saves.findOne(query);
        if (result){
            res.send(await saves.findOne(query));
        }else{
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.route('/getMultipleByName').get(async (req, res, next) => {
    try {
        let result = [];

        const userNames = JSON.parse(req.query.userNames);
        for (const name of userNames) {
            let instance = await saves.findOne({'Nickname': name})
            if (instance) {
                result.push(instance);
            }
        }
        if(result.length == 0){
            res.status(204).send();
        }else{
            res.status(200).send(result);
        }
    } catch
        (e) {
        next(e);
    }
});

router.route('/getAll').get(async (req, res, next) => {
    try {
        await saves.find({}).toArray(function (e, documents) {
            if (e) next(e);

            res.send(documents);
        });
    } catch (e) {
        next(e);
    }
});


/*UPDATE*/
// Update an existing save's changes.
router.route('/updateName').put(async (req, res, next) => {
    try {
        const name = req.query.steamName;
        const newName = req.query.newName;
        if (getByName(name)) {
            res.send(await saves.findOneAndUpdate({'Nickname': name}, {'$set': {'Nickname': newName}}, {upsert: false}));
        }
    } catch (e) {
        next(e);
    }
});

router.route('/replaceByName').put(async (req, res, next) => {
    try {
        const name = req.query.steamName;
        if (req.body._id) {
            delete req.body._id;
        }
        if (getByName(name)) {
            res.send(await saves.findOneAndReplace({'Nickname': name}, req.body));
        }
    } catch (e) {
        next(e);
    }
});

router.route('/replaceByID').put(async (req, res, next) => {
    try {
        const id = req.query.steamID;
        if (req.body._id) {
            delete req.body._id;
        }
        if (getByID(id)) {
            res.send(await saves.findOneAndReplace({'Description': {'$regex': id}}, req.body));
        }
    } catch (e) {
        next(e);
    }
});


/*DELETE*/
router.route('/deleteByName').delete(async (req, res, next) => {
    try {
        const steamName = req.query.steamName
        await saves.deleteOne({'Nickname': steamName});
        res.status(204).send();

    } catch (e) {
        next(e);
    }
});

router.route('/deleteByID').delete(async (req, res, next) => {
    try {
        const steamID = req.query.steamID
        await saves.deleteOne({'Description': {'$regex': steamID}});
        res.status(204).send();

    } catch (e) {
        next(e);
    }
});

router.route('/deleteAll').delete(async (req, res, next) => {
    try {
        const confirmation = req.query.confirmation;
        if (!confirmation) {
            next('You must confirm to delete all saves');
        }
        if (confirmation === 'ConfirmDeleteAll') {
            await saves.deleteMany({});
            res.status(204).send();
        } else {
            next('Confirmation does not match');
        }
    } catch (e) {
        next(e);
    }
});

router.route('/doesSaveExist').get(async (req, res) => {
    const data = req.query;
    const steamName = data.steamName;
    const steamID = data.steamID

    try {
        const result = await doesSaveExist(steamName, steamID);
        res.status(200).send({'exists': result});
    } catch (e) {
        res.status(400).send();
    }
});


module.exports = router;
