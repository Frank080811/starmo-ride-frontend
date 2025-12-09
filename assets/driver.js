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

  const nameEl = document.getElementById("driver-name");
  const ratingEl = document.getElementById("driver-rating");
  const todayEarningsEl = document.getElementById("driver-earnings-today");
  const todayTripsEl = document.getElementById("driver-trips-today");
  const statusBadge = document.getElementById("driver-status");
  const logoutBtn = document.getElementById("btn-logout");

  const requestsList = document.getElementById("incoming-requests");
  const tripsList = document.getElementById("driver-trip-history");

  if (nameEl) nameEl.textContent = user.email.split("@")[0];

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("swift_user");
    window.location.href = "index.html";
  });

  // Sidebar navigation
  const links = document.querySelectorAll(".sidebar-link");
  const panels = {
    dashboard: document.getElementById("panel-dashboard"),
    requests: document.getElementById("panel-requests"),
    history: document.getElementById("panel-history"),
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

  async function loadDriverOverview() {
    try {
      const res = await fetch(baseUrl + "/driver/overview", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();

      if (ratingEl) ratingEl.textContent = (data.rating || 4.8).toFixed(1);
      if (todayEarningsEl) todayEarningsEl.textContent = CURRENCY + (data.earnings_today || 0).toFixed(2);
      if (todayTripsEl) todayTripsEl.textContent = data.trips_today || 0;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTripHistory() {
    try {
      const res = await fetch(baseUrl + "/driver/rides", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const rides = await res.json();

      tripsList.innerHTML = "";
      if (!rides.length) {
        tripsList.innerHTML = `<li class="ride-item"><span>No trips yet.</span></li>`;
        return;
      }

      rides.forEach((ride) => {
        const li = document.createElement("li");
        li.className = "ride-item";
        li.innerHTML = `
          <div>
            <div>${ride.pickup} → ${ride.dropoff}</div>
            <div class="muted">${new Date(ride.created_at).toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div>${CURRENCY}${(ride.fare || 0).toFixed(2)}</div>
            <div class="muted">${ride.distance_km || 0} km • ${ride.duration_min || 0} min</div>
            <div class="muted">Status: ${ride.status}</div>
          </div>
        `;
        tripsList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Incoming ride requests via WebSocket (driver_ws.js will call this)
  window.SwiftRideDriver = {
    addIncomingRequest(ride) {
      if (!requestsList) return;

      const li = document.createElement("li");
      li.className = "ride-item";
      li.innerHTML = `
        <div>
          <div>${ride.pickup} → ${ride.dropoff}</div>
          <div class="muted">${(ride.distance_km || 0).toFixed(1)} km • ${(ride.duration_min || 0)} min</div>
          <div class="muted">Fare: ${CURRENCY}${(ride.fare || 0).toFixed(2)}</div>
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
            `<span class="muted">Accepted. Navigate to pickup…</span>`;
          statusBadge.textContent = "On trip";
        } catch (err) {
          console.error(err);
          alert("Connection error while accepting ride");
        }
      });

      btnDecline.addEventListener("click", () => {
        li.remove();
      });

      requestsList.prepend(li);
    },
  };

  // Initial loads
  loadDriverOverview();
  loadTripHistory();
});
