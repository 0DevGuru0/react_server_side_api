import Redis from 'ioredis'
const redis = new Redis({
        retryStrategy: function(times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    }
});

export default ({key,field})=>{
    redis.hsetnx(key,field,0)
    return redis.hincrby(key,field,1).then(result=>(
        {
            field:key,
            counted: result
        }
    ))
}