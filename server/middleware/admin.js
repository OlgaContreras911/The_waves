let admin = (req, res, next) => {
  if (req.user.role === 0) {
    //if is 0 you are not admin
    return res.send("You are not allowed to do this");
  }
  next();
};
module.exports = { admin };
