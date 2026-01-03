"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // --- 1. Menu Interaction Setup ---
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  // Toggle menu on click
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent click from bubbling to document
      toggleMenu();
    });
  }

  // Close menu when clicking anywhere else on the page
  document.addEventListener("click", function () {
    closeMenu();
  });

  // Prevent closing when clicking inside the menu itself
  if (dropdownMenu) {
    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Helper Functions
  function toggleMenu() {
    const isHidden = dropdownMenu.classList.contains("hidden");
    if (isHidden) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function openMenu() {
    dropdownMenu.classList.remove("hidden");
    if (dropdownIcon) dropdownIcon.style.transform = "rotate(180deg)";
  }

  function closeMenu() {
    dropdownMenu.classList.add("hidden");
    if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
  }

  // --- 2. Email Copy Functionality ---
  setupEmailCopy();
});

// --- Global Helper Functions ---

// Scroll to section (called by HTML onclick attributes)
window.scrollToSection = function (sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  // Close menu after clicking a link
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");
  if (dropdownMenu) dropdownMenu.classList.add("hidden");
  if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
};

// Email copy functionality
function setupEmailCopy() {
  const emailLinks = document.querySelectorAll(
    ".email-link, [data-copy-email]"
  );

  emailLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const email = this.getAttribute("data-email") || this.textContent.trim();

      navigator.clipboard
        .writeText(email)
        .then(() => {
          const originalText = this.textContent;
          const originalBg = this.style.backgroundColor;

          this.textContent = "✓ Copied!";
          this.style.backgroundColor = "rgba(139, 120, 109, 0.3)";

          setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = originalBg;
          }, 2000);
        })
        .catch((err) => console.error("Copy failed:", err));
    });
  });
}
