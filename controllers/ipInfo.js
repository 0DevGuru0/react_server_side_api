import redisPre from "redis";
import moment from "moment";
import chalk from "chalk";
import path from "path";
import asyncRedis from "async-redis";
require("dotenv").config({
	path: path.resolve(process.cwd(), "config/keys/.env")
});

const redisClient = redisPre.createClient({
	retry_strategy: () => 1000
});
redisClient.on("error", err =>
	console.log(
		chalk.bgRedBright.bold("ERROR:") +
			chalk.bold("connecting to redis encountered with issue.\n")
	)
);
const redis = asyncRedis.decorate(redisClient);
const GeolocationParams = require("ip-geolocation-api-javascript-sdk/GeolocationParams");
const IPGeolocationAPI = require("ip-geolocation-api-javascript-sdk/IPGeolocationAPI");
const ipgeolocationApi = new IPGeolocationAPI(
	process.env.GEOLOCATION_IP_ADDRESS
);

const ipInfo = {};

let fullDate = moment().format("YYYY/MM/D");
let Month = moment().format("M");
let Year = moment().format("YYYY");
let Day = moment().format("D");
ipInfo.storeSystem = async (cb, ip) => {
	let geolocationParams = new GeolocationParams();
	let targetData = [
		"continent_name",
		"country_name",
		"country_code2",
		"state_prov",
		"district",
		"latitude",
		"longitude",
		"calling_code",
		"languages",
		"organization",
		"currency"
	];

	geolocationParams.setFields(targetData.join(","));
	ipgeolocationApi.getGeolocation(async ipData => {
		if (ipData.message) {
			return cb(
				ErrorModel({
					message: "something went wrong on fetching IP information from protocol",
					sourceCode: "fetchInfoFromProtocol",
					errorDetail: ipData.message
				})
			);
		}
		delete ipData.ip;
		let country = ipData.country_code2;
		let city = ipData.state_prov;
		ipData = JSON.stringify({
			...ipData,
			currency: ipData.currency["code"]
		});
		let reply = null;
		try {
			reply = JSON.parse(await redis.hget(`online:visitors:TList`, fullDate));
		} catch (err) {}
		if (reply[ip] === 1) {
			redisClient
				.multi()
				.hincrby(`visitors:state:country:month:${Year}:${Month}`, country, 1)
				.hincrby(`visitors:state:country:year:${Year}`, country, 1)
				.exec();
			let cityMonth = redisClient.hget(
				`visitors:state:city:month:${Year}:${Month}`,
				country
			);
			if (typeof cityMonth === "string") {
				cityMonth = JSON.parse(cityMonth);
			}
			if (!cityMonth) {
				cityMonth = {};
			}
			cityMonth[city] = cityMonth[city] ? cityMonth[city] + 1 : 1;
			redisClient.hset(
				`visitors:state:city:month:${Year}:${Month}`,
				country,
				JSON.stringify(cityMonth)
			);
			redisClient.hset(
				`visitors:state:city:year:${Year}`,
				country,
				JSON.stringify(cityMonth)
			);
			let stateDay = redisClient.hget(`visitors:state:Day:${Year}:${Month}`, Day);
			if (typeof stateDay === "string") {
				stateDay = JSON.parse(stateDay);
			}
			if (!stateDay) {
				stateDay = {};
			}
			city = `${country}:${city}`;
			stateDay[city] = stateDay[city] ? stateDay[city] + 1 : 1;
			redisClient.hset(`visitors:state`, fullDate, JSON.stringify(stateDay));
		}
	}, geolocationParams);
};

function ErrorModel({ message, sourceCode, errorDetail }) {
	return (
		chalk.white.bgRed.bold("\nERROR||") +
		`${message}\n` +
		`sourceCode:` +
		chalk.redBright.bold(`[ipInfoSystem_${sourceCode})]\n`) +
		`[detail]:` +
		chalk.redBright.bold(`${JSON.stringify(errorDetail)}`) +
		"\n"
	);
}

export default ipInfo;
