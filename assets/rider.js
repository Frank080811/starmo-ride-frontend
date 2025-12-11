// assets/js/rider.js
document.addEventListener("DOMContentLoaded", () => {

    console.log("Rider JS Loaded…");

    // ----------------------------------------------------
    // USER LOGIN CHECK
    // ----------------------------------------------------
    const userRaw = localStorage.getItem("swift_user");
    if (!userRaw) {
        console.warn("No user found in localStorage");
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userRaw);
    document.getElementById("rider-name").textContent =
        user.email.split("@")[0];

    const baseUrl = "https://sharmo-riding-app.onrender.com";

    // ----------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("swift_user");
        window.location.href = "index.html";
    });

    // ----------------------------------------------------
    // MAP INITIALIZATION (MOST IMPORTANT FIX)
    // ----------------------------------------------------
    let map;
    let marker;

    function initMap() {
        console.log("Initializing Leaflet map…");

        const mapDiv = document.getElementById("map");
        if (!mapDiv) {
            console.error("Map container NOT FOUND!");
            return;
        }

        // Ensure parent layout is fully rendered
        setTimeout(() => {
            map = L.map("map", {
                zoomControl: true
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "© OpenStreetMap"
            }).addTo(map);

            // Force Leaflet to recalc size
            setTimeout(() => {
                map.invalidateSize(true);
                map.setView([5.6037, -0.1870], 13);
            }, 300);

            console.log("Map initialized successfully.");

        }, 300);
    }

    initMap();

    // ----------------------------------------------------
    // GEOLOCATION FIX
    // ----------------------------------------------------
    function requestLocation() {
        console.log("Requesting browser GPS…");

        if (!navigator.geolocation) {
            alert("GPS not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("GPS SUCCESS:", pos.coords);

                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const pickupField = document.getElementById("pickup");
                pickupField.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

                if (!marker) {
                    marker = L.marker([lat, lng]).addTo(map);
                } else {
                    marker.setLatLng([lat, lng]);
                }

                map.setView([lat, lng], 15);
            },
            (err) => {
                console.error("GPS ERROR:", err);
                alert("Location permission denied. Enable it and retry.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // Try to load user location after UI loads
    setTimeout(requestLocation, 800);

    // Enable location button
    document.getElementById("enable-location").addEventListener("click", requestLocation);

    // ----------------------------------------------------
    // RIDE SUBMISSION FIX
    // ----------------------------------------------------
    const rideForm = document.getElementById("ride-form");

    rideForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pickup = document.getElementById("pickup").value.trim();
        const dropoff = document.getElementById("dropoff").value.trim();
        const rideType = document.getElementById("ride-type").value;
        const payment = document.getElementById("payment-method").value;

        if (!pickup || !dropoff) {
            alert("Pickup and dropoff required.");
            return;
        }

        console.log("Submitting ride…");

        const res = await fetch(`${baseUrl}/rides`, {
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

        const data = await res.json();

        if (!res.ok) {
            console.error("Ride creation failed:", data);
            alert("Request failed: " + (data.detail || "Unknown error"));
            return;
        }

        console.log("Ride response:", data);

        alert("Your ride request has been submitted.");
    });

});
