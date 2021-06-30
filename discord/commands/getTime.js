// require('discord-reply');
let { DateTime } = require('luxon');
let dt = DateTime.now().setZone('America/New_York');

module.exports = {
    name: 'gettime',
    description: 'Get the current Bots time!',
    execute(client, message, args) {
        message.lineReply(`The current time is ${dt.toLocaleString(Object.assign(DateTime.DATETIME_FULL, { weekday: 'long' }))}`);

    },
};