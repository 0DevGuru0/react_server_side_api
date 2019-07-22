import {
    GraphQLString,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLInt
} from 'graphql';

const usersList = new GraphQLObjectType({
    name: "usersList",
    fields: {
        filter: {
            type: GraphQLString
        },
        show: {
            type: new GraphQLNonNull(GraphQLInt)
        },
        search: {
            type: GraphQLString
        }
    }
});

export default usersList;