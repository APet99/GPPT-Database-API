const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const users = mongoose.connection.collection('users');
const saves = mongoose.connection.collection('saves');


async function createUser(steamName, steamID, discordName = null, vipStartDate = null, vipEndDate = null) {
    try {
        let Nickname = steamName;

        let userID = steamID;
        // console.log(Nickname, userID);
        let save = (await saves.findOne({'Description': {'$regex': `${userID}`}}))._id;
        // console.log(save);
        if (Nickname == null || userID == null) {
            console.log(Nickname, userID);
            return;
        }

        if (!await userExists(Nickname, userID)) {
            let dName = discordName != null ? discordName : '';
            let vipStart = vipStartDate != null ? vipStartDate : new Date('1970-01-01');
            let vipEnd = vipEndDate != null ? vipEndDate : new Date('1970-01-01');


            let result = await users.insertOne({
                'Nickname': Nickname,
                'steamID': userID[0],
                'discordName': dName,
                'vipStartDate': vipStart,
                'vipEndDate': vipEnd,
                'save': save,
                'banned': false,
                'lastVIPDaily':new Date('1970-01-01')
            });
            if (result != null) {
                return result
            }
        }
    } catch (e) {

    }
}

async function userExists(steamName, steamID) {
    let q1 = await users.findOne({'Nickname': steamName});
    let q2 = await users.findOne({'steamID': steamID});

    return (q1 !== null) || (q2 !== null);
}

async function canReceiveVIPDaily(steamID){
    try {
        const id = req.query.steamID;

        let query = await users.findOne({'steamID': id})
        if (query != null) {
            if(query.vipEndDate >= Date.now()){
                if(query['lastVIPDaily'] != null && query['lastVIPDaily'] < Date.now()){
                    return true;
                }
            }
        }
        return false;
    } catch (e) {
        //nothing
    }
}

//Create
router.post('/add', async (req, res, next) => {
    try {
        let Nickname = req.query.steamName;
        let userID = req.query.steamID;
        let startDate = req.query.vipStartDate != null ? req.query.vipStartDate.split('/') : null;
        let endDate = req.query.vipEndDate != null ? req.query.vipEndDate.split('/') : null;
        let s = (await saves.findOne({'Description': {'$regex': userID}}));
        let save = s != null && s !== undefined ? s._id : null;

        if (Nickname == null || userID == null) {
            next('Can not add user without username and/or ID');
        }

        if (await userExists(Nickname, userID)) {
            next('User already exists');
        }
        let discordName = req.query.discordName != null ? req.query.discordName : '';


        let vipStartDate = startDate !== null ? new Date(startDate[0], startDate[1] - 1, startDate[2]) : new Date('1970-01-01');
        let vipEndDate = endDate !== null ? new Date(endDate[0], endDate[1] - 1, endDate[2]) : new Date('1970-01-01');


        let result = await users.insertOne({
            'Nickname': Nickname,
            'steamID': userID,
            'discordName': discordName,
            'vipStartDate': vipStartDate,
            'vipEndDate': vipEndDate,
            'save': save,
            'banned': false,
            'lastVIPDaily':new Date('1970-01-01')
        });

        if (result != null) {
            res.status(200).send(result.ops[0]);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.post('/addAllFromSaves', async (req, res, next) => {
    let s = await saves.find({}).toArray();
    let re = /\d{17}/
    for (let save of s) {
        let steamID = await re.exec(save.Description);
        if (steamID == null) continue;
        try {
            if (!await userExists(save.Nickname, steamID[0])) {

                await createUser(save.Nickname, steamID[0]);
            }
        } catch (e) {
        }

    }
    res.status(200).send();
});

router.post('/addFieldToAll', async (req, res, next) => {
    await users.update({}, {$set: {lastVIPDaily: new Date('1970-01-01')}},{upsert:false, multi:true});
});

//Read
// Sanity Check: Determine if the api is successfully being reached.
router.get('/', async (req, res, next) => {
    try {
        res.status(200).send({'message': 'Hello Users'})
    } catch (e) {
        next(e);
    }
});

router.get('/getByName', async (req, res, next) => {
    try {
        const nickname = req.query.steamName;

        let result = await users.findOne({'Nickname': nickname});
        if (result != null) {
            res.status(200).send(result);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.get('/getByID', async (req, res, next) => {
    try {
        const id = req.query.steamID;

        let result = await users.findOne({"steamID": id});

        if (result != null) {
            res.status(200).send(result);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.get('/getByDiscord', async (req, res, next) => {
    try {
        const discordName = req.query.discordName

        let result = await users.findOne({"discordName": discordName});

        if (result != null) {
            res.status(200).send(result);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.get('/canReceiveVIPDaily', async (req, res, next)=>{
    try {
        const id = req.query.steamID;

        let result = await canReceiveVIPDaily(id);
        res.status(200).send({'canReceiveVIPDaily': result});

    } catch (e) {
        next(e);
    }

});

//todo get all

router.get('/vipStatusID', async (req, res, next) => {
    try {
        const id = req.query.steamID;

        let query = await users.findOne({'steamID': id})
        if (query != null) {
            let result = {
                vipStartDate: query.vipStartDate,
                vipEndDate: query.vipEndDate,
                isActive: query.vipEndDate > Date.now(),
            }
            res.status(200).send(result);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.get('/vipStatus', async (req, res, next) => {
    try {
        const name = req.query.steamName;

        let query = await users.findOne({'Nickname': name})
        if (query != null) {
            let result = {
                vipStartDate: query.vipStartDate,
                vipEndDate: query.vipEndDate,
                isActive: query.vipEndDate > Date.now(),
            }
            res.status(200).send(result);
        } else {
            res.status(204).send();
        }
    } catch (e) {
        next(e);
    }
});

router.get('/isBannedName', async (req, res, next) => {
    try {
        let banStatus = (await users.findOne({'steamID': req.query.steamID})).banned;

        res.status(200).send({'isBanned': banStatus});
    } catch (e) {
        next(e);
    }
});

//todo change endpoint
router.get('/isBannedName', async (req, res, next) => {
    try {
        let banStatus = (await users.findOne({'Nickname': req.query.steamName})).banned;

        res.status(200).send({'isBanned': banStatus});
    } catch (e) {
        next(e);
    }
});


//Update
router.put('/update', async (req, res, next) => {
    try {
        let steamID;
        if (req.query.steamID != null) {
            steamID = req.query.steamID;
        } else {
            steamID = req.body.steamID;
        }

        const body = req.body;
        let response = await users.findOneAndReplace({'steamID': steamID}, body, {upsert: true})

        if (response != null) {
            res.status(200).send(response);
        } else {
            next(`Update Failed where steamID = ${steamID}`)
        }
    } catch (e) {
        next(e);
    }
});

router.put('/replaceByID', async (req, res, next) => {
    try {
        const id = req.query.steamID;
        if (req.body._id) {
            delete req.body._id;
        }

        res.send(await users.findOneAndReplace({'steamID': id}, req.body));

    } catch (e) {
        next(e);
    }
});

router.put('/banByName', async (req, res, next) => {
    try {
        res.status(204).send(await users.findOneAndUpdate({'Nickname': req.query.steamName}, {'banned': true}, {upsert: true}));
    } catch (e) {
        next(e);
    }
});

router.put('/banByID', async (req, res, next) => {
    try {
        res.status(204).send(await users.findOneAndUpdate({'Nickname': req.query.steamName}, {'banned': true}, {upsert: true}));
    } catch (e) {
        next(e);
    }
});

router.put('/unBanByName', async (req, res, next) => {
    try {
        res.status(204).send(await users.findOneAndUpdate({'Nickname': req.query.steamName}, {'banned': false}, {upsert: true}));
    } catch (e) {
        next(e);
    }
});

router.put('/unBanByID', async (req, res, next) => {
    try {
        res.status(204).send(await users.findOneAndUpdate({'Nickname': req.query.steamName}, {'banned': false}, {upsert: true}));
    } catch (e) {
        next(e);
    }
});


//Delete
router.delete('/deleteByName', async (req, res, next) => {
    try {
        const steamName = req.query.steamName;
        await users.deleteOne({'Nickname': steamName});
        res.status(204).send();

    } catch (e) {
        next(e);
    }
});

router.delete('/deleteByID', async (req, res, next) => {
    try {
        const steamID = req.query.steamID
        await users.deleteOne({'steamID': steamID});
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});

router.delete('/deleteAll', async (req, res, next) => {
    try {
        const confirmation = req.query.confirmation;
        if (!confirmation) {
            next('You must confirm to delete all users');
        }
        if (confirmation === 'ConfirmDeleteAll') {
            await users.deleteMany({});
            res.status(204).send();
        } else {
            next('Confirmation does not match');
        }
    } catch (e) {
        next(e);
    }
});


module.exports = router;
module.exports.cUser = createUser;


