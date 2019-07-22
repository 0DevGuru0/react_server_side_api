const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IPs = new Schema({
    IP: {
        type: String
    },
    visitedDay: {
        type: String
    },
    IPsInfo: {
        type: Schema.Types.ObjectId,
        ref: 'visitorsInfo'
    }
})

module.exports = mongoose.model('visitorsIP', IPs)