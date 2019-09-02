import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import UserType from './userType';
import UsersCount from './userCount';
import Auth from '../../services/helpers';
import usersList from '../../services/adminPanel/usersList'
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
        },
        usersCount:{
            type: UsersCount,
            resolve(parentValue, args , req) {
                return usersList.count(req)
            }
        }
    })

});
export default RootQueryType