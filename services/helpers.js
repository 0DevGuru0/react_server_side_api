import validator             from 'validator';
import passport              from 'passport';
import User                  from '../models/user';
import sgMail                from '@sendgrid/mail';
import Verify_Email_Config   from '../emails/emailVerify';
import Reset_Password_Config from '../emails/resetPassword';
import jwt                   from 'jsonwebtoken';
import moment from 'moment';
import redis from 'redis';
const redisClient = redis.createClient()
/*
 * Auth Object contain all logic for authentication
*/
const Auth = {}

Auth.SignUp = ({email,password,name,req})=>{

    let errors=[];
    if (validator.isEmpty(email) || validator.isEmpty(password)) {
        errors.push('type all credentials')
    }

    if (!validator.isEmail(email)) {
        errors.push('type valid Email')
    }

    if (!validator.isLength(password, {
            min: 6,
            max: 24
        })) {
        errors.push('password should be in 6 to 24 char range')
    }

    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return User.findOne({email})
        .then(user=>{
            if(user){throw new Error('Email is in use')}
            return new User({
                email,
                password,
                name,
                createdAt:moment().format(),
                updatedAt:null,
                isVerified: false
            }).save()
        })
        .then(user=>{
            return new Promise((res,rej)=>{
                req.login(user,err=>{
                    if(err){ rej(err)}
                    redisClient.hset('lastLogIn',user.id,moment().format())
                    return res(user)
                });
            })
        }).catch(e=>{
            throw new Error(e)
        })
}

Auth.SignIn = ({email,password,req})=>{
    let errors=[];
    if(validator.isEmpty(email) || validator.isEmpty(password)){
       errors.push('type all credentials')
    }
    if(!validator.isEmail(email)){
        errors.push('type valid Email')
    }
    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return new Promise((res,rej)=>{
        passport.authenticate('local',(err,user)=>{
            if(!user){return rej('you are not registered yet please signUp first')}
            if(err){return rej(err)}
            req.login(user,err=>{
                if(err){return rej(err)}
                return res(user)
            })
        })({body:{email,password}})
    })
}

Auth.sendEmailVerify = ({email,req})=>{
    let errors = []
    if( validator.isEmpty(email) ){
        errors.push('email should be insert')
    }
    if(!validator.isEmail(email)){
        errors.push('type valid Email')
    }
    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return User.findOne({email}).then(user=>{
        if ( validator.isEmpty(user) ) {
            throw new Error('user with this email doesn\'t exist')
        }

        sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

        return new Promise((res, rej) => {
            sgMail.send(Verify_Email_Config(user), true, (err, result) => {
                if (err) {
                    return rej(err)
                }
                return res({email})
            });
        })
    }).catch(e=>{
        throw new Error(e)
    })
}

Auth.sendResetPassEmail= ({email,req})=>{
    let errors = []
    if( validator.isEmpty(email) ){
        errors.push('email should be insert')
    }
    if(!validator.isEmail(email)){
        errors.push('type valid Email')
    }
    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return User.findOne({email}).then(user=>{

        if ( validator.isEmpty(user) ) {
            throw new Error('user with this email doesn\'t exist')
        }

        sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

        return new Promise((res, rej) => {
            sgMail.send(Reset_Password_Config(user), true, (err, result) => {
                if (err) {
                    return rej(err.message)
                }
                return res({ email })
            });
        })
    }).catch(e=>{
        throw new Error(e)
    })
}

Auth.identifyUserByToken =({token,req})=>{
    if ( validator.isEmpty(token) ) {
        throw new Error('token has not been received.')
    }
    token = validator.trim(token)
    return new Promise((res, rej) => {
        return jwt.verify(token,'afsan|user|resetPassword|007', { subject: "resetPassword" },(err, decoded)=>{
            if(err){
                if(err.name === 'TokenExpiredError'){
                    return rej('request expired please try again')
                }else{
                    return rej(err)
                }
            }
            res({email:decoded.email})
        })
    })
}

Auth.updateUserPassword=({email,password,req})=>{
    let errors=[];
    if (validator.isEmpty(email) || validator.isEmpty(password)) {
        errors.push('type all credentials')
    }

    if (!validator.isEmail(email)) {
        errors.push('type valid Email')
    }

    if (!validator.isLength(password, {
            min: 6,
            max: 24
        })) {
        errors.push('password should be in 6 to 24 char range')
    }
    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return User.findOne({email}).then((user,err)=>{
        if(err)     {throw new Error('something went wrong,try again')}
        if(!user)   {throw new Error('User not found')}

        user.password = password;
        return user.save();
    }).then(user=>{
        Promise.resolve({email})
    }).catch(e=>{
        throw new Error(e)
    })
}

export default Auth;