import passport                         from 'passport';
import {Strategy as GoogleStrategy }    from 'passport-google-oauth20'
import User                             from '../models/user';
import path                             from 'path'
import LocalStrategy                    from 'passport-local';
import moment                           from 'moment';
import redis                            from 'redis';
const redisClient = redis.createClient()
const Day =  moment().format('YYYY/MM/D');

require('dotenv').config({ path:path.resolve(process.cwd(),'config/keys/.env') })

passport.serializeUser((user,done)=>{ done(null,user.id) })
passport.deserializeUser((id,done)=>{ User.findById(id).then(user=>{ done(null,user) }) })

/////////////////// Google Authentication /////////////////////////
const googleOption = {
    clientID:       process.env.GOOGLE_CLIENT_ID,
    clientSecret:   process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:    process.env.GOOGLE_AUTH_SUCCESS_CALLBACK,
    proxy:          true
};
const GoogleAuth = new GoogleStrategy(googleOption,async (accessToken,refreshToken,profile,done)=>{
    const existingUserFromGoogle = await User.findOne({googleId:profile.id});
    const existingUserFromSignUp = await User.findOne({email:profile.emails[0].value});

    if(existingUserFromGoogle){ 
        redisClient.hset('lastLogIn',existingUserFromGoogle.id,moment().format())
        redisClient.sadd( `online:users:list:${Day}`,existingUserFromGoogle.id,(err,reply)=>{
            if(+reply === 1){ redisClient.hincrby( 'online:users:TList' , Day , 1 ) }
        })
        await User.findByIdAndUpdate(
            existingUserFromGoogle.id,
            {lastLogin:moment().format()},
            {new:true}
        )
        return done(null,existingUserFromGoogle) 
        
    }else if(existingUserFromSignUp){
        redisClient.hset('lastLogIn',existingUserFromSignUp.id,moment().format())
        redisClient.sadd( `online:users:list:${Day}`,existingUserFromSignUp.id,(err,reply)=>{
            if(+reply === 1){ redisClient.hincrby( 'online:users:TList' , Day , 1 ) }
        })
        await User.findByIdAndUpdate(
            existingUserFromSignUp.id,
            { lastLogin:moment().format(), $set:{googleId:profile.id} },
            {new:true}
        )
        return done(null,existingUserFromSignUp) 

    }else {
        
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
            redisClient.sadd( `online:users:list:${Day}`, user.id,(err,reply)=>{
                if(+reply === 1){ 
                    redisClient.hincrby( 'total:Verified:UserList', Day , 1 )
                    redisClient.hincrby( 'online:users:TList' , Day , 1 )
                    redisClient.hincrby( 'total:users:TList'  , Day , 1 )
                }
            })
            if(err){return done(err,null)}else{
            return done(null,user);
            }
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
