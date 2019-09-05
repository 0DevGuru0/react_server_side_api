const jwt = require('jsonwebtoken');

const emailVerify=(user)=>{
    const request = jwt.sign({
        email:user.email,
        access:"simple_user",
    },'afsan|user|emailVerify|007',{
        expiresIn: 60*60,
        subject:"emailVerification"
    })
    return `
    <html>
        <body>
            <div>
                <h1>Email Verification</h1>
                <a href='https://localhost:3000/api/emailverify?token=${request}'>
                    <button>verifying my account</button>
                </a>
            </div>
        </body>
    </html>
    `
}
const text = 'and easy to do anywhere, even with Node.js'

const config = (user)=>{
    return {
        to      :  user.email,
        subject :  `Successfully SignedIn[${user.name}]`,
        from    :  'af.hadafi@gmail.com',
        text    ,
        html    :  emailVerify(user)
    }
}
export default config;