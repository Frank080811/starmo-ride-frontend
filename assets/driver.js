document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  const nameEl = document.getElementById("driver-name");
  if (nameEl) nameEl.textContent = user.email.split("@")[0];

  const logoutBtn = document.getElementById("btn-logout");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("swift_user");
    window.location.href = "index.html";
  });

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

  const statusPill = document.getElementById("driver-status");
  let isOnline = true;

  statusPill?.addEventListener("click", () => {
    isOnline = !isOnline;
    statusPill.textContent = isOnline ? "Online" : "Offline";
    statusPill.classList.toggle("online", isOnline);
  });

  const requestList = document.getElementById("request-list");
  const tripsList = document.getElementById("driver-trips-list");
  const statTrips = document.getElementById("stat-trips");
  const statAcceptance = document.getElementById("stat-acceptance");
  const statRating = document.getElementById("stat-rating");
  const driverEarnings = document.getElementById("driver-earnings");
  const uploadInput = document.getElementById("driver-doc");
  const uploadBtn = document.getElementById("btn-upload-doc");
  const uploadStatus = document.getElementById("upload-status");

  let totalTrips = 0;
  let acceptedRequests = 0;
  let totalRequests = 0;
  let earnings = 0;

 const baseUrl = "https://sharmo-riding-app.onrender.com";


  uploadBtn?.addEventListener("click", async () => {
    if (!uploadInput.files.length) {
      alert("Select a file first");
      return;
    }
    const file = uploadInput.files[0];
    const form = new FormData();
    form.append("doc", file);

    try {
      const res = await fetch(baseUrl + `/drivers/upload-document`, {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
        body: form,
      });
      const data = await res.json();
      uploadStatus.textContent = "Uploaded: " + (data.file || "");
    } catch (e) {
      console.error(e);
      uploadStatus.textContent = "Upload failed";
    }
  });

  function addIncomingRequest(ride) {
    totalRequests++;

    const li = document.createElement("li");
    li.className = "ride-item";
    li.innerHTML = `
      <div>
        <div>${ride.pickup} → ${ride.dropoff}</div>
        <div class="muted">${ride.distance_km.toFixed(1)} km • $${ride.fare.toFixed(
      2
    )}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.2rem;">
        <button class="btn primary" style="padding:0.2rem 0.5rem;font-size:0.7rem;">Accept</button>
        <button class="btn ghost" style="padding:0.2rem 0.5rem;font-size:0.7rem;">Decline</button>
      </div>
    `;

    const [acceptBtn, declineBtn] = li.querySelectorAll("button");

    acceptBtn.addEventListener("click", async () => {
      acceptedRequests++;
      totalTrips++;
      earnings += ride.fare;
      driverEarnings.textContent = `$${earnings.toFixed(2)}`;
      statTrips.textContent = totalTrips.toString();
      statAcceptance.textContent = `${Math.round((acceptedRequests / totalRequests) * 100)}%`;

      li.querySelectorAll("button").forEach((b) => (b.disabled = true));
      li.style.opacity = "0.6";
      moveToTrips(ride);

      try {
        await fetch(baseUrl + `/rides/${ride.id}/accept`, {
          method: "POST",
          headers: { Authorization: "Bearer " + user.token },
        });
      } catch (e) {
        console.error(e);
      }
    });

    declineBtn.addEventListener("click", () => {
      statAcceptance.textContent =
        totalRequests === 0 ? "0%" : `${Math.round((acceptedRequests / totalRequests) * 100)}%`;
      li.remove();
    });

    requestList.prepend(li);
  }

  function moveToTrips(ride) {
    const trip = document.createElement("li");
    trip.className = "ride-item";
    trip.innerHTML = `
      <div>
        <div>${ride.pickup} → ${ride.dropoff}</div>
        <div class="muted">Completed just now</div>
      </div>
      <div style="text-align:right;">
        <div>$${ride.fare.toFixed(2)}</div>
        <div class="muted">${ride.distance_km.toFixed(1)} km</div>
      </div>
    `;
    tripsList.prepend(trip);
  }

  window.SwiftRideDriver = {
    addIncomingRequest,
  };

  statRating.textContent = (4.6 + Math.random() * 0.4).toFixed(1);
});
