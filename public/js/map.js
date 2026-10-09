mapboxgl.accessToken = mapToken;

if (
    listing.geometry &&
    listing.geometry.coordinates &&
    listing.geometry.coordinates.length === 2
) {

    const map = new mapboxgl.Map({
        container: 'map',
        center: listing.geometry.coordinates,
        zoom: 9,
    });

    const marker1 = new mapboxgl.Marker({ color: "red" })
        .setLngLat(listing.geometry.coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                    <h4>${listing.title}</h4>
                    <p>Exact location will be provided after booking</p>
                `)
        )
        .addTo(map);

} else {

    console.log("Invalid or missing map coordinates:", listing.geometry);

}

