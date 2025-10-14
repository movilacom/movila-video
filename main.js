/* ===============================
   MOVILA MAIN SCRIPT
   =============================== */

// Loader animation
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => loader.classList.add("hidden"), 500);
});

// Footer year
document.getElementById("year2").textContent = new Date().getFullYear();

// Theme toggle
const toggle = document.getElementById("themeToggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    toggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });
}

// Fetch and display videos
async function loadVideos() {
  try {
    const response = await fetch("videos.json");
    const videos = await response.json();
    const grid = document.querySelector(".video-grid");
    if (!grid) return;

    grid.innerHTML = "";

    videos.forEach((vid, index) => {
      const card = document.createElement("div");
      card.className = "video-card";
      card.innerHTML = `
        <img src="https://imgproxy.movila.workers.dev/api/thumbnail?url=${encodeURIComponent(vid.url)}" alt="${vid.title}">
        <div class="video-info">
          <h3>${vid.title}</h3>
          <p>${vid.description}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        window.location.href = `video.html?vid=${index}`;
      });
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading videos:", error);
  }
}

loadVideos();