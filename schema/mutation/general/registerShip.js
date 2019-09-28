import {
    GraphQLNonNull,
    GraphQLString
} from 'graphql';

import UserType from '../../types/userType';
import Auth from '../../../services/helpers';
import redis from 'redis';
import moment from 'moment';
const redisClient = redis.createClient({
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') { return new Error('The server refused the connection'); }
        if (options.total_retry_time > 1000 * 60 * 60) { return new Error('Retry time exhausted'); }
        if (options.attempt > 10) { return undefined; }
        return Math.min(options.attempt * 100, 3000);
    }
})

const mutation = {
    SignIn: {
        type: UserType,
        args: {
            email: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve(parentValue, { password, email }, req) {
            
            return Auth.SignIn({ email, password, req })
        }
    },
    SignUp: {
        type: UserType,
        args: {
            name: {
                type: new GraphQLNonNull(GraphQLString)
            },
            email: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve(parentValue, { email, password, name }, req) {
            return Auth.SignUp({ email, password, name, req })
        }
    },
    SignOut: {
        type: UserType,
        resolve(parentValue, args, req) {
            let user = req.user
            if(!user){ throw new Error('you have been not signedIn yet!') }
            redisClient.hdel('online:Users',user._id.toString(),(err,reply)=>{
                if(+reply===1){ redisClient.incrby('online:users:count',-1) }
            })
            req.logout()
            return user;
        }
    },
    sendEmailVerify: {
        type: UserType,
        args: { 
            email: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(parentValue, { email }, req) {
            // console.log(Auth.sendEmailVerify({ email, req }))
            return Auth.sendEmailVerify({ email, req })
        }
    },
    sendResetPassEmail: {
        type: UserType,
        args: { 
            email: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(parentValue, {
            email
        }, req) {
            return Auth.sendResetPassEmail({
                email,
                req
            })
        }
    },
    updateUserPassword: {
        type: UserType,
        args: {
            email: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve(parentValue, {
            email,
            password
        }, req) {
            return Auth.updateUserPassword({
                email,
                password,
                req
            })
        }
    }
}
export default mutation;