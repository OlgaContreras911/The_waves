const express = require("express"); //create an express aplication
//const bodyParser = require("body-parser"); //to obtain information from request
const cookieParser = require("cookie-parser");

const app = express(); // host instance
const mongoose = require("mongoose");
require("dotenv").config(); //make env usable

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true }, err => {
  if (err) return err;
  console.log("Connected to MongoDB");
});
mongoose.set("useCreateIndex", true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); //connect to mongoose

//Models
const { User } = require("./models/user");
const { Brand } = require("./models/brand");
const { Wood } = require("./models/woods");
const { Product } = require("./models/products");

//Middlewares
const { auth } = require("./middleware/auth");
const { admin } = require("./middleware/admin");

////////////////////////////////
//           PRODUCTS
///////////////////////////////

app.post("/api/product/article", auth, admin, (req, res) => {
  const product = new Product(req.body);

  product.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      article: doc
    });
  });
});

// one id
//api/product/article?id=HSKKKSKS&type=single  this is a query string
// more than 1 id
//api/product/article?id=HSKKKSKS,akdjfañjf,kdjfalkñfja&type=array

app.get("/api/product/articles_by_id", (req, res) => {
  let type = req.query.type; //search for the query type, urlencode allow this
  let items = req.query.id; //obtain all that contain th id

  if (type === "array") {
    //could be without this, but in this case if type=array this works
    let ids = req.query.id.split(","); //all the values in items, in mongo there is no coma, so this is important
    items = []; //convert this in an array
    items = ids.map(item => {
      // Convert in ObjectId of Mongoose
      return mongoose.Types.ObjectId(item);
    });
  }
  Product.find({ _id: { $in: items } })
    .populate("brand") //make and object and contain the info of the product, not only id, thanks to ref in schema
    .populate("wood")
    .exec((err, docs) => {
      return res.status(200).send(docs);
    });
});

// BY ARRIVAL (Más nuevas)
//articles?sortBy=createdAt&order=desc&limit=4

// BY SELL (Más Ventas)
//articles?sortBy=sold&order=desc&limit=4

app.get("/api/product/articles", (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 100;

  Product.find()
    .populate("brand")
    .populate("wood")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, articles) => {
      if (err) return res.status(400).send(err);
      res.send(articles);
    });
});
////////////////////////////////
//           WOODS
///////////////////////////////
app.post("/api/product/wood", auth, admin, (req, res) => {
  const wood = new Wood(req.body);
  wood.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      wood: doc
    });
  });
});

app.get("/api/product/woods", (req, res) => {
  Wood.find({}, (err, woods) => {
    if (err) return res.status(400).send(err);
    res.status(200).send(woods);
  });
});
////////////////////////////////
//           BRANDS
///////////////////////////////
app.post("/api/product/brand", auth, admin, (req, res) => {
  const brand = new Brand(req.body); //brand with what we expect
  brand.save((err, doc) => {
    //obtain an err or a doc from MongoDB
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      brand: doc
    });
  });
});

app.get("/api/product/brands", (req, res) => {
  //obtain all brands
  Brand.find({}, (err, brands) => {
    if (err) return res.status(400).send(err);
    res.status(200).send(brands);
  });
});

////////////////////////////////
//           USERS
///////////////////////////////

app.get("/api/users/auth", auth, (req, res) => {
  //First we go to middelware auth to see if continue or not
  res.status(200).json({
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    cart: req.user.cart,
    history: req.user.history
  });
});

app.post("/api/users/register", (req, res) => {
  //all the request go to api
  const user = new User(req.body); //what we expect form the request
  user.save((err, doc) => {
    //what will happen, store the user
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      userdata: doc
    });
  });
});

app.post("/api/users/login", (req, res) => {
  // 1. Find email
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: "Auth failed, email not found"
      });

    // 2. Obtain password and check it
    user.comparePassword(req.body.password, (err, isMatch) => {
      //cb function
      if (!isMatch)
        return res.json({ loginSuccess: false, message: "Wrong Password" });

      // 3. If OK, create a new token
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        // If OK, save token as a cookie
        res
          .cookie("guitarshop_auth", user.token)
          .status(200)
          .json({ loginSuccess: true });
      });
    });
  });
});
app.get("/api/user/logout", auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { token: "" }, //return token to nothing
    (err, doc) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).json({
        success: true
      });
    }
  );
});
const port = process.env.PORT || 3002; //create a server, with an enviroment variable enter to the port, if not run it on port 3002
app.listen(port, () => {
  //listen the port
  console.log(`Server Running at ${port}`); //For know if we are in
});
