const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const saveSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    objects: []
}, {timestamps: true});

const User = mongoose.model('Save', saveSchema);
module.exports = User;