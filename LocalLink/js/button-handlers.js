document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent normal form submission

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Save username to sessionStorage or show UI feedback
        document.getElementById("loginModal").classList.add("d-none");
        loginError.textContent = "";
        alert("Login successful! Welcome, " + result.username);

        // Optionally update UI
        document.getElementById("usernameDisplay").innerText = result.username;
        document.getElementById("loggedInUserDisplay").classList.remove("d-none");
        document.getElementById("loginButtonContainer").classList.add("d-none");
        document.getElementById("signupButtonContainer").classList.add("d-none");
        document.getElementById("logoutButtonContainer").classList.remove("d-none");

      } else {
        loginError.textContent = result.message;
      }
    } catch (error) {
      console.error("Login error:", error);
      loginError.textContent = "Something went wrong. Try again.";
    }
  });
});
