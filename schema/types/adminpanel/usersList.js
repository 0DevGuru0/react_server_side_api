import { GraphQLString, GraphQLObjectType, GraphQLInt, GraphQLList, GraphQLBoolean } from 'graphql';
import userType from '../userType';
const usersList = new GraphQLObjectType({
    name: "usersList",
    fields: {
        Users: { type: new GraphQLList(userType) },
        totalUsers:{ type: GraphQLInt },
        hasNextPage:{ type: GraphQLBoolean },
        hasPreviousPage:{ type: GraphQLBoolean },
        lastPage:{ type: GraphQLInt },
        show:{ type: GraphQLInt},
        filter:{ type: GraphQLString },
        search:{ type: GraphQLString },
        errorMessage:{ type: GraphQLString },
        currentPage:{ type: GraphQLInt }
    }
});

export default usersList;