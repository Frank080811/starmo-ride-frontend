document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  document.getElementById("rider-name").textContent = user.email.split("@")[0];

  const baseUrl = "https://sharmo-riding-app.onrender.com";

  // ============================================
  // 🌍 LEAFLET MAP INITIALIZATION
  // ============================================

  // Prevent double instantiation
  let map = L.map("map", { zoomControl: true }).setView([5.6037, -0.1870], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let marker = null;

  // ---- GET USER LOCATION ----
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
        console.warn("GPS Permission Denied:", err.message);
        map.setView([5.6037, -0.1870], 12); // Default Accra view
      }
    );
  }

  // ============================================
  // 🧾 RIDE BOOKING LOGIC (unchanged)
  // ============================================

  const rideForm = document.getElementById("ride-form");

  rideForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pickup = document.getElementById("pickup").value.trim();
    const dropoff = document.getElementById("dropoff").value.trim();
    const rideType = document.getElementById("ride-type").value;
    const payment = document.getElementById("payment-method").value;

    if (!pickup || !dropoff) return alert("Fill pickup & dropoff");

    const res = await fetch(baseUrl + "/rides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify({
        pickup,
        dropoff,
        ride_type: rideType,
        payment_method: payment,
      }),
    });

    if (!res.ok) {
      alert("Ride failed");
      return;
    }

    alert("Ride created successfully!");
  });
});
