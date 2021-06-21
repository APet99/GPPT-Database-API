const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const saves = mongoose.connection.collection('saves');


router.get('/', async (req, res, next) => {
    res.status(200).send({'message': 'Hello World'})
});


//todo Is steam usernames case sensative?
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


/*CREATE*/
router.route('/add').post(async (req, res, next) => {
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
            throw new Error('Steam Name not provided');
        }
        res.send(await getByName(steamName));
    } catch (e) {
        next(e);
    }
});

router.route('/getByID').get(async (req, res, next) => {
    try {
        const steamID = req.query.steamID;
        if (!steamID) {
            throw new Error('Steam ID not provided');
        }
        res.send(await getByID(steamID));
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

        res.send(await saves.findOne(query));
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
        res.status(200).send(result);
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

// todo Get al saves where (query)
// todo Get all saves where not (query)

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

// todo update last plated??

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


// Update All Saves
// router.route('/addFieldToAll').put(async (req, res, next) => {
//     try {
//         const fieldName = req.query.fieldName;
//         const value = req.query.fieldValue;
//
//         res.status(202).send(await saves.updateMany({}, {fieldName: value}, {upsert: true}))
//     } catch (e) {
//         next(e);
//     }
// })
//
// router.route('/updateFieldForAll').put(async (req, res, next) => {
//     try {
//         const fieldName = req.query.fieldName;
//         const value = req.query.fieldValue;
//
//         res.status(202).send(await saves.updateMany({},{fieldName: value}, {upsert: false}))
//     } catch (e) {
//         next(e);
//     }
// })

// todo Update Saves Where (query)

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

// todo Delete all saves where (query)

router.route('/doesSaveExist').get(async (req, res) => {
    const data = req.query;
    const steamName = data.steamName;
    const steamID = data.steamID

    try {
        const result = await doesSaveExist(steamName, steamID);
        res.status(200).send(result);
    } catch (e) {
        res.status(400).send();
    }
});


module.exports = router;
