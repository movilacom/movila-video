/* ===============================
   MOVILA VIDEO PLAYER SCRIPT
   =============================== */

// Ambil parameter ID video dari URL
function getVideoId() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("vid")) || 0;
}

// Load video utama + rekomendasi
async function loadVideoPage() {
  const videoElement = document.getElementById("main-video");
  const sourceElement = document.getElementById("main-source");
  const infoElement = document.getElementById("video-info");
  const recommendedList = document.getElementById("recommended-list");

  try {
    const response = await fetch("videos.json");
    const videos = await response.json();
    const vid = getVideoId();

    if (!videos[vid]) {
      infoElement.innerHTML = "<p>Video not found.</p>";
      return;
    }

    // Data video utama
    const currentVideo = videos[vid];
    sourceElement.src = currentVideo.url;
    videoElement.load();

    // Info video
    infoElement.innerHTML = `
      <h2>${currentVideo.title}</h2>
      <p>${currentVideo.description}</p>
    `;

    // Rekomendasi video
    recommendedList.innerHTML = "";
    videos.forEach((v, i) => {
      if (i !== vid) {
        const card = document.createElement("div");
        card.className = "rec-card";
        card.innerHTML = `
          <video src="${v.url}" muted playsinline></video>
          <h4>${v.title}</h4>
        `;
        card.addEventListener("click", () => {
          window.location.href = `video.html?vid=${i}`;
        });
        recommendedList.appendChild(card);
      }
    });

  } catch (err) {
    console.error("Failed to load video page:", err);
    infoElement.innerHTML = "<p>Error loading video.</p>";
  }
}

// Jalankan setelah halaman siap
document.addEventListener("DOMContentLoaded", loadVideoPage);