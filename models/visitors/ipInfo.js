const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ipInfo = new Schema({
    continent_name: {
        type: String
    },
    country_name: {
        type: String
    },
    state_prov: {
        type: String
    },
    district: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    calling_code: {
        type: String
    },
    languages: {
        type: String
    },
    organization: {
        type: String
    },
    currency: {
        type: String
    }
});

module.exports = mongoose.model('visitorsInfo', ipInfo)