import validator             from 'validator';
import passport              from 'passport';
import User                  from '../models/user';
import sgMail                from '@sendgrid/mail';
import Verify_Email_Config   from '../emails/emailVerify';
import Reset_Password_Config from '../emails/resetPassword';
import jwt                   from 'jsonwebtoken';
import moment                from 'moment';
import redis                 from 'redis';
import parser                from 'ua-parser-js';
const redisClient = redis.createClient()
const Day =  moment().format('YYYY/MM/D');

/* Auth Object contain all logic for authentication */
const Auth = {}

Auth.SignUp = ({email,password,name,req})=>{

    let errors=[];
    if (validator.isEmpty(email) || validator.isEmpty(password)) {
        errors.push('type all credentials')
    }

    if (!validator.isEmail(email)) {
        errors.push('type valid Email')
    }

    if (!validator.isLength(password, { min: 6, max: 24 })) {
        errors.push('password should be in 6 to 24 char range')
    }
    if(req.user){ errors.push(`you already logged in site[${req.user.email}]`) }
    if( errors.length > 0 ){
        throw new Error(errors)
    }
    return User.findOne({email})
        .then(user=>{
            if(user){throw new Error('Email is in use')}
            return new User({
                email, password, name,
                createdAt:moment().format(),
                lastLogin:moment().format(),
                updatedAt:null,
                isVerified: false
            }).save()
        })
        .then(user=>{
            return new Promise((res,rej)=>{
                req.login(user,err=>{
                    if(err){ rej(err)}
                    redisClient.sadd( `online:users:list:${moment().format('YYYY/MM/D')}`, user.id,(err,reply)=>{
                        if(+reply === 1){ 
                            redis.hincrby( 'online:users:TList' , Day , 1 )
                            redisClient.hsetnx('online:Users',user.id,0,(err,reply)=>{
                                if(+reply===1){ 
                                    redisClient.incrby('online:users:count',1) }
                            })
                        }
                    })
                    // TODO:restrict user info 
                    return res(user)
                });
            })
        }).catch(e=>{
            throw new Error(e)
        })
}

Auth.SignIn = ({email,password,req})=>{
    let errors=[];
    
    if(validator.isEmpty(email) || validator.isEmpty(password)){ errors.push('type all credentials') }
    if(!validator.isEmail(email)){ errors.push('type valid Email') }
    if(req.user){ errors.push(`you already logged in site[${req.user.email}]`) }
    if( errors.length > 0 ){ throw new Error(errors) } 
    if(!req.user){
        return new Promise((res,rej)=>{
            passport.authenticate('local', (err,user)=>{
                if(!user){return rej('you are not registered yet please signUp first')}
                if(err){return rej(err)}
                req.login(user,err=>{

                    redisClient.sadd( `online:users:list:${moment().format('YYYY/MM/D')}`, user.id, (err,reply)=>{    
                        /*
                            check to see userID exist in online:Users bucket [signIn in another browser]
                                -YES| check to see the userID have that browser on
                                    - YES| increment browser connection 
                                    _ NO|check to see the userId found or not if not reply must turn to object
                                        + if reply length is zero increment online counts 
                                        + get the reply one connection of  browser
                                At the end resave the reply in online:user userID bucket
                        */
                        if(+reply === 1){ redis.hincrby( 'online:users:TList' , Day , 1 ) }

                        redisClient.hget('online:Users' , user.id,(err,reply)=>{
                            let {browser,os} = parser(req.headers['user-agent'])
                            let browserContainer = browser.name+browser.major+":"+os.name+os.version
                            reply = JSON.parse(reply)
                            if( reply && reply[browserContainer] ){
                                reply[browserContainer]= ++reply[browserContainer]
                            }else{
                                if(!reply){ reply = {}; }
                                if(Object.keys(reply).length === 0 ){ redisClient.incr('online:users:count') }
                                reply[browserContainer] = 1
                            }
                            redisClient.hset( 'online:Users' , user.id , JSON.stringify(reply) )
                        })
                    })

                    if(err){return rej(err)}
                    // TODO:restrict user info 
                    return res(user)
                })
            })({body:{email,password}})
        })
    }
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