let { DateTime } = require('luxon');
let dt = DateTime.now().setZone('America/New_York');

module.exports = {
    name: 'hello',
    description: 'Get the current Bots time!',
    execute(client, message, args) {
        message.lineReply('Hello');
        message.lineReplyNoMention(`Hello ${message.author}. My name is ${client.user.username}!`);
    },
};

// module.exports = client;