import redis from 'redis';
import moment from 'moment';
import chalk from 'chalk';
import IP_DB from '../models/visitors/ips';
import IPINFO_DB from '../models/visitors/ipInfo';
import path from 'path';
require('dotenv').config({
  path: path.resolve(process.cwd(), 'config/keys/.env')
});

const redisClient = redis.createClient({
  retry_strategy: () => 1000
});
redisClient.on('error', err => {
  console.log(
    chalk.bgRedBright.bold('ERROR:') +
      chalk.bold('connecting to redis encountered with issue.\n')
  );
});

const GeolocationParams = require('ip-geolocation-api-javascript-sdk/GeolocationParams.js');
const IPGeolocationAPI = require('ip-geolocation-api-javascript-sdk/IPGeolocationAPI');
const ipgeolocationApi = new IPGeolocationAPI( process.env.GEOLOCATION_IP_ADDRESS );

const ipInfo = {};

let Day = moment().format('YYYY/MM/D');

ipInfo.storeSystem = async (cb, ip) => {
  //2| calculate remaining time to store IPs from redis memory to mongodb
  var now = new Date();
  var storeTime =
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0, 0) -
    now;
  if (storeTime < 0) {
    storeTime += 86400000;
  }
  setInterval(() => {
    let lastDay = moment()
      .subtract(1, 'day')
      .format('YYYY/MM/D');
    redisClient.hgetall(`online:visitors:list:${lastDay}`, (error, result) => {
      if (error) {
        return cb(
          ErrorModel({
            message: 'Something went wrong on redis',
            sourceCode: 'FetchVisitorDataFromRedis',
            errorDetail: error
          })
        );
      }
      if (result == null) {
        return cb(
          ErrorModel({
            message: 'receiving null as result for redis query ',
            sourceCode: 'FetchVisitorDataFromRedis',
            errorDetail: '{queryResult:null}'
          })
        );
      }

      //3|Store Fetched Data on Mongodb
      let errors = [];
      for (let key in result) {
        let visitorIP_info = new IPINFO_DB(JSON.parse(result[key]));
        let visitorIP = new IP_DB({
          IP: key,
          visitedDay: lastDay
        });
        visitorIP.IPsInfo = visitorIP_info;
        Promise.all([visitorIP.save(), visitorIP_info.save()]).catch(err => {
          if (err) {
            errors.push(err);
          }
        });
      }
      if (errors.length === 0) {
        redisClient.del(`online:visitors:list:${lastDay}`);
      } else {
        return cb(
          ErrorModel({
            message:
              'something went wrong on storing fetched data from redis on mongoDB',
            sourceCode: 'StoreFetchedDataOnDB',
            errorDetail: errors
          })
        );
      }
    });
  }, storeTime + 20000);

  //  4|Fetch information and store in Redis
  redisClient.hget(`online:visitors:list:${Day}`, ip, (error, result) => {
    if (error) {
      return cb(
        ErrorModel({
          message: 'Something went wrong on redis',
          sourceCode: 'FetchVisitorDataFromRedis',
          errorDetail: error
        })
      );
    }
    if (result !== null) {
      return cb(null);
    }
    let geolocationParams = new GeolocationParams();
    let targetData = [
      'continent_name',
      'country_name',
      'state_prov',
      'district',
      'latitude',
      'longitude',
      'calling_code',
      'languages',
      'organization',
      'currency'
    ];
    geolocationParams.setFields(targetData.join(','));
    ipgeolocationApi.getGeolocation(ipData => {
      if (ipData.message) {
        return cb(
          ErrorModel({
            message:
              'something went wrong on fetching IP information from protocol',
            sourceCode: 'fetchInfoFromProtocol',
            errorDetail: ipData.message
          })
        );
      }
      delete ipData.ip;
      ipData = {
        ...ipData,
        currency: ipData.currency['code']
      };
      ipData = JSON.stringify(ipData);
      redisClient.hset(`online:visitors:list:${Day}`, ip, ipData,(err,reply)=>{
        if(+reply === 1){
          redisClient.sadd(`online:visitors:Clist:${Day}`,ip)
        }
      });
    }, geolocationParams);
  });
};

function ErrorModel({ message, sourceCode, errorDetail }) {
  return (
    chalk.white.bgRed.bold('\nERROR||') +
    `${message}\n` +
    `sourceCode:` +
    chalk.redBright.bold(`[ipInfoSystem_${sourceCode})]\n`) +
    `[detail]:` +
    chalk.redBright.bold(`${JSON.stringify(errorDetail)}`) +
    '\n'
  );
}

export default ipInfo;
