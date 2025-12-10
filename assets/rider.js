document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  const CURRENCY = "GH₵";

  const baseUrl = "https://sharmo-riding-app.onrender.com";

  // UI updates
  const nameEl = document.getElementById("rider-name");
  if (nameEl) nameEl.textContent = user.email.split("@")[0];

  // -----------------------------
  // 🌍 INITIALIZE LEAFLET MAP
  // -----------------------------
  let map = L.map("map").setView([5.6037, -0.1870], 13); // default Accra

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let userMarker = null;

  // -----------------------------
  // 📌 GET CURRENT LOCATION
  // -----------------------------
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        document.getElementById("pickup").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        userMarker = L.marker([lat, lng]).addTo(map);
        map.setView([lat, lng], 15);
      },
      () => console.log("GPS permission denied")
    );
  }

  // -----------------------------
  // 💳 WALLET, BOOKING, HISTORY (unchanged)
  // -----------------------------

  const rideForm = document.getElementById("ride-form");
  const estCard = document.getElementById("estimate-card");
  const estDistance = document.getElementById("est-distance");
  const estDuration = document.getElementById("est-duration");
  const estFare = document.getElementById("est-fare");
  const estSurge = document.getElementById("est-surge");

  async function fetchSurge() {
    try {
      const res = await fetch(baseUrl + "/admin/heatmap/surge");
      const data = await res.json();
      return data.multiplier || 1;
    } catch {
      return 1;
    }
  }

  function fakeDistanceAndDuration() {
    const distance = (Math.random() * 8 + 1).toFixed(1);
    const duration = Math.round(distance * (4 + Math.random() * 3));
    return { distance, duration };
  }

  function calculateFare(distance, duration, rideType, promo, surge) {
    let multiplier = 1;
    if (rideType === "comfort") multiplier = 1.2;
    if (rideType === "xl") multiplier = 1.6;

    let fare = (20 + distance * 5 + duration * 0.5) * multiplier * surge;

    if (promo && promo.toUpperCase() === "WELCOME10") fare *= 0.9;

    return fare.toFixed(2);
  }

  rideForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pickup = document.getElementById("pickup").value;
    const dropoff = document.getElementById("dropoff").value;
    const rideType = document.getElementById("ride-type").value;
    const payment = document.getElementById("payment-method").value;
    const promo = document.getElementById("promo-code").value;

    const { distance, duration } = fakeDistanceAndDuration();
    const surge = await fetchSurge();
    const fare = calculateFare(distance, duration, rideType, promo, surge);

    estCard.classList.remove("hidden");
    estDistance.textContent = `${distance} km`;
    estDuration.textContent = `${duration} min`;
    estSurge.textContent = `${surge}x`;
    estFare.textContent = `${CURRENCY}${fare}`;

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
        promo_code: promo || null,
      }),
    });

    if (res.ok) {
      alert("Ride created! Matching driver...");
    }
  });
});
