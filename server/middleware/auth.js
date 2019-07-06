const { User } = require("./../models/user");
let auth = (req, res, next) => {
  let token = req.cookies.guitarshop_auth; //token from the cookies

  User.findByToken(token, (err, user) => {
    if (err) throw err;
    if (!user)
      return res.json({
        //if no user detectes
        isAuth: false,
        error: true
      });
    req.token = token; //entering request and pushing a value name token
    req.user = user; //inside request all the info from user
    next();
  });
};

module.exports = { auth };
