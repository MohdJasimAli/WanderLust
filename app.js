if(process.env.NODE_ENV != "production"){
require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { required } = require("joi");

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlist";
const dbURL = process.env.ATLASDB_URL;

main()
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbURL);
}

// Settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto:{
    secret: process.env.SECRET,
  },
  touchAfter: 24* 3600,
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //1 week
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
  },
};

store.on("error",()=>{
  console.log("Error in Session Store",err);
});

// Home
app.get("/", (req, res) => {
  res.redirect("/listings");
});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// GLOBAL TEMPLATE DEFAULTS (VERY IMPORTANT)
app.use((req, res, next) => {
  res.locals.searchText = "";
  res.locals.selectedCategory = null;
  next();
});

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// Review routes ABOVE this (already correct)

// 404 handler (NO PATH STRING)
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong!";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  if (req.accepts("html")) {
    res.status(status).render("error.ejs", { message });
  } else {
    res.status(status).json({ error: message });
  }
});


app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
