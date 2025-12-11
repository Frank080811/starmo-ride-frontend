document.addEventListener("DOMContentLoaded", () => {

    console.log("Rider JS Loaded.");

    // -------------------------------
    // LOGIN VALIDATION
    // -------------------------------
    const userRaw = localStorage.getItem("swift_user");
    if (!userRaw) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userRaw);
    document.getElementById("rider-name").textContent = user.email.split("@")[0];

    const baseUrl = "https://sharmo-riding-app.onrender.com";

    // -------------------------------
    // LOGOUT FIX
    // -------------------------------
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("swift_user");
        window.location.href = "index.html";
    });

    // -------------------------------
    // LEAFLET MAP — FIXED
    // -------------------------------
    const map = L.map("map", { zoomControl: true });

    // Wait for the UI to load → then fix rendering
    setTimeout(() => {
        map.invalidateSize();              // CRITICAL FIX
        map.setView([5.6037, -0.1870], 13);
    }, 300);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    let marker = null;

    // -------------------------------
    // GEOLOCATION (fixed)
    // -------------------------------
    function requestLocation() {
        if (!navigator.geolocation) {
            alert("Your browser does not support GPS.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("GPS granted.");
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                document.getElementById("pickup").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

                if (!marker) {
                    marker = L.marker([lat, lng]).addTo(map);
                } else {
                    marker.setLatLng([lat, lng]);
                }

                map.setView([lat, lng], 15);
            },
            (err) => {
                console.warn("GPS denied:", err.message);
                alert("Location access denied. Please enable location.");
            }
        );
    }

    // Initial attempt
    requestLocation();

    // Retry button
    const retryBtn = document.getElementById("enable-location");
    if (retryBtn) retryBtn.addEventListener("click", requestLocation);

    // -------------------------------
    // RIDE SUBMISSION
    // -------------------------------
    const rideForm = document.getElementById("ride-form");

    rideForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pickup = document.getElementById("pickup").value.trim();
        const dropoff = document.getElementById("dropoff").value.trim();
        const rideType = document.getElementById("ride-type").value;
        const payment = document.getElementById("payment-method").value;

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

        if (!res.ok) return alert("Ride failed. Try again.");

        alert("Ride created!");
    });

});
