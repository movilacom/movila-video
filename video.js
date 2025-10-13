/* video.js — player page logic */

(async function() {
  const VIDEO_JSON = "videos.json";
  const urlParams = new URLSearchParams(window.location.search);
  const vid = parseInt(urlParams.get("vid"), 10);

  const res = await fetch(VIDEO_JSON);
  const videos = await res.json();
  // normalize category
  videos.forEach(v => { if(!v.category) v.category = (v.title + " " + (v.url||"")).toLowerCase(); });

  const player = document.getElementById("main-video");
  const info = document.getElementById("video-info");
  const recList = document.getElementById("recommended-list");

  if (!player || !info || !recList) return;

  if (!Number.isFinite(vid) || !videos[vid]) {
    info.innerHTML = `<p style="color:var(--muted)">Video not found.</p>`;
    return;
  }

  let currentIndex = vid;
  const setVideo = (index) => {
    const v = videos[index];
    if (!v) return;
    // update SEO meta + title
    document.title = `${v.title} | MOVILA Shorts`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", v.desc || "Watch this short on MOVILA.");
    // set src and play
    player.src = v.url;
    player.load();
    player.play().catch(()=>{});
    info.innerHTML = `<h3>${v.title}</h3><p>${v.desc}</p>`;
    // increment view count in localStorage
    const key = `video_views_${v.id}`;
    const prev = parseInt(localStorage.getItem(key) || "0",10);
    localStorage.setItem(key, prev + 1);
    // update URL without reload
    history.replaceState(null, "", `video.html?vid=${v.id}`);
    currentIndex = index;
  };

  // initial set
  setVideo(currentIndex);

  // recommended list (5 random)
  const recommended = videos.filter((_,i) => i !== currentIndex).sort(()=>0.5 - Math.random()).slice(0, 6);
  recommended.forEach((v) => {
    const card = document.createElement("div");
    card.className = "video-card small";
    card.dataset.index = videos.indexOf(v);

    const thumb = document.createElement("video");
    thumb.src = v.url;
    thumb.muted = true;
    thumb.preload = "metadata";
    thumb.playsInline = true;
    thumb.addEventListener("loadeddata", ()=> tryPause(thumb));
    const infoBlock = document.createElement("div");
    infoBlock.className = "video-info";
    infoBlock.innerHTML = `<h4>${v.title}</h4><p>${(v.desc||"").slice(0,70)}</p>`;

    card.appendChild(thumb);
    card.appendChild(infoBlock);
    recList.appendChild(card);

    // click: smooth switch
    card.addEventListener("click", async (e) => {
      const nxtIndex = parseInt(card.dataset.index,10);
      await switchToVideo(nxtIndex, videos);
      // rebuild recommended for new video
      recList.innerHTML = "";
      const nextRec = videos.filter((_,i)=> i !== nxtIndex).sort(()=>0.5-Math.random()).slice(0,6);
      nextRec.forEach(nv => {
        const c = document.createElement("div");
        c.className = "video-card small";
        c.dataset.index = videos.indexOf(nv);
        const t = document.createElement("video");
        t.src = nv.url; t.muted = true; t.preload = "metadata"; t.playsInline = true;
        const ib = document.createElement("div");
        ib.className = "video-info";
        ib.innerHTML = `<h4>${nv.title}</h4><p>${(nv.desc||"").slice(0,70)}</p>`;
        c.appendChild(t); c.appendChild(ib);
        c.addEventListener("click", ()=> switchToVideo(parseInt(c.dataset.index,10), videos));
        recList.appendChild(c);
      });
    });
  });

  /* helper to ensure pause */
  function tryPause(v) { try { v.currentTime = 0.5; v.pause(); } catch(e){} }

  /* switchToVideo: fade out/in with overlay, prefetch & update */
  async function switchToVideo(newIndex, videosArr) {
    const parent = document.querySelector(".player-section");
    if (!parent) return;
    let overlay = document.getElementById("main-switch-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "main-switch-overlay";
      overlay.className = "switch-overlay";
      overlay.textContent = "Loading next...";
      parent.appendChild(overlay);
      parent.style.position = "relative";
    }
    overlay.classList.add("show");
    parent.style.transition = "opacity 260ms cubic-bezier(.2,.9,.3,1)";
    parent.style.opacity = 0.2;
    await new Promise(r=>setTimeout(r, 240));

    // prefetch next
    const nextV = videosArr[newIndex];
    if (!nextV) return;
    const pre = document.createElement("link");
    pre.rel = "prefetch"; pre.href = nextV.url; pre.as = "video";
    document.head.appendChild(pre);
    setTimeout(()=> pre.remove(), 45000);

    player.src = nextV.url;
    player.load();
    player.addEventListener("loadeddata", function onReady() {
      player.removeEventListener("loadeddata", onReady);
      player.play().catch(()=>{});
      document.getElementById("video-info").innerHTML = `<h3>${nextV.title}</h3><p>${nextV.desc}</p>`;
      overlay.classList.remove("show");
      parent.style.opacity = 1;
      history.replaceState(null, "", `video.html?vid=${nextV.id}`);
      // increment view count
      const key = `video_views_${nextV.id}`;
      const prev = parseInt(localStorage.getItem(key) || "0",10);
      localStorage.setItem(key, prev + 1);
    });
  }

})();