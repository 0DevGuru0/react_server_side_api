import { GraphQLObjectType} from 'graphql';

import usersList from './adminpanel/usersList';
import pageView from './general/pageViews';
import registerShip from './general/registerShip';


const mutation = new GraphQLObjectType({
    name:"MutationObserver",
    fields:()=>(Object.assign(usersList,pageView,registerShip))
});

export default mutation;
