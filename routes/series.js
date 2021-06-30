require('./tournaments')
// import {getTournamentResults} from "./tournaments";

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const tournaments = mongoose.connection.collection('tournaments');
const users = mongoose.connection.collection('users');
const series = mongoose.connection.collection('series');

/*
todo:
*                                              Add checks if a turney is already in a series
*                                              tournament - add week field (week 6)
* series - get current ranking of the series (need points field)
*                                              tournament - get ranking of a series
* tournament - add check to make sure no users recieved the same position

*                                               tournament - add points (when results are entered, check to see if the series is listed for a user. If not, add it. Also, update the series points)
*                                               tournament - on update see if series and/or user should be updated also (critical fields)
*                                               tournamnet - what if someone signed up for turney and didnt show? What if someone played who initially didnt sign up? Upsert?
*                                               tournament - check to make sure a user did not already register
*
* tournament  - user has paid?   (Does a user pay per tourney or per series???)
* user  - add tournamentWins field (update this when a turnament result is updated (ANY PUT should check this))
* user  - add seriesWins field (update this when a turnament result is updated (ANY PUT should check this))
*                                               user - circuits -> series
* user - circuits should contain ID to circuits they have been part of (add to user when when )
*                                               user -> populate users from saves
*                                               user -> only allow a single user with a name and/or ID
* user -> updateVIP status manually
*
* make sure res.send() is being used for all right cases, and error handler used where it is needed
* make sure try catch is being used
*
* if any dates are  split into 3 fields, update it to be a single field YYYY/MM/DD
*
*
* bot   - admin create series
* bot   - admin create tournament and add it to a series
* bot   - users sign up for tournament
* bot   - admin update results for a turney (auto update chat with turnament and series LB)
* bot   - users view leaderboards (num turny wins, num series wins)
* bot   - users get server time
* bot   - users get hosting schedule
* bot   - admin (should be able to do most of the API functionaly via chat commands)
* bot   - isVIP
* bot   - vipUntil
* bot   -isPaid (for tournament)
* bot   - Announcement
* bot   - Change GrandPappy Online Status
* bot   - report bug or issue
* bot   -
*
* bot   - meme commands (!7-2, !royal, !Dangus, etc.)
* bot   - easteregg?
*
*
* look into getting VIP information and saving duration in the DB and try to assign discord roles accordingly
* make sure we use references where we can.
*
*
* */

//Helpers
async function getTournaments(seriesName) {
    let s = await series.findOne({'series': seriesName});
    let result = []

    for (let tourney of s.tournaments) {
        result.push(await tournaments.findOne({'_id': (tourney.tournamentID)}));
    }
    // console.log(result)
    return result;
}


//Create
router.post('/create', async (req, res, next) => {
    try {
        const seriesName = req.query.seriesName;
        let sDate = req.query.startDate.split('/'); //todo Whhen not specified: TypeError: Cannot read property 'split' of undefined
        let eDate = req.query.endDate.split('/');

        console.log(eDate)
        let start = req.query.startDate !== null ? new Date(sDate[0], sDate[1] - 1, sDate[2]) : new Date('1970-01-01');
        let end = req.query.endDate !== null ? new Date(eDate[0], eDate[1] - 1, eDate[2]) : new Date('1970-01-01');

        const result = await series.insertOne({
            series: seriesName,
            startDate: start,
            endDate: end,
            tournaments: []
        });

        if (result != null) {
            res.status(200).send(result.ops[0]);
        }
    } catch (e) {
        next(e);
    }
});


//Read
// Sanity Check: Determine if the api is successfully being reached.
router.get('/', async (req, res, next) => {
    try {
        res.status(200).send({'message': 'Hello Series'})
    } catch (e) {
        next(e);
    }
});

router.get('/get', async (req, res, next) => {
    //todo
    try {
        return res.status(200).send(await series.findOne({'series': req.query.seriesName}));
    } catch (e) {
        next(e);
    }
});

router.get('/getAllTournaments', async (req, res, next) => {
    try {
        let result = await getTournaments(req.query.seriesName);
        if (result != null) {
            res.status(200).send(result);
        }
        next('Not able to retrieve tournaments of a series');
    } catch (e) {
        next(e);
    }
});

router.get('/getPlayers', async (req, res, next) => {
    //todo returns user multiple times if in multiple tournaments. Check logic
    try {
        let s = req.query.seriesName;
        let turneys = await getTournaments(s);
        let result = {};

        for (let t of turneys) {
            for (let player of t.players) {
                result[(await users.findOne({'_id': player.player})).Nickname] = player.player;
            }
        }

        res.status(200).send(result);
    } catch (e) {
        next(e);
    }
});

router.get('/getResults', async (req, res, next) => {
    try {
        let result = {};
        let turneys = await getTournaments(req.query.seriesName);

        for (let t of turneys) {
            for (let p of t.players) {

                let playerName = (await users.findOne({'_id': p.player})).Nickname
                // console.log(playerName)
                if (!(playerName in result)) {
                    result[playerName] = {'player': playerName, 'points': p.points};
                    // result[playerName] = p.points;
                } else {
                    // result[playerName] += p.points;
                    result[playerName].points += p.points;
                }
            }
        }

        let output = [];
        for (let i in result) {
            output.push(result[i]);
        }
        output.sort().reverse();


        // result.sort(function (a, b) {
        //     return b.points - a.points;
        // });
        if (output !== null) {
            res.status(200).send(output);
        } else {
            next('Not able to retrieve tournament results for series');
        }

    } catch (e) {
        next(e);
    }
});


//Update todo continue checking API from here
router.put('/addTournament', async (req, res, next) => {
    try {
        const seriesName = req.query.seriesName;
        const tournamentName = req.query.tournamentName;
        const tournament = await (tournaments.findOne({'name': tournamentName}));


        let s = await series.findOne({'series': seriesName});
        let tournamentList = s.tournaments;


        if (tournamentList == null) {
            tournamentList = [tournament];
        } else {
            for (let i = 0; i < tournamentList.length; i++) {
                if (tournamentList[i].name === tournamentName) {
                    next('Tournament is already in the series');
                    break;
                }
            }

            tournamentList.push({tournamentID: tournament._id});
        }

        await series.findOneAndUpdate({'series': seriesName}, {'$set': {tournaments: tournamentList}});

        let result = await series.findOne({'series': seriesName});
        if (result != null) {
            res.status(200).send(result);
        } else {
            next('Unable to remove tournament from series');
        }

    } catch (e) {
        next(e);
    }
});

router.put('/deleteTournament', async (req, res, next) => {
    try {
        const seriesName = req.query.seriesName;
        const tournamentName = req.query.tournamentName;

        let tournaments = (await series.findOne({'seriesName': seriesName})).tournaments;

        for (let i = 0; i < tournaments.length; i++) {
            if (tournaments[i].name === tournamentName) {
                tournaments.splice(i, 1);
                break;
            }
        }

        let result = await series.findOneAndUpdate({'seriesName': seriesName}, {}, {upsert: false});

        if (result != null) {
            res.status(200).send(result);
        } else {
            next('Unable to remove tournament from series');
        }

    } catch (e) {
        next(e);
    }

});


//Delete
router.delete('/delete', async (req, res, next) => {
    try {
        const seriesName = req.query.seriesName;

        const result = await series.findOneAndDelete({'seriesName': seriesName});

        if (result != null) {
            res.status(204).send(result);
        }

    } catch (e) {
        next(e);
    }
});

router.delete('/deleteAll', async (req, res, next) => {
    try {
        const confirmation = req.query.confirmation;

        if (confirmation === "ConfirmDeleteAll") {
            const result = await series.deleteMany({});

            if (result != null) {
                res.status(204).send(result);
            }
        } else {
            next('Confirm delete all')
        }
    } catch (e) {
        next(e);
    }
});


module.exports = router;