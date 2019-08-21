import express from 'express';
import passport from 'passport'
import requireLogin from '../middlewares/requireLogin'
import requireNotLoggedIn from '../middlewares/requireNotLogin'
import rootCtr from '../controllers/root';
import ipInfo from '../controllers/ipInfo';

const router = express.Router();

const googleAuth = passport.authenticate('google', {
   scope: ['profile', 'email']
})
const googleAuthCB = passport.authenticate('google')
router.get(
   '/auth/google',
   requireNotLoggedIn,
   googleAuth
);
router.get(
   '/api/auth/google/callback',
   requireNotLoggedIn,
   googleAuthCB,
   rootCtr.redirectToRoot
)
router.get(
   '/auth/google/callback',
   requireNotLoggedIn,
   googleAuthCB,
   rootCtr.redirectToRoot
)
router.get(
   '/logout',
   requireLogin,
   rootCtr.logOut
)
router.get(
   '/current_user',
   requireLogin,
   (req, res) => {res.send(req.user)}
)
router.get(
   '/emailverify',
   rootCtr.emailVerification
   ,rootCtr.redirectToRoot
)
router.get(
   '/resetPassword',
   rootCtr.resetPassword
)
router.get(
   '/usersListPdf',
   rootCtr.printUsers
)
router.post(
   '/userInfo',
   (req,res)=>{
      ipInfo.storeSystem((errMsg)=>{
         if(errMsg){console.log(errMsg)}
      },req.body.ip)
      res.end()
   }
)

export default router;