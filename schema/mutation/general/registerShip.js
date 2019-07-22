import {
    GraphQLNonNull,
    GraphQLString
} from 'graphql';

import UserType from '../../types/userType';
import Auth from '../../../services/helpers';
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
            console.log(password, email)
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
        resolve(parentValue, {
            email,
            password,
            name
        }, req) {
            return Auth.SignUp({
                email,
                password,
                name,
                req
            })
        }
    },
    SignOut: {
        type: UserType,
        resolve(parentValue, args, req) {
            let user = req.user
            req.logout()
            return user;
        }
    },
    sendEmailVerify: {
        type: UserType,
        args: {
            email: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve(parentValue, {
            email
        }, req) {
            return Auth.sendEmailVerify({
                email,
                req
            })
        }
    },
    sendResetPassEmail: {
        type: UserType,
        args: {
            email: {
                type: new GraphQLNonNull(GraphQLString)
            }
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