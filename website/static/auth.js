const passwordToggle = document.querySelector("#password-visible");
const passwordInput = document.querySelector("#password");
const confirmPasswordInput = document.querySelector("#confirm-password");

passwordToggle.addEventListener("click", () => {
    if (passwordToggle.classList.contains("bi-eye-slash")) {
        passwordToggle.setAttribute("class", "bi bi-eye");
        passwordInput.setAttribute("type", "text");
        if (confirmPasswordInput) {
            confirmPasswordInput.setAttribute("type", "text");
        }
    }
    else {
        passwordToggle.setAttribute("class", "bi bi-eye-slash");
        passwordInput.setAttribute("type", "password");
        if (confirmPasswordInput) {
            confirmPasswordInput.setAttribute("type", "password");
        }
    }
});