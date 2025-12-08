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

  const baseUrl = "http://localhost:8000";

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
      document.getElementById("admin-revenue").textContent = "$" + data.revenue_24h.toFixed(2);
      document.getElementById("admin-drivers").textContent = data.active_drivers;

      const trace = {
        x: data.hourly_hours,
        y: data.hourly_counts,
        type: "bar",
      };
      Plotly.newPlot("admin-rides-chart", [trace], {
        margin: { t: 20, l: 30, r: 10, b: 30 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
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
      const zones = Object.keys(data.heat);
      const counts = Object.values(data.heat);

      Plotly.newPlot("heatmap", [
        {
          z: [counts],
          x: zones,
          y: ["zones"],
          type: "heatmap",
        },
      ], {
        margin: { t: 20, l: 30, r: 10, b: 30 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
      });

      document.getElementById("current-surge").textContent = data.surge.toFixed(2) + "x";
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
      const list = document.getElementById("admin-user-list");
      list.innerHTML = "";
      data.forEach((u) => {
        const li = document.createElement("li");
        li.className = "ride-item";
        li.innerHTML = `
          <div>
            <div>${u.full_name || u.email}</div>
            <div class="muted">${u.email}</div>
          </div>
          <div style="text-align:right;">
            <div>${u.role}</div>
            <div class="muted">Rating: ${u.rating?.toFixed ? u.rating.toFixed(1) : u.rating}</div>
          </div>
        `;
        list.appendChild(li);
      });
    } catch (e) {
      console.error(e);
    }
  }

  loadOverview();
  loadHeatmap();
  loadUsers();
});
