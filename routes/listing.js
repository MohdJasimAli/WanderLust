const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const { isLoggedIn, isOwner } = require("../middleware.js");

const multer = require("multer");
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });

// ================= VALIDATION =================
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, errorMessage);
  }
  next();
};

// ================= INDEX (SEARCH + CATEGORY FILTER) =================
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const { category, search } = req.query;

    let query = {};

    // CATEGORY FILTER
    if (category && category !== "") {
      query.category = category;
    }

    // SEARCH FILTER (basic, old-style)
    if (search && search !== "") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const allListings = await Listing.find(query);

    res.render("listings/index.ejs", {
      allListings,
      selectedCategory: category || "",
      searchText: search || "",
    });
  })
);

// ================= NEW =================
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

// ================= CREATE =================
router.post(
  "/",
  isLoggedIn,
  upload.single("image"),
  validateListing,
  wrapAsync(async (req, res) => {
    console.log("FILE:", req.file);

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    

    if (req.file) {
      const { path: url, filename } = req.file;
      newListing.image = { url, filename };
    }

    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
  })
);



// ================= SHOW =================
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing does not exist");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);

// ================= EDIT =================
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist");
      return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
  })
);

// ================= UPDATE =================
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  validateListing,
  wrapAsync(async (req, res) => {
    console.log("FILE:", req.file);
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
      new: true,
      runValidators: true,
    });

    if (req.file) {
      const { path: url, filename } = req.file;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Listing updated");
    res.redirect(`/listings/${id}`);
  })
);


// ================= DELETE =================
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted");
    res.redirect("/listings");
  })
);

module.exports = router;
