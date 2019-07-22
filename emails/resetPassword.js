const jwt = require('jsonwebtoken');
const resetPassword=(user)=>{
    const request = jwt.sign({
        email:user.email,
        access:"simple_user",
    },'afsan|user|resetPassword|007',{
        expiresIn: 60*60,
        subject:"resetPassword"
    })
    return `
    <html>
        <body>
            <div>
                <h1>resetPassword</h1>
                <a href='http://localhost:3000/resetPassword/${request}'>
                    <button>reset my account Password</button>
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
        subject : `Rest Password`,
        from    :  'af.hadafi@gmail.com',
        text    ,
        html    :  resetPassword(user)
    }
}
export default config;