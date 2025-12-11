document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) return (window.location.href = "index.html");

  const user = JSON.parse(userRaw);
  document.getElementById("rider-name").textContent = user.email.split("@")[0];

  const baseUrl = "https://sharmo-riding-app.onrender.com";

  // ---------------------------------------------------------
  // 🌍 LEAFLET MAP — GUARANTEED WORKING
  // ---------------------------------------------------------
  let map = L.map("map").setView([5.6037, -0.1870], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let marker = null;

  // ---------------------------------------------------------
  // 📍 GET GEOLOCATION
  // ---------------------------------------------------------
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
        console.warn("Location blocked:", err.message);
      }
    );
  }

  // ---------------------------------------------------------
  // 🚕 SIMPLE RIDE CREATION (unchanged)
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
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify({
        pickup,
        dropoff,
        ride_type: rideType,
        payment_method: payment,
      }),
    });

    if (!res.ok) return alert("Ride failed");
    alert("Ride created!");
  });
});
