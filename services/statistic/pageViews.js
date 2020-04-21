import Redis from "ioredis";
// import moment from 'moment'
const redis = new Redis({
	retryStrategy: function(times) {
		var delay = Math.min(times * 50, 2000);
		return delay;
	}
});

export default ({ key, field }) => {
	// * better Performance
	return redis
		.sadd("pageViews:List:keys", key)
		.then(reply =>
			redis
				.hincrby(key, field, 1)
				.then(result => ({ field: key, counted: result }))
		);

	//* lower performance
	// console.time('start')
	// redis.hget('pageViews',moment().format('YYYY/MM/D'),(err,reply)=>{
	//     if(!reply) reply = {}
	//     if(typeof reply === "string") reply = JSON.parse(reply)
	//     reply[field] = reply[field] ? reply[field] + 1 : 0
	//     reply = JSON.stringify(reply)
	//     redis.hset('pageViews',moment().format('YYYY/MM/D'),reply,(err,ress)=>{
	//         console.timeEnd('start')
	//     })
	// })

	// start: 2.170ms
	// start: 5.022ms
	// start: 3.977ms
	// start: 2.943ms
	// start: 5.189ms
	// start: 6.004ms
};
