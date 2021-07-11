const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const tournaments = mongoose.connection.collection('tournaments');
const users = mongoose.connection.collection('users');


// Helpers
async function getTournamentResults(tournamentName){
    let tournament = await tournaments.findOne({'name': tournamentName});

    tournament.players.sort(function (a, b){
        return a.position - b.position;
    });
    return tournament.players;
}


//Create
router.post('/create', async (req, res, next) => {
    try {
        let tournamentName = req.query.tournamentName;
        let tTime = req.query.tournamentTime !== null? req.query.tournamentTime.split(':'): [0,0];

        let d = new Date();

        let tournamentDate  = new Date(d.getFullYear(), d.getMonth(),d.getDate(), tTime[0] - 3, tTime[1], 0,0); // -3 specifies the time difference from UTC -> EST

        // tournamentDate.setMinutes(tournamentDate.getMinutes() + tournamentDate.getTimezoneOffset());

        console.log(tournamentDate)

        // console.log(tournamentDate, tournamentDate.toUTCString())

        let week = req.query.week ? req.query.week : 0;
        let response = await tournaments.insertOne({
            name: tournamentName,
            date: tournamentDate,
            players: [],
            week: week
        });

        if (response != null) {
            res.status(200).send(response.ops[0]);
        }
    } catch (e) {
        next(e);
    }
});



//Read
// Sanity Check: Determine if the api is successfully being reached.
router.get('/', async (req, res, next) => {
    try {
        res.status(200).send({'message': 'Hello Tournaments'})
    } catch (e) {
        next(e);
    }
});
router.get('/getByName', async (req, res, next) => {
    try {
        const tournamentName = req.query.tournamentName;

        const response = await tournaments.findOne({'name': tournamentName});

        if (response !== null && response !== undefined) {
            res.status(200).send(response);
        }
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});
router.get('/getResults', async (req, res, next) => {
    try {
        let response = await getTournamentResults(req.query.tournamentName);
        let result =[];
        for (let p of response) {
            console.log(p.player)
            let playerName = (await users.findOne({'_id': p.player})).Nickname

            if (!(playerName in result)) {
                result.push({'player': playerName, 'points': p.points, position: p.position})
            }
        }

        response.sort(function (a, b) {
            return a.points - b.points;
        });

        if (response !== null && response !== undefined) {
            res.status(200).send(result);
        }
        res.status(404).send();
    } catch (e) {
        next(e);
    }
});



//Update
router.put('/addPlayer', async (req, res, next) => {
    try {
        let tournamentName = req.query.tournamentName;
        let player = req.query.steamName;

        let tournament = await tournaments.findOne({'name': tournamentName});
        let user = await users.findOne({'Nickname': player});
        let players = tournament.players;

        for (player of players){
            if(user._id === player._id){
                next('Player is already added to the tournament');
                break;
            }

        }

        if (tournament == null) {
            next('Can not update tournament that does not exist');

        } else if (user == null) {
            next('Attempting to add a user that does not exist. Please Check name');
        } else if (players.length >= 10) {
            next('Tournament is full. Can not add another player')
        }
        else {
            players.push({'player': user._id, position: 0, points: 0});

            let result = await tournaments.findOneAndUpdate({'name': tournamentName}, {'$set': {players: players}}, {upsert: true});

            if (result != null) {

                res.status(200).send(await tournaments.findOne({'name': tournamentName}));
            }
            res.status(404).send();
        }
    } catch (e) {
        next(e);
    }


});

router.put('/updatePositions', async (req, res, next) => {
    const pointSpread = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    try {
        /*
        *
        *
        * */
        const data = req.body;
        const tournamentName = req.query.tournamentName;

        let tournamentPlayers = (await tournaments.findOne({'name': tournamentName})).players;

        for (let i = 0; i < tournamentPlayers.length; i++) {
            let player = (await users.findOne({'_id': tournamentPlayers[i].player}));
            // console.log(player)
            if (data[player.Nickname] !== undefined && data[player.Nickname] !== null) {
                tournamentPlayers[i].position = data[player.Nickname];
                tournamentPlayers[i].points = pointSpread[data[player.Nickname] - 1];
            }
        }

        let response = await tournaments.findOneAndUpdate({'name': tournamentName}, {'$set': {players: tournamentPlayers}}, {upsert: false});


        //todo if the tournament belongs to a series, check and add it to a user's series if not done already



        if (response != null) {
            res.status(200).send(await tournaments.findOne({'name': tournamentName}))
        }else{
            res.status(404).send();
        }
        // res.status(404).send();
    } catch (e) {
        next(e);
    }

});

router.put('/removePlayer', async (req, res, next) => {
    try {
        const steamName = req.query.steamName;
        const tournamentName = req.query.tournamentName;

        let tournamentPlayers = (await tournaments.findOne({'name': tournamentName})).players;
        for (let i = 0; i < tournamentPlayers.length; i++) {
            let playerName = (await users.findOne({'_id': tournamentPlayers[i].player})).Nickname;
            if (playerName === steamName) {
                tournamentPlayers.splice(i, 1);
                break;
            }
        }


        let result = await tournaments.findOneAndUpdate({'name': tournamentName}, {'$set': {players: tournamentPlayers}}, {upsert: false});

        if (result != null) {
            res.status(200).send(await tournaments.findOne({'name': tournamentName}));
        }
        res.status(404).send();
    } catch (e) {
        next(e);
    }
});



//Delete
router.delete('/deleteByName', async (req, res, next) => {
    try {
        let name = req.query.name;

        await tournaments.delete({'name': name});

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