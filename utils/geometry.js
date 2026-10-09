const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAP_TOKEN,
});

async function getGeometry(location, country) {
  const response = await geocodingClient
    .forwardGeocode({
      query: `${location}, ${country}`,
      limit: 1,
    })
    .send();

  if (!response.body.features.length) {
    return null;
  }

  return response.body.features[0].geometry;
}

module.exports = { getGeometry };
