import jwt from 'jsonwebtoken';
import User from '../models/user';
import PDFDocument from 'pdfkit'

const RootController = {}
const PAGE_LIMIT_COUNT = 10;
const admins = [
    { id: 1, name: 'Kurtis Weissnat' },
    { id: 2, name: 'Nicholas Runolfsdottir' },
    { id: 3, name: 'Gelann Reichert' },
    { id: 4, name: 'Moriah Stanton' },
    { id: 5, name: 'Rey Padberg' }
  ];

RootController.rootPage = (req, res) => {
    let adminContent = `
        <div>
        You don't appear to be logged in.  You can log in by visiting
        <a href="/auth/google">the Authentication Route</a>. You could
        also look at details about yourself at <a href="/api/current_user">the Current User route</a>
        </div>
    `;
    if (req.user) {
        adminContent = `
        <div>
            You appear to be logged in, so you can visit <a href="/admins">the Admins route</a>
            or you can
            <form action="/logout" method="post">
                <input type="hidden" name="_csrf" value="${req.csrfToken()}"></input>
                <button type="submit">Logout</button>
            </form>
        </div>
        `;
    }
    res.send(`
        <div>
        <h4>Hi!  Welcome to the React SSR API</h4>
        <div>
        <form action="/userslistpdf" method="get">
        <button>usersListPdf</button>
        </form>
            You can see <a href="/users">the Users route</a>
        </div>
        ${adminContent}
        </div>
    `);
}
RootController.usersList = (req, res,next) => {
    let page = +req.query.page
    let totalUsers;
    if(page<1){ page = 1 }
    User.find()
    .countDocuments()
    .then(usersCount=>{
        totalUsers = usersCount;
        if(page>Math.ceil(totalUsers/PAGE_LIMIT_COUNT)){
            page = Math.ceil(totalUsers/PAGE_LIMIT_COUNT);
        }
        return User.find()
            .skip( ( page-1 ) * PAGE_LIMIT_COUNT )
            .limit(PAGE_LIMIT_COUNT)
    })
    .then((users)=>{
        if(!users){return 'no user has been registered yet'}
        let Users = users.map( ( {_id,name,email,isVerified} )=>{ return {_id,name,email,isVerified} })
        let hasNextPage     = PAGE_LIMIT_COUNT * page < totalUsers
        let hasPreviousPage = page > 1;
        let lastPage        = Math.ceil(totalUsers/PAGE_LIMIT_COUNT)
        res.send({
            Users,
            totalUsers,
            hasNextPage,
            hasPreviousPage,
            currentPage:page,
            lastPage
        });
    }).catch(e=>{ next( new Error(e) ) })
}
RootController.logIn = (req, res) => {
    res.send(`
    <html>
      <body>
        <a href="auth/google">Login via Google</a>
      </body>
    </html>`);
}
RootController.admins =  (req, res) => {
    res.send(admins);
}
RootController.redirectToRoot = (req,res)=>{
     res.redirect('/');
}
RootController.logOut = async (req,res)=>{
    await req.logout();
    res.redirect('/');
}
RootController.emailVerification =  (req,res,next)=>{
    const {token} = req.query;
    // Check to see token is valid with specified email
    jwt.verify(token,'afsan|user|emailVerify|007', { subject: "emailVerification" },(err, decoded)=>{
        // Check to see can find email
        if(err){
            if(err.name === 'TokenExpiredError'){
                return res.status(500).send('request expired please try again')
            }else{
                return res.send({err})
            }
        }
        User.findOneAndUpdate({
                 email: decoded.email
             }, {
                 $set: {
                     isVerified: true
                 }
             }, {
                 new: true
             },
             (err, user) => {
                 if (err) {
                     next(new Error('can\'t find Email try again'))
                 }
                 res.redirect('/')
             })
      });

}
RootController.resetPassword =  (req,res,next)=>{
    const {token} = req.query;
    jwt.verify(token,'afsan|user|resetPassword|007', { subject: "resetPassword" },(err, decoded)=>{
        if(err){
            if(err.name === 'TokenExpiredError'){
                return res.status(500).send('request expired please try again')
            }else{
                return res.send({err})
            }
        }
        res.send({email:decoded.email})
    })

}
RootController.printUsers =  (req,res,next)=>{
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline;filename="usersList"');
    User.find().then(async (users)=>{
        if(!users){return 'no user has been registered yet'}
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        let invoiceName = 'userslist'
        res.setHeader(
          'Content-Disposition',
          'inline; filename="' + invoiceName + '"'
        );
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {
          underline: true
        });
        pdfDoc.text('-----------------------');
        users = users.map(user=>{return{name:user.name,email:user.email}})
        users.forEach((user,i) => {
             pdfDoc.text(i+')'+user.email+'---'+user.name)
        });
        pdfDoc.text('---');
        pdfDoc.end();
    }).catch(e=>{ next(new Error(e)) })
}
export default RootController;