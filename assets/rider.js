document.addEventListener("DOMContentLoaded", () => {
    console.log("Rider JS loaded.");

    const userRaw = localStorage.getItem("swift_user");
    if (!userRaw) return (window.location.href = "index.html");

    const user = JSON.parse(userRaw);
    document.getElementById("rider-name").textContent = user.email.split("@")[0];

    const baseUrl = "https://sharmo-riding-app.onrender.com";

    // ---------------------------------------------------------
    // LOGOUT FIX
    // ---------------------------------------------------------
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("swift_user");
        window.location.href = "index.html";
    });

    // ---------------------------------------------------------
    // LEAFLET MAP
    // ---------------------------------------------------------
    let map = L.map("map", { zoomControl: true });

    // Ensures map renders properly
    setTimeout(() => {
        map.invalidateSize();
        map.setView([5.6037, -0.1870], 13);
    }, 200);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    let marker = null;

    // ---------------------------------------------------------
    // AUTO GET LOCATION
    // ---------------------------------------------------------
    function loadLocation() {
        if (!navigator.geolocation) {
            console.warn("Geolocation unavailable.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("GPS Access Granted");

                const { latitude, longitude } = pos.coords;

                document.getElementById("pickup").value =
                    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

                if (!marker) {
                    marker = L.marker([latitude, longitude]).addTo(map);
                } else {
                    marker.setLatLng([latitude, longitude]);
                }

                map.setView([latitude, longitude], 15);
            },
            (err) => {
                console.warn("GPS Error:", err.message);
                alert("Please allow location access for map accuracy.");
            }
        );
    }

    // Call on load
    loadLocation();

    // Retry button
    document.getElementById("enable-location").addEventListener("click", loadLocation);

    // ---------------------------------------------------------
    // SIMPLE RIDE CREATION
    // ---------------------------------------------------------
    const rideForm = document.getElementById("ride-form");

    rideForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pickup = document.getElementById("pickup").value.trim();
        const dropoff = document.getElementById("dropoff").value.trim();
        const rideType = document.getElementById("ride-type").value;
        const payment = document.getElementById("payment-method").value;

        const res = await fetch(baseUrl + "/rides", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + user.token
            },
            body: JSON.stringify({
                pickup,
                dropoff,
                ride_type: rideType,
                payment_method: payment
            })
        });

        if (!res.ok) return alert("Ride failed");

        alert("Ride created!");
    });
});
