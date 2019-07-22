import {Schema,model} from 'mongoose';
import validator from 'validator';
import {compare,genSalt,hash} from 'bcrypt';
const userSchema = new Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true,
        validate:{
            validator:val=>validator.isEmail(val),
            message: '{VALUE} is not a valid {PATH}'
        }
    },
    password:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    googleId:{
        type:String
    },
    isVerified:{
        type:Boolean
    },
    createdAt:{
        type:String
    },
    updatedAt:{
        type:String
    }
});

userSchema.method('comparePassword',function(candidatePass,callback){
    const _user = this
    compare(candidatePass,_user.password,(err,isMatch)=>{
        callback(err,isMatch)
    })
});


userSchema.pre('save',function(next){
    const _user = this;
    if(!_user.isModified){return next()}
    genSalt(10,(err,salt)=>{
        if(!err){
            hash(_user.password,salt,(err,hash)=>{
                if(!err){
                    _user.password = hash;
                    next();
                }else{return next('can\'t hash the password,try again')}
            })
        }else{return next('some thing went wrong')}
    })

});


const userModel = model('user',userSchema);
export default userModel