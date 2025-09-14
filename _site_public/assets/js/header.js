document.addEventListener("DOMContentLoaded", function() {
  const hamburger = document.querySelector(".hamburger");
  const drawerMenu = document.querySelector(".drawer-menu");

  if (hamburger && drawerMenu) {
    hamburger.addEventListener("click", function() {
      hamburger.classList.toggle("is-active");
      drawerMenu.classList.toggle("open");
    });
  }
});