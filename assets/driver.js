// frontend/assets/js/driver.js
document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  if (user.role !== "driver") {
    window.location.href = "index.html";
    return;
  }

  const CURRENCY = "GH₵";
  const baseUrl = "https://sharmo-riding-app.onrender.com";

  // -----------------------------
  // BASIC UI ELEMENTS
  // -----------------------------
  const nameEl = document.getElementById("driver-name");
  const earningsLabel = document.getElementById("driver-earnings");
  const statusBadge = document.getElementById("driver-status");
  const logoutBtn = document.getElementById("btn-logout");

  const requestList = document.getElementById("request-list");
  const tripsList = document.getElementById("driver-trips-list");

  const statTripsEl = document.getElementById("stat-trips");
  const statAcceptEl = document.getElementById("stat-acceptance");
  const statRatingEl = document.getElementById("stat-rating");

  if (nameEl) nameEl.textContent = user.email.split("@")[0];

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("swift_user");
    window.location.href = "index.html";
  });

  // -----------------------------
  // SIDEBAR NAVIGATION
  // -----------------------------
  const links = document.querySelectorAll(".sidebar-link");
  const panels = {
    requests: document.getElementById("panel-requests"),
    trips: document.getElementById("panel-trips"),
    stats: document.getElementById("panel-stats"),
    docs: document.getElementById("panel-docs"),
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      const view = link.dataset.view;

      Object.keys(panels).forEach((k) => {
        panels[k]?.classList.toggle("hidden", k !== view);
      });
    });
  });

  // -----------------------------
  // LIVE MAP & LOCATION TRACKING
  // -----------------------------
  const defaultGhanaCenter = [5.6037, -0.1870]; // Accra as fallback
  let map;
  let marker;
  let accuracyCircle;

  function initMap(center) {
    if (!window.L) {
      console.warn("Leaflet not loaded");
      return;
    }

    map = L.map("driver-map").setView(center, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    marker = L.marker(center).addTo(map).bindPopup("You are here").openPopup();
    accuracyCircle = L.circle(center, { radius: 50, fillOpacity: 0.2 }).addTo(
      map
    );
  }

  function updateLocationOnMap(lat, lng, accuracy) {
    const coord = [lat, lng];

    if (!map) {
      initMap(coord);
    } else {
      marker?.setLatLng(coord);
      accuracyCircle?.setLatLng(coord);
      if (accuracy) {
        accuracyCircle?.setRadius(accuracy);
      }
    }

    // expose to other scripts (e.g. driver_ws.js)
    window.SwiftRideDriver = window.SwiftRideDriver || {};
    window.SwiftRideDriver.currentLocation = { lat, lng, accuracy, ts: Date.now() };

    // fire a custom event so any listener (like WS module) can hook in
    window.dispatchEvent(
      new CustomEvent("driver:location", {
        detail: { lat, lng, accuracy, ts: Date.now() },
      })
    );
  }

  // Start geolocation
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateLocationOnMap(latitude, longitude, accuracy);
      },
      (err) => {
        console.warn("Initial GPS error:", err);
        initMap(defaultGhanaCenter);
      }
    );

    // Watch position for live tracking
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateLocationOnMap(latitude, longitude, accuracy);
      },
      (err) => console.warn("watchPosition error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );
  } else {
    console.warn("Geolocation not supported, using Ghana fallback");
    initMap(defaultGhanaCenter);
  }

  // -----------------------------
  // DRIVER OVERVIEW / STATS
  // -----------------------------
  async function loadDriverOverview() {
    try {
      const res = await fetch(baseUrl + "/driver/overview", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();

      // backend structure is flexible – use fallbacks
      const rating = data.rating ?? 5.0;
      const tripsToday = data.trips_today ?? 0;
      const acceptance = data.acceptance_rate ?? 0;
      const earnings = data.earnings_today ?? 0;

      if (earningsLabel)
        earningsLabel.textContent = CURRENCY + earnings.toFixed(2);
      if (statTripsEl) statTripsEl.textContent = tripsToday;
      if (statAcceptEl) statAcceptEl.textContent = `${acceptance.toFixed(0)}%`;
      if (statRatingEl) statRatingEl.textContent = rating.toFixed(1);
    } catch (err) {
      console.error("loadDriverOverview error", err);
    }
  }

  // -----------------------------
  // TRIP HISTORY
  // -----------------------------
  async function loadTripHistory() {
    try {
      const res = await fetch(baseUrl + "/driver/rides", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const rides = await res.json();

      tripsList.innerHTML = "";
      if (!rides.length) {
        tripsList.innerHTML =
          '<li class="ride-item"><span>No trips yet.</span></li>';
        return;
      }

      rides.forEach((ride) => {
        const li = document.createElement("li");
        li.className = "ride-item";
        li.innerHTML = `
          <div>
            <div>${ride.pickup} → ${ride.dropoff}</div>
            <div class="muted">${new Date(
              ride.created_at
            ).toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div>${CURRENCY}${(ride.fare || 0).toFixed(2)}</div>
            <div class="muted">${ride.distance_km || 0} km • ${
          ride.duration_min || 0
        } min</div>
            <div class="muted">Status: ${ride.status}</div>
          </div>
        `;
        tripsList.appendChild(li);
      });
    } catch (err) {
      console.error("loadTripHistory error", err);
    }
  }

  // -----------------------------
  // INCOMING REQUESTS (FROM WS)
  // -----------------------------
  window.SwiftRideDriver = window.SwiftRideDriver || {};

  window.SwiftRideDriver.addIncomingRequest = function (ride) {
    if (!requestList) return;

    const li = document.createElement("li");
    li.className = "ride-item";
    li.innerHTML = `
      <div>
        <div>${ride.pickup} → ${ride.dropoff}</div>
        <div class="muted">${(ride.distance_km || 0).toFixed(1)} km • ${
      ride.duration_min || 0
    } min</div>
        <div class="muted">Fare: ${CURRENCY}${(ride.fare || 0).toFixed(
      2
    )}</div>
      </div>
      <div class="driver-request-actions">
        <button class="btn small primary">Accept</button>
        <button class="btn small ghost">Decline</button>
      </div>
    `;

    const [btnAccept, btnDecline] = li.querySelectorAll("button");

    btnAccept.addEventListener("click", async () => {
      try {
        const res = await fetch(`${baseUrl}/rides/${ride.id}/accept`, {
          method: "POST",
          headers: { Authorization: "Bearer " + user.token },
        });
        if (!res.ok) {
          const err = await res.json();
          alert("Could not accept ride: " + (err.detail || "Unknown error"));
          return;
        }
        li.querySelector(".driver-request-actions").innerHTML =
          '<span class="muted">Accepted. Navigate to pickup…</span>';
        if (statusBadge) statusBadge.textContent = "On trip";
      } catch (err) {
        console.error(err);
        alert("Connection error while accepting ride");
      }
    });

    btnDecline.addEventListener("click", () => {
      li.remove();
    });

    requestList.prepend(li);
  };

  // -----------------------------
  // SIMPLE DOC UPLOAD DEMO
  // -----------------------------
  const uploadBtn = document.getElementById("btn-upload-doc");
  const uploadInput = document.getElementById("driver-doc");
  const uploadStatus = document.getElementById("upload-status");

  uploadBtn?.addEventListener("click", () => {
    if (!uploadInput?.files?.length) {
      uploadStatus.textContent = "Please choose a file first.";
      return;
    }
    // demo only – no actual upload
    uploadStatus.textContent =
      "Document uploaded (demo only, not stored on server).";
  });

  // -----------------------------
  // INITIAL LOADS
  // -----------------------------
  loadDriverOverview();
  loadTripHistory();
});
