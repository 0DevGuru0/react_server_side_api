import { GraphQLObjectType, GraphQLInt } from 'graphql';

const UsersCount = new GraphQLObjectType({
    name:"UsersCount",
    fields:{
        count:{type:GraphQLInt}
    }
});

export default UsersCount;