// frontend/assets/js/admin.js
document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("swift_user");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userRaw);
  if (user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  const baseUrl = "https://sharmo-riding-app.onrender.com";
  const CURRENCY = "GH₵";

  const links = document.querySelectorAll(".sidebar-link");
  const panels = {
    overview: document.getElementById("admin-overview"),
    heatmap: document.getElementById("admin-heatmap"),
    users: document.getElementById("admin-users"),
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

  async function loadOverview() {
    try {
      const res = await fetch(baseUrl + "/admin/overview", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();

      document.getElementById("admin-rides").textContent = data.rides_24h;
      document.getElementById("admin-revenue").textContent =
        CURRENCY + (data.revenue_24h || 0).toFixed(2);
      document.getElementById("admin-drivers").textContent = data.active_drivers;

      const trace = {
        x: data.hourly_hours,
        y: data.hourly_counts,
        type: "bar",
        marker: { opacity: 0.9 },
      };

      Plotly.newPlot("admin-rides-chart", [trace], {
        margin: { t: 20, l: 30, r: 10, b: 30 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { title: "Hour" },
        yaxis: { title: "Rides (last 24h)" },
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function loadHeatmap() {
    try {
      const res = await fetch(baseUrl + "/admin/heatmap", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();

      const zones = Object.keys(data.heat || {});
      const counts = Object.values(data.heat || {});

      Plotly.newPlot("heatmap", [
        {
          z: [counts],
          x: zones,
          y: ["Zones"],
          type: "heatmap",
          showscale: true,
        },
      ], {
        margin: { t: 20, l: 30, r: 10, b: 60 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { tickangle: -45 },
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch(baseUrl + "/admin/users", {
        headers: { Authorization: "Bearer " + user.token },
      });
      if (!res.ok) return;
      const data = await res.json();

      const tbody = document.getElementById("admin-users-tbody");
      tbody.innerHTML = "";

      data.forEach((u) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>${new Date(u.created_at).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Initial load
  loadOverview();
  loadHeatmap();
  loadUsers();
});
