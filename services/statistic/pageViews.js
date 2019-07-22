import Redis from 'ioredis'
const redis = new Redis();

export default ({key,field})=>{
    redis.hsetnx(key,field,0)
    return redis.hincrby(key,field,1).then(result=>(
        {
            field:key,
            counted: result
        }
    ))
}