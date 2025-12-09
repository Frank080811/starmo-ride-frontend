document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  const nameEl = document.getElementById("rider-name");
  if (nameEl) nameEl.textContent = user.email.split("@")[0];

  const logoutBtn = document.getElementById("btn-logout");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("swift_user");
    window.location.href = "index.html";
  });

  const links = document.querySelectorAll(".sidebar-link");
  const panels = {
    book: document.getElementById("panel-book"),
    history: document.getElementById("panel-history"),
    payments: document.getElementById("panel-payments"),
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

  const rideForm = document.getElementById("ride-form");
  const estCard = document.getElementById("estimate-card");
  const estDistance = document.getElementById("est-distance");
  const estDuration = document.getElementById("est-duration");
  const estFare = document.getElementById("est-fare");
  const estSurge = document.getElementById("est-surge");
  const historyList = document.getElementById("ride-history-list");
  const walletBalanceEl = document.getElementById("wallet-balance");
  const btnAddFunds = document.getElementById("btn-add-funds");
  const currentRideEl = document.getElementById("current-ride");
  const rideStatusLabel = document.getElementById("ride-status-label");
  const rideDriverName = document.getElementById("ride-driver-name");

  const BASE_FARE = 2.0;
  const RATE_PER_KM = 0.6;
  const RATE_PER_MIN = 0.15;

  const baseUrl = "https://sharmo-riding-app.onrender.com";


  function fakeDistanceAndDuration() {
    const distance = (Math.random() * 8 + 1).toFixed(1);
    const duration = Math.round(distance * (4 + Math.random() * 3));
    return { distance, duration };
  }

  async function fetchSurge() {
    try {
      const res = await fetch(baseUrl + "/admin/heatmap/surge");
      if (!res.ok) return 1.0;
      const data = await res.json();
      return data.multiplier || 1.0;
    } catch {
      return 1.0;
    }
  }

  function calculateFare(distance, duration, rideType, promo, surgeMultiplier) {
    let multiplier = 1;
    if (rideType === "comfort") multiplier = 1.2;
    if (rideType === "xl") multiplier = 1.6;
    let fare =
      (BASE_FARE + distance * RATE_PER_KM + duration * RATE_PER_MIN) * multiplier * surgeMultiplier;
    if (promo && promo.toUpperCase() === "WELCOME10") {
      fare *= 0.9;
    }
    return fare.toFixed(2);
  }

  async function refreshWallet() {
    try {
      const res = await fetch(baseUrl + "/wallet/me", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();
      walletBalanceEl.textContent = "$" + data.balance.toFixed(2);
    } catch (e) {
      console.error(e);
    }
  }

  btnAddFunds?.addEventListener("click", async () => {
    try {
      await fetch(baseUrl + "/wallet/topup", {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      });
      await refreshWallet();
      alert("Demo: wallet topped up with $20");
    } catch (e) {
      console.error(e);
    }
  });

  rideForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pickup = document.getElementById("pickup").value.trim();
    const dropoff = document.getElementById("dropoff").value.trim();
    const rideType = document.getElementById("ride-type").value;
    const paymentMethod = document.getElementById("payment-method").value;
    const promo = document.getElementById("promo-code").value.trim();

    if (!pickup || !dropoff) return;

    const { distance, duration } = fakeDistanceAndDuration();
    const surgeMultiplier = await fetchSurge();
    const fare = calculateFare(parseFloat(distance), duration, rideType, promo, surgeMultiplier);

    if (estCard) {
      estCard.classList.remove("hidden");
      estDistance.textContent = `${distance} km`;
      estDuration.textContent = `${duration} min`;
      estSurge.textContent = `${surgeMultiplier.toFixed(2)}x`;
      estFare.textContent = `$${fare}`;
    }

    try {
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
          payment_method: paymentMethod,
          promo_code: promo || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Ride create failed: " + (err.detail || "Unknown error"));
        return;
      }
      const ride = await res.json();
      saveRideLocal(ride);
      renderHistory();
      if (currentRideEl) {
        currentRideEl.classList.remove("hidden");
        rideStatusLabel.textContent = ride.status;
        rideDriverName.textContent = "Matching driver…";
      }
    } catch (err) {
      console.error(err);
    }
  });

  function saveRideLocal(ride) {
    const history = JSON.parse(localStorage.getItem("swift_rider_history") || "[]");
    history.unshift({
      id: ride.id,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      distance: ride.distance_km || 0,
      duration: ride.duration_min || 0,
      fare: ride.fare || 0,
      status: ride.status,
      created_at: ride.created_at || new Date().toISOString(),
    });
    localStorage.setItem("swift_rider_history", JSON.stringify(history));
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem("swift_rider_history") || "[]");
    historyList.innerHTML = "";
    if (!history.length) {
      historyList.innerHTML = `<li class="ride-item"><span>No rides yet.</span></li>`;
      return;
    }
    history.forEach((ride) => {
      const li = document.createElement("li");
      li.className = "ride-item";
      li.innerHTML = `
        <div>
          <div>${ride.pickup} → ${ride.dropoff}</div>
          <div class="muted">${new Date(ride.created_at).toLocaleString()}</div>
        </div>
        <div style="text-align:right;">
          <div>$${ride.fare.toFixed ? ride.fare.toFixed(2) : ride.fare}</div>
          <div class="muted">${ride.distance} km • ${ride.duration} min</div>
          <div class="muted">Status: ${ride.status}</div>
        </div>
      `;
      historyList.appendChild(li);
    });
  }

  renderHistory();
  refreshWallet();
});
