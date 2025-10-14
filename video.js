// video.js - player page logic with fallback
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const vidParam = params.get("vid");
  const player = document.getElementById("main-video");
  const source = document.getElementById("main-source");
  const info = document.getElementById("video-info");
  const recList = document.getElementById("recommended-list");
  const errorBox = document.getElementById("video-error");
  if (document.getElementById("year2")) document.getElementById("year2").textContent = new Date().getFullYear();

  // load videos.json
  fetch("videos.json").then(r => {
    if (!r.ok) throw new Error("videos.json not found");
    return r.json();
  }).then(data => {
    const all = Array.isArray(data) ? data : [];
    const id = isNaN(Number(vidParam)) ? vidParam : Number(vidParam);
    const video = all.find(v => String(v.id) === String(id) || all.indexOf(v) === id);

    if (!video) {
      if (info) info.innerHTML = `<p style="color:#bbb">Video not found.</p>`;
      return;
    }

    info.innerHTML = `<h3>${escapeHtml(video.title)}</h3><p>${escapeHtml(video.desc||"")}</p>`;
    // try to load normally, fallback to blob if metadata fail or error
    tryLoadVideo(video.src);

    // recommended
    const recommended = all.filter(v => v.id !== video.id).sort(()=>0.5 - Math.random()).slice(0,6);
    recList.innerHTML = "";
    recommended.forEach(v => {
      const div = document.createElement("div");
      div.className = "video-card small";
      div.innerHTML = `<video src="${v.src}" muted preload="metadata" playsinline crossorigin="anonymous"></video><div class="video-info"><h4>${escapeHtml(v.title)}</h4><p>${escapeHtml((v.desc||"").slice(0,70))}</p></div>`;
      div.addEventListener("click", ()=> switchToVideo(v, all));
      recList.appendChild(div);
    });
  }).catch(err => {
    console.error(err);
    if (info) info.innerHTML = `<p style="color:#bbb">Failed to load videos.json — check path.</p>`;
  });

  async function tryLoadVideo(url) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
    // clear any previous blob url
    try { if (player && player.src && player.src.startsWith("blob:")) URL.revokeObjectURL(player.src); } catch(e){}

    // set normal source first
    source.src = url;
    player.load();
    player.play().catch(()=>{ /* autoplay may be blocked */ });

    // wait for metadata or error
    const metaLoaded = await new Promise(resolve => {
      let resolved = false;
      const onMeta = () => { if (!resolved){ resolved = true; cleanup(); resolve(true); } };
      const onErr = () => { if (!resolved){ resolved = true; cleanup(); resolve(false); } };
      function cleanup(){ player.removeEventListener("loadedmetadata", onMeta); player.removeEventListener("error", onErr); }
      player.addEventListener("loadedmetadata", onMeta);
      player.addEventListener("error", onErr);
      // timeout
      setTimeout(()=> { if (!resolved) { resolved = true; cleanup(); resolve(false); } }, 5000);
    });

    if (metaLoaded) {
      console.log("metadata loaded with native source");
      return true;
    }

    // fallback: fetch as blob (full download)
    try {
      console.warn("Native load failed. Trying fetch-as-blob fallback for:", url);
      errorBox.style.display = "block";
      errorBox.textContent = "Loading video via fallback (may take a while)...";

      const resp = await fetch(url, { method: "GET", mode: "cors" });
      if (!resp.ok) throw new Error("Fetch failed: " + resp.status);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      source.src = blobUrl;
      player.load();
      await player.play().catch(()=>{ /* if autoplay blocked */ });
      errorBox.style.display = "none";
      console.log("Fallback blob playing.");
      return true;
    } catch (err) {
      console.error("Fallback fetch failed:", err);
      errorBox.style.display = "block";
      errorBox.textContent = "Unable to load video from source (CDN may block requests). See console for details.";
      return false;
    }
  }

  function switchToVideo(next, all) {
    // smooth swap without reload
    tryLoadVideo(next.src);
    const infoEl = document.getElementById("video-info");
    if (infoEl) infoEl.innerHTML = `<h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.desc||"")}</p>`;
    history.replaceState(null, "", `video.html?vid=${encodeURIComponent(next.id)}`);
    // rebuild recommended quickly (optional)
  }

  function escapeHtml(s=""){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
});