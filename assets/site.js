const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const menuClose = document.getElementById("menuClose");

menuToggle.addEventListener("click", () => {
    mobileNav.classList.add("open");
});

menuClose.addEventListener("click", () => {
    mobileNav.classList.remove("open");
});
