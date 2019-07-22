import {
    GraphQLString,
    GraphQLID,
    GraphQLObjectType,
    GraphQLBoolean
} from 'graphql';

const userType = new GraphQLObjectType({
    name:"UserType",
    fields:{
        id:{type:GraphQLID},
        name:{ type:GraphQLString} ,
        email:{type:GraphQLString} ,
        isVerified:{type:GraphQLBoolean}
    }
});

export default userType;