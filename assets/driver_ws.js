document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) return;
  const user = JSON.parse(userRaw);
  if (user.role !== "driver") return;

  const wsUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.hostname + ":8000";
  const ws = new WebSocket(wsUrl + `/ws/driver/${encodeURIComponent(user.email)}`);

  ws.onopen = () => {
    console.log("Driver WebSocket connected");

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
      if (data.event === "new_request" && window.SwiftRideDriver) {
        window.SwiftRideDriver.addIncomingRequest(data.ride);
      }
    } catch (e) {
      console.error(e);
    }
  };
});
