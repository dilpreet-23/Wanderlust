const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});


// ===============================
// MAPBOX GEOCODING FUNCTION
// ===============================
async function getGeometry(location, country) {

    let response = await geocodingClient
        .forwardGeocode({
            query: location,
            limit: 1,
        })
        .send();

    if (!response.body.features.length) {
        return null;
    }

    return response.body.features[0].geometry;
}


// ===============================
// INDEX
// ===============================
module.exports.index = async (req, res) => {
    const { country, category } = req.query;

    const filter = {};

    if (country && country.trim() !== "") {
        filter.country = {
            $regex: country.trim(),
            $options: "i"
        };
    }

    if (category && category.trim() !== "") {
        filter.category = category.trim();
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index.ejs", { allListings });
};


// ===============================
// NEW FORM
// ===============================
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


// ===============================
// SHOW LISTING
// ===============================

module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Fix missing map coordinates
    if (
        !listing.geometry ||
        !listing.geometry.coordinates ||
        listing.geometry.coordinates.length !== 2
    ) {

        console.log("Location:", listing.location);
        console.log("Country:", listing.country);

        let geometry = await getGeometry(
            listing.location,
            listing.country
        );

        if (geometry) {

            await Listing.updateOne(
                { _id: listing._id },
                { $set: { geometry: geometry } }
            );

            listing.geometry = geometry;

            console.log(
                "Map coordinates added:",
                geometry.coordinates
            );

        } else {

            console.log(
                "Mapbox could not find:",
                listing.location,
                listing.country
            );
        }
    }

    res.render("listings/show.ejs", { listing });
};

// ===============================
// CREATE LISTING
// ===============================
module.exports.createListing = async (req, res) => {

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
        url,
        filename
    };


    // Get coordinates from Mapbox
    newListing.geometry = await getGeometry(
        req.body.listing.location,
        req.body.listing.country
    );

    console.log("Category received:", req.body.listing.category);
    let savedListing = await newListing.save();

    console.log(savedListing);

    req.flash("success", "New Listing created!");

    res.redirect("/listings");
};


// ===============================
// EDIT FORM
// ===============================
module.exports.renderEditForm = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;

    originalImageUrl = originalImageUrl.replace(
        "/upload",
        "/upload/w_250"
    );

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });
};


// ===============================
// UPDATE LISTING
// ===============================
module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }


    // Update normal listing information
    Object.assign(listing, req.body.listing);


    // Update image if a new image was uploaded
    if (typeof req.file !== "undefined") {

        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = {
            url,
            filename
        };
    }


    // Update Mapbox coordinates
    let geometry = await getGeometry(
        listing.location,
        listing.country
    );

    if (geometry) {
        listing.geometry = geometry;
    }


    await listing.save();


    req.flash("success", "Listing Updated!");

    res.redirect(`/listings/${id}`);
};


// ===============================
// DELETE LISTING
// ===============================
module.exports.destroyListing = async (req, res) => {

    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");

    res.redirect("/listings");
};

module.exports.getGeometry = getGeometry;