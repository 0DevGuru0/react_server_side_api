import User from '../../models/user';

const usersList = {};
usersList.show=({filter,show,search,page})=>{
    // check arguments
    show   = typeof(show)   === Number && [10,20,30,50].findIndex(show) !== -1 ? show: false;
    filter = typeof(filter) === String && ['Onlines','Recently Login','Recently Registered'].findIndex(filter) !== -1 ? filterArg : false;
    search = typeof(search) === String && search !== null ? search : false ;
    page   = typeof(page)   === Number && page > 1 ? page : 1 ; 

    // pre defined variables
    let totalUsers;
    let findBy=()=>{
        if(search == false){
            if(filter == false){ return '' } 
            return filter
        }else{ return search }
    }

    //work on mongoDB
    return User.find(findBy())
    .countDocuments()
    .then(usersCount=>{
        totalUsers = usersCount;
        if(page>Math.ceil(totalUsers/show)){
            page = Math.ceil(totalUsers/show);
        }
        return User.find()
            .skip( ( page-1 ) * show )
            .limit(show)
    })
    .then((users)=>{
        if(!users){return 'no user has been registered yet'}
        let Users = users.map( ( {_id,name,email,isVerified} )=>{ return {_id,name,email,isVerified} })
        let hasNextPage     = show * page < totalUsers
        let hasPreviousPage = page > 1;
        let lastPage        = Math.ceil(totalUsers/show)

        const result = Object.assign(
            Users,
            {
                totalUsers,
                hasNextPage,
                hasPreviousPage,
                lastPage,
                show,
                filter,
                search,
                currentPage:page
            }
        )
        res.send(result);
    }).catch(e=>{ next( new Error(e) ) })
}

export default usersList;