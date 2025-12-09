document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) return;

  const user = JSON.parse(userRaw);
  if (user.role !== "driver") return;

  // 🔥 Updated WebSocket backend URL for Render deployment
  const wsUrl = "wss://sharmo-riding-app.onrender.com";

  const ws = new WebSocket(
    `${wsUrl}/ws/driver/${encodeURIComponent(user.email)}`
  );

  ws.onopen = () => {
    console.log("Driver WebSocket connected");

    // Fake GPS updates every 5 seconds (demo mode)
    setInterval(() => {
      const fakeLat = 5.6 + Math.random() * 0.01;
      const fakeLng = -0.18 + Math.random() * 0.01;

      ws.send(
        JSON.stringify({
          lat: fakeLat,
          lng: fakeLng,
          status: "online",
        })
      );
    }, 5000);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Incoming ride request
      if (data.event === "new_request" && window.SwiftRideDriver) {
        window.SwiftRideDriver.addIncomingRequest(data.ride);
      }
    } catch (e) {
      console.error(e);
    }
  };

  ws.onerror = (err) => {
    console.error("Driver WebSocket error:", err);
  };

  ws.onclose = () => {
    console.warn("Driver WebSocket closed");
  };
});
