document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const video = document.getElementById("mainVideo");
  const info = document.getElementById("videoInfo");
  const recList = document.getElementById("recommendedList");
  const year2 = document.getElementById("year2");

  year2.textContent = new Date().getFullYear();

  const params = new URLSearchParams(window.location.search);
  const vid = params.get("vid");

  // Load video data
  fetch("videos.json")
    .then(res => res.json())
    .then(data => {
      const all = data.videos;
      const current = all.find(v => v.id == vid);
      if (!current) {
        info.textContent = "Video not found.";
        return;
      }

      // Set main video
      video.src = current.url;
      info.innerHTML = `<h3>${current.title}</h3><p>${current.desc || ""}</p>`;

      // Hide loader after short delay
      setTimeout(() => loader.classList.add("hide"), 400);

      // Recommended (exclude current)
      const recs = all.filter(v => v.id != vid).slice(0, 8);
      recs.forEach(v => {
        const item = document.createElement("div");
        item.className = "video-card";
        item.innerHTML = `
          <a href="video.html?vid=${v.id}" class="video-link">
            <div class="thumb"><video src="${v.url}" muted preload="metadata"></video></div>
            <h3>${v.title}</h3>
          </a>
        `;
        recList.appendChild(item);
      });
    })
    .catch(err => {
      console.error("Error loading videos.json:", err);
      info.textContent = "Error loading video.";
    });
});