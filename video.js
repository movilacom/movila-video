document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const vidParam = urlParams.get("vid");
  if (vidParam === null) {
    console.warn("No vid parameter in URL");
    return;
  }
  const vid = parseInt(vidParam, 10);
  if (isNaN(vid)) {
    console.warn("vid parameter not a number:", vidParam);
    return;
  }

  try {
    const res = await fetch("videos.json");
    if (!res.ok) throw new Error("videos.json not found");
    const videos = await res.json();

    // Basic sanity check
    if (!Array.isArray(videos) || videos.length === 0) {
      console.error("videos.json is empty or invalid");
      return;
    }

    const v = videos.find((x) => x.id === vid);
    if (!v) {
      console.error("Video with id", vid, "not found in JSON");
      document.getElementById("video-info").innerHTML = "<p>Video not found.</p>";
      return;
    }

    const player = document.getElementById("main-video");
    const infoDiv = document.getElementById("video-info");
    const recList = document.getElementById("recommended-list");

    player.src = v.src;
    player.load();
    player.play().catch(() => {});

    infoDiv.innerHTML = `<h3>${v.title}</h3><p>${v.desc || ""}</p>`;

    // Recommended
    const others = videos.filter((x) => x.id !== vid);
    const recommended = others.sort(() => 0.5 - Math.random()).slice(0, 5);

    recommended.forEach((rv) => {
      const card = document.createElement("a");
      card.className = "video-card small";
      card.href = `video.html?vid=${rv.id}`;

      const thumb = document.createElement("video");
      thumb.src = rv.src;
      thumb.muted = true;
      thumb.playsInline = true;
      thumb.preload = "metadata";
      thumb.addEventListener("loadeddata", () => {
        try { thumb.currentTime = 0.5; thumb.pause(); } catch(e) {}
      });

      const infoBlock = document.createElement("div");
      infoBlock.className = "video-info";
      infoBlock.innerHTML = `<h4>${rv.title}</h4><p>${rv.desc || ""}</p>`;

      card.appendChild(thumb);
      card.appendChild(infoBlock);

      recList.appendChild(card);
    });

  } catch (err) {
    console.error("Error in video.js:", err);
    const infoDiv = document.getElementById("video-info");
    if (infoDiv) infoDiv.innerHTML = `<p style="color: #f00;">Error loading video.</p>`;
  }
});