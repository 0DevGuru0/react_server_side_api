import mongoose from 'mongoose';
import redis from 'redis';
import util from 'util';

const client = redis.createClient();
const exec = mongoose.Query.prototype.exec;
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = (options = {}) => {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    return this;
}

mongoose.Query.prototype.exec = async () => {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }
    const key = JSON.stringify(
        Object.assign({}, this.getQuery(), {
            collection: this.mongooseCollection.name
        })
    )
    const cacheValue = await client.hget(this.hashKey, key);

    if (cacheValue) {
        const doc = JSON.parse(cacheValue);
        console.log(doc)
        return Array.isArray(doc) ?
            doc.map(d => new this.model(d)) :
            new this.model(doc)
    }

    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
    return result;
}

export default {
    clearHash(hashKey) {
        client.hdel(JSON.stringify(hashKey))
    }
}