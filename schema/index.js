import RootQueryType from './types';
import mutation from './mutation';

import {GraphQLSchema} from 'graphql';

const Schema = new GraphQLSchema({
    query:RootQueryType,
    mutation
})
export default Schema;