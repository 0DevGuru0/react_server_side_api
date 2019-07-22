import {
    GraphQLString,
    GraphQLObjectType,
    GraphQLInt
} from 'graphql';

const pageView = new GraphQLObjectType({
    name:"PageView",
    fields:{
        field:{type:GraphQLString},
        counted:{type:GraphQLInt}
    }
});

export default pageView;