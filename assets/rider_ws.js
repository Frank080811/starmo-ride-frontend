document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) return;

  const user = JSON.parse(userRaw);
  if (user.role !== "rider") return;

  const rideStatusLabel = document.getElementById("ride-status-label");
  const rideDriverName = document.getElementById("ride-driver-name");
  const currentRideEl = document.getElementById("current-ride");

  // 🔥 Updated WebSocket URL for Render deployment
  const wsUrl = "wss://sharmo-riding-app.onrender.com";

  const ws = new WebSocket(
    `${wsUrl}/ws/rider/${encodeURIComponent(user.email)}`
  );

  ws.onopen = () => {
    console.log("Rider WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.event === "ride_status") {
        if (currentRideEl) currentRideEl.classList.remove("hidden");
        if (rideStatusLabel) rideStatusLabel.textContent = data.status;

        if (rideDriverName && data.driver_name) {
          rideDriverName.textContent = data.driver_name;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  ws.onclose = () => {
    console.warn("Rider WebSocket closed");
  };
});
