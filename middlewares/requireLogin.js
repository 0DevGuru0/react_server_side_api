export default (req,res,next)=>{
    req.user ? next() : res.status(404).send({ error: 'You must log in!' }) ;
}