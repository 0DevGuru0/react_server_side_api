import {GraphQLString, GraphQLNonNull,GraphQLInt} from 'graphql';
import usersList from '../../types/adminpanel/usersList';
import users from '../../../services/adminpanel/usersList';

const mutation = {
    usersList:{
        type:usersList,
        args:{
            filter: {
                type: GraphQLString
            },
            show: {
                type: new GraphQLNonNull(GraphQLInt)
            },
            search: {
                type: GraphQLString
            },
            page: {
                type: GraphQLInt
            }
        },
        resolve(parentValue,{filter,show,search,page}){
            return users.show({filter,show,search,page})
        }
    }
}
export default mutation;