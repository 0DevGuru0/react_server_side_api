import User          from '../../models/user';
import _             from 'lodash';
const Redis = require("ioredis");
const redis = new Redis({
     retryStrategy: function(times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    }
});


const usersList = {};

usersList.show = async ({ filter, show, search, page }) => {
    // check arguments
    show    = typeof (show)     === 'number' && [10, 20, 30, 50].findIndex(el => el === show) !== -1 ? show : false;
    filter  = typeof (filter)   === 'string' && ['Onlines', 'Recently Login', 'Recently Registered', 'Verified'].findIndex(el => el == filter) !== -1 ? filter : 'Recently Registered';
    search  = typeof (search)   === 'string' && search !== null && search !== "false" ? search : false;
    page    = typeof (page)     === 'number' && page > 1 ? page : 1;


    // pre defined variables
    let totalUsers;

    // codify filter option
    const sortBy = () => {
        switch (filter) {
            case 'Recently Login':
                return { lastLogin: -1 }

            case 'Recently Registered':
                return { createdAt: -1 }

            case 'Verified':
                return { isVerified: -1 }

            default: return {} 
        }
    }

    const DatabaseQuery = async () => {
        let search_content = {};
        let onlinesFilter = {};
        // Define [Search] rather name or Email
        if (search !== false) {
            let content = new RegExp(search, 'i')
            search_content = {
                '$or': [{ 'name': { '$regex': content } }, { 'email': { '$regex': content } } ]
            }
        }

        if (filter === 'Onlines') {
            const onlineUsersId = await redis.hkeys('online:Users')
            onlinesFilter = { _id: { $in: onlineUsersId } }
        }
        return { $and: [search_content, onlinesFilter] }
    }
    let mainQuery = await DatabaseQuery();
    //work on mongoDB
    return User.find(mainQuery)
        .countDocuments()
        .then(usersCount => {
            totalUsers = usersCount;
            // if total Users came to 0
            if (totalUsers === 0 && search !== false) { return Promise.reject('No user found with this credential!') }
            if (totalUsers === 0 ) { return Promise.reject('No User Found!') }

            if (page > Math.ceil(totalUsers / show)) { page = Math.ceil(totalUsers / show); }

            let skip = page !== 0 ? (page - 1) * show :  0 ;
            return User.find(mainQuery)
                .skip(skip)
                .sort(sortBy())
                .limit(show)
        })
        .then(async users => {
            if (!users) {
                return Promise.reject('no user has been registered yet')
            }

            let Users = users.map(({ _id, name, email, isVerified, createdAt, lastLogin }) =>
                //check for user online or offline by redis use users id(filterUsers)
                redis.hexists('online:Users', _id.toString()).then(res => {
                    let status = res === 1 ? true : false;
                    return { _id, name, email, isVerified, status, createdAt, lastLogin }
                })
            );
            Users = await Promise.all(Users)

            //Sort user arry by onlines
            if (filter === 'Onlines') {
                Users = _.orderBy(Users, ['status'], ['desc'])
            }

            let hasNextPage = show * page < totalUsers
            let hasPreviousPage = page > 1;
            let lastPage = Math.ceil(totalUsers / show)
            return {
                Users,
                totalUsers,
                hasNextPage,
                hasPreviousPage,
                lastPage,
                show,
                filter,
                search,
                currentPage: page,
                errorMessage: null
            };
        }).catch(e => {
            return {
                Users: [],
                totalUsers: 0,
                hasNextPage: false,
                hasPreviousPage: false,
                lastPage: 0,
                show: 10,
                filter: null,
                search: null,
                currentPage: 0,
                errorMessage: e
            };
        })
}

usersList.count =(req)=>{
    // if(req.user){
        return User.find()
        .countDocuments()
        .then(usersCount => { 
            return {count:usersCount} })
        .catch(e=>{ return Promise.reject(e) })
    // }else{
    //     return Promise.reject('you are not authorized yet!')
    // }
}
usersList.verifiedCount =(req)=>{
    // if(req.user){
        return User.find({'isVerified':true})
        .countDocuments()
        .then(usersCount => { 
            return {count:usersCount} })
        .catch(e=>{ return Promise.reject(e) })
    // }else{
    //     return Promise.reject('you are not authorized yet!')
    // }
}

export default usersList;

/* Return schema
*   return {
        Users:[{
            id:"324324sdcxz",
            name:"sajjad",
            email:"af.hadafi@gmail.com",
            isVerified:true,
            createdAt:new Date(),
            lastLogin:new Date()
        }],
        totalUsers: 100,
        hasNextPage: true,
        hasPreviousPage: true,
        lastPage: 10,
        show: 10,
        filter: 'Last Login',
        search: null,
        currentPage: 10
    }
*/