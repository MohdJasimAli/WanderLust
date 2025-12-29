const Listing = require("./models/listing");
const Review = require("./models/reviews");
const { reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");

// ================= REVIEW VALIDATION =================
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, errorMessage);
  }
  next();
};

// ================= AUTH CHECK =================
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectURL = req.originalUrl;
    req.flash("error", "You must be logged in");
    return res.redirect("/login");
  }
  next();
};

// ================= SAVE REDIRECT =================
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectURL) {
    res.locals.redirectURL = req.session.redirectURL;
  }
  next();
};

// ================= LISTING OWNER =================
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing || !listing.owner.equals(res.locals.currUser._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// ================= REVIEW AUTHOR =================
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review || !review.author.equals(res.locals.currUser._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
