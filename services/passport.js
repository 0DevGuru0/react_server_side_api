import passport from 'passport';
import {Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/user';
import path from 'path'
import LocalStrategy from 'passport-local';
import moment from 'moment';
import redis from 'redis';
const redisClient = redis.createClient()

require('dotenv').config({
    path:path.resolve(process.cwd(),'config/keys/.env')
})

passport.serializeUser((user,done)=>{
    done(null,user.id)
})

passport.deserializeUser((id,done)=>{
    User.findById(id).then(user=>{ done(null,user) })
})

/////////////////// Google Authentication /////////////////////////
const googleOption = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_AUTH_SUCCESS_CALLBACK,
    proxy: true
};
const GoogleAuth = new GoogleStrategy(googleOption,async (accessToken,refreshToken,profile,done)=>{
    const existingUser = await User.findOne({googleId:profile.id});
    if(existingUser){ 
        redisClient.hset('lastLogIn',existingUser.id,moment().format())
        redisClient.sadd('online:users',existingUser.id)
        redisClient.sadd( `online:users:list:${moment().format('YYYY/MM/D')}` ,existingUser.id,(err,reply)=>{
            if(reply === 1){ redisClient.incrby('online:users:count',1) }
        })
        await User.findByIdAndUpdate(existingUser.id,{lastLogin:moment().format()})
        return done(null,existingUser) 
    }else{
        const newUser = new User({
            name:profile.displayName,
            email:profile.emails[0].value,
            password:profile.id,
            googleId:profile.id,
            createdAt:moment().format(),
            lastLogin:moment().format(),
            updatedAt:null,
            isVerified:true
        })
        newUser.save((err,user,row)=>{
            redisClient.sadd( `online:users:list:${moment().format('YYYY/MM/D')}`, user.id )
            redisClient.sadd('online:users',user.id)
            if(err){return done(err,null)}
            return done(null,user);
        })
    }
});
/////////////////// Local Authentication ///////////////////////////
const LocalOption = {usernameField:'email'}
const LocalAuth = new LocalStrategy(LocalOption,(email,password,done)=>{
    User.findOne({email:email.toLowerCase()},(err,user)=>{
        if(err){return done(err)}
        if(!user){return done(null,false)}
        user.comparePassword(password,async (err,isMatch)=>{
            if(err){return done(err)}
            if(isMatch){
                await User.findByIdAndUpdate(user.id,{lastLogin:moment().format()})
                redisClient.hset('lastLogIn',user.id,moment().format())
                // TODO:restrict user info 
                return done(null,user)
            }
            return done(null,false,'Invalid_Credential')
        })
    })
})

passport.use(LocalAuth)
passport.use(GoogleAuth)
