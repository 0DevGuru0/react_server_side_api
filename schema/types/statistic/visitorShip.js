import {
    GraphQLString,
    GraphQLID,
    GraphQLObjectType,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLFloat
} from 'graphql';

const visitorShip = new GraphQLObjectType({
    name:"visitorShip",
    fields:{
        city: {type:GraphQLString},
        country: {type:GraphQLString},
        countryCode: {type:GraphQLString},
        lat: {type:GraphQLFloat},
        lon:  {type:GraphQLFloat},
        query: {type:GraphQLString},
        region: {type:GraphQLString},
        regionName: {type:GraphQLString},
        status: {type:GraphQLString},
        timezone: {type:GraphQLString},
        zip: {type:GraphQLString},
    }
});

export default visitorShip;