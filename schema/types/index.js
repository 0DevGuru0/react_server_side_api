import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import UserType from './userType';
import Auth from '../../services/helpers';

const RootQueryType = new GraphQLObjectType({
    name: "RootQueryType",
    fields: () => ({
        user: {
            type: UserType,
            resolve(parentValue, args, req) {
                return req.user
            }
        },
        identifyUserByToken: {
            type: UserType,
            args: {
                token: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve(parentValue, { token }, req) {
                return Auth.identifyUserByToken({ token, req })
            }
        }
    })
});

export default RootQueryType