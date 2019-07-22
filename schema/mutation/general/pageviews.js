import {GraphQLNonNull,GraphQLString} from 'graphql';
import pageViews from '../../types/statistic/pageviews'
import stat_pageviews from '../../../services/statistic/pageviews';

const mutation = {
    pageViews:{
        type:pageViews,
        args:{
            field:{type:new GraphQLNonNull(GraphQLString)},
            key:{type:new GraphQLNonNull(GraphQLString)}
        },
        resolve(parentValue,{key,field}){
            return stat_pageviews({key,field})
        }
    }
}
export default mutation;