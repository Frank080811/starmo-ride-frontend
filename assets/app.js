document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const authModal = document.getElementById("auth-modal");
  const btnLoginOpen = document.getElementById("btn-login-open");
  const btnSignupOpen = document.getElementById("btn-signup-open");
  const btnModalClose = document.getElementById("btn-modal-close");
  const btnSwitchSignup = document.getElementById("btn-switch-signup");
  const authTitle = document.getElementById("auth-title");
  const authForm = document.getElementById("auth-form");
  const authSwitchText = document.getElementById("auth-switch-text");
  const tabs = document.querySelectorAll(".tab");
  const btnGetRide = document.getElementById("btn-get-ride");
  const btnBecomeDriver = document.getElementById("btn-become-driver");
  const mobileMenuBtn = document.getElementById("btn-mobile-menu");
  const mobileNav = document.getElementById("mobile-nav");

  let isLogin = true;
  let selectedRole = "rider";

  function openModal(mode) {
    isLogin = mode === "login";
    authTitle.textContent = isLogin ? "Log in" : "Sign up";
    btnSwitchSignup.textContent = isLogin ? "Sign up" : "Log in";
    authSwitchText.firstChild.textContent = isLogin
      ? "Don’t have an account? "
      : "Already have an account? ";
    authModal.classList.remove("hidden");
  }

  function closeModal() {
    authModal.classList.add("hidden");
  }

  btnLoginOpen?.addEventListener("click", () => openModal("login"));
  btnSignupOpen?.addEventListener("click", () => openModal("signup"));
  btnModalClose?.addEventListener("click", closeModal);

  btnSwitchSignup?.addEventListener("click", () => {
    openModal(isLogin ? "signup" : "login");
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      selectedRole = tab.dataset.role;
    });
  });

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    if (!email || !password) return;

    const baseURL = "https://sharmo-riding-app.onrender.com";


    try {
      if (!isLogin) {
        await fetch(baseUrl + "/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            full_name: email.split("@")[0],
            password,
            role: selectedRole
          }),
        });
      }

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const tokenRes = await fetch(baseUrl + "/auth/token", {
        method: "POST",
        body: formData,
      });

      if (!tokenRes.ok) {
        alert("Login failed");
        return;
      }

      const tokenData = await tokenRes.json();
      const user = { email, role: selectedRole, token: tokenData.access_token };
      localStorage.setItem("swift_user", JSON.stringify(user));

      if (selectedRole === "rider") {
        window.location.href = "rider_dashboard.html";
      } else if (selectedRole === "driver") {
        window.location.href = "driver_dashboard.html";
      } else {
        window.location.href = "admin_dashboard.html";
      }
    } catch (err) {
      console.error(err);
      alert("Connection error to backend");
    }
  });

  btnGetRide?.addEventListener("click", () => {
    selectedRole = "rider";
    openModal("signup");
  });

  btnBecomeDriver?.addEventListener("click", () => {
    selectedRole = "driver";
    openModal("signup");
  });

  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeModal();
  });

  mobileMenuBtn?.addEventListener("click", () => {
    mobileNav.classList.toggle("hidden");
  });
});
