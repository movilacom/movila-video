// main.js - final, robust, used by index.html & video.html
const VIDEO_JSON = "videos.json";

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const themeBtns = document.querySelectorAll("#themeToggle");
  if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();
  if (document.getElementById("year2")) document.getElementById("year2").textContent = new Date().getFullYear();

  // theme toggle wiring
  (function wireTheme(){
    themeBtns.forEach(btn => {
      const saved = localStorage.getItem("movila_theme");
      if (saved === "light") { document.body.classList.add("light-theme"); btn.textContent = "☀️"; } else btn.textContent = "🌙";
      btn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        btn.textContent = isLight ? "☀️" : "🌙";
        localStorage.setItem("movila_theme", isLight ? "light" : "dark");
      });
    });
  })();

  // fetch videos.json
  fetch(VIDEO_JSON).then(res => {
    if (!res.ok) throw new Error(`Failed to load ${VIDEO_JSON} (status ${res.status})`);
    return res.json();
  }).then(raw => {
    // normalize entries: ensure id & src fields exist
    const allVideos = Array.isArray(raw) ? raw.map((v,i)=>({
      id: typeof v.id !== 'undefined' ? v.id : i,
      title: v.title || `Video ${i+1}`,
      src: v.src || v.url || v.video || "",
      desc: v.desc || "",
      category: v.category || detectCategory(v.title || "", v.src || "")
    })) : [];

    if (loader) setTimeout(()=> loader.classList.add("hidden"), 350);

    // init pages
    if (document.getElementById("video-list")) initIndex(allVideos);
    if (document.getElementById("main-video")) initVideoPage(allVideos);
  }).catch(err => {
    console.error(err);
    if (loader) loader.classList.add("hidden");
    const list = document.getElementById("video-list");
    if (list) list.innerHTML = `<p style="padding:20px;color:var(--muted)">Failed to load videos.json — check path & DevTools console.</p>`;
  });

  /* helpers */
  function detectCategory(title="", src=""){
    const t = (title + " " + src).toLowerCase();
    if (t.match(/\b(cat|dog|pet|horse|pig|pup)\b/)) return "pets";
    if (t.match(/\b(dance|music|song|beat|afro|rhythm)\b/)) return "music";
    if (t.match(/\b(love|couple|baby|reunited|relationship)\b/)) return "couple";
    if (t.match(/\b(fun|lol|funny|caught|comedy|haha)\b/)) return "fun";
    if (t.match(/\b(style|fit|retwist|fashion|look)\b/)) return "style";
    if (t.match(/\b(kitchen|fire|view|parking)\b/)) return "random";
    return "random";
  }

  /* INDEX page logic */
  function initIndex(allVideos){
    const list = document.getElementById("video-list");
    const search = document.getElementById("search");
    const category = document.getElementById("category");
    if (!list) return;

    // build categories
    const cats = ["all", ...Array.from(new Set(allVideos.map(v=>v.category)))];
    if (category) category.innerHTML = cats.map(c=>`<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join("");

    // initial feed (shuffled)
    let feed = allVideos.slice().sort(()=>0.5 - Math.random());

    // inject daily short
    injectDailyShort(feed);

    // render function (skeleton + cards)
    async function render(videosToShow) {
      list.innerHTML = Array.from({length:6}).map(()=>`<div class="video-card skeleton-card"><div class="skeleton"></div><div style="padding:12px;"><div style="height:14px;width:60%;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:8px;"></div><div style="height:10px;width:40%;background:rgba(255,255,255,0.02);border-radius:6px;"></div></div></div>`).join("");
      await new Promise(r=>setTimeout(r,80));
      list.innerHTML = "";
      videosToShow.forEach(v => {
        const a = document.createElement("a");
        a.className = "video-card";
        a.href = `video.html?vid=${encodeURIComponent(v.id)}`;
        a.innerHTML = `<div class="video-wrapper"><video src="${v.src}" muted preload="metadata" playsinline crossorigin="anonymous"></video></div><div class="video-info"><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml((v.desc||"").slice(0,80))}</p></div>`;
        // hover preview
        const vidEl = a.querySelector("video");
        let hoverTimer;
        a.addEventListener("mouseenter", ()=>{ hoverTimer = setTimeout(()=>{ try{ vidEl.play(); }catch{} }, 220); });
        a.addEventListener("mouseleave", ()=>{ clearTimeout(hoverTimer); try{ vidEl.pause(); vidEl.currentTime=0.5 }catch{} });
        list.appendChild(a);
      });
    }

    render(feed);

    // search filter
    search?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      const filtered = feed.filter(v => v.title.toLowerCase().includes(q) || (v.desc||"").toLowerCase().includes(q));
      render(filtered);
    });

    // category filter
    category?.addEventListener("change", e => {
      const cat = e.target.value;
      const filtered = cat === "all" ? feed : feed.filter(v => v.category === cat);
      render(filtered);
    });

    // infinite append (append shuffled more when near bottom)
    let loadingMore = false;
    window.addEventListener("scroll", () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 220 && !loadingMore) {
        loadingMore = true;
        const more = allVideos.slice().sort(()=>0.5 - Math.random()).slice(0,12);
        feed = feed.concat(more);
        render(feed);
        setTimeout(()=> loadingMore = false, 800);
      }
    });
  }

  function injectDailyShort(allVideos){
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem("movila_daily_date");
      if (stored !== today) {
        const idx = Math.floor(Math.random() * Math.max(1, allVideos.length));
        localStorage.setItem("movila_daily_index", idx);
        localStorage.setItem("movila_daily_date", today);
      }
      const idx = parseInt(localStorage.getItem("movila_daily_index")||"0",10);
      const daily = allVideos[idx] || allVideos[0];
      if (!daily) return;
      const section = document.createElement("section");
      section.className = "daily-short";
      section.innerHTML = `<h2>🎥 Today's Short</h2><video src="${daily.src}" autoplay muted loop playsinline crossorigin="anonymous"></video><h3>${escapeHtml(daily.title)}</h3><p>${escapeHtml(daily.desc||"")}</p>`;
      const main = document.getElementById("main-content");
      if (main) main.prepend(section);
    } catch (e) { console.warn(e); }
  }

  /* VIDEO page logic */
  function initVideoPage(allVideos){
    const params = new URLSearchParams(window.location.search);
    const vidParam = params.get("vid");
    const player = document.getElementById("main-video");
    const source = document.getElementById("main-source");
    const info = document.getElementById("video-info");
    const recList = document.getElementById("recommended-list");
    if (!player || !source || !info || !recList) return;

    const id = isNaN(Number(vidParam)) ? vidParam : Number(vidParam);
    const video = allVideos.find(v => String(v.id) === String(id) || allVideos.indexOf(v) === id);

    if (!video) {
      info.innerHTML = `<p style="color:var(--muted)">Video not found.</p>`;
      return;
    }

    // set source and player
    source.src = video.src;
    player.load();
    // try autoplay if muted — if blocked, user will click
    player.muted = false; // not forcing muted to respect UX; autoplay may be blocked
    player.play().catch(err => {
      // If autoplay blocked, try muted autoplay as hint (but keep not forcibly muted)
      console.warn("Autoplay blocked; waiting for user action.", err);
    });

    info.innerHTML = `<h3>${escapeHtml(video.title)}</h3><p>${escapeHtml(video.desc||"")}</p>`;

    // increment local view count
    try {
      const key = `video_views_${video.id}`;
      const prev = parseInt(localStorage.getItem(key) || "0", 10);
      localStorage.setItem(key, prev + 1);
    } catch (e) {}

    // build recommended
    const recommended = allVideos.filter(v => v.id !== video.id).sort(()=>0.5 - Math.random()).slice(0,6);
    recList.innerHTML = "";
    recommended.forEach(v => {
      const div = document.createElement("div");
      div.className = "video-card small";
      div.innerHTML = `<video src="${v.src}" muted preload="metadata" playsinline crossorigin="anonymous"></video><div class="video-info"><h4>${escapeHtml(v.title)}</h4><p>${escapeHtml((v.desc||"").slice(0,70))}</p></div>`;
      div.addEventListener("click", () => {
        // smooth swap
        switchToVideo(v, allVideos);
      });
      recList.appendChild(div);
    });
  }

  function switchToVideo(nextVideo, allVideos) {
    const player = document.getElementById("main-video");
    const source = document.getElementById("main-source");
    const info = document.getElementById("video-info");
    const parent = document.querySelector(".player-section");
    if (!player || !source || !info) return;
    if (parent) parent.style.opacity = 0.25;
    // prefetch hint
    const pre = document.createElement("link"); pre.rel = "prefetch"; pre.href = nextVideo.src; pre.as = "video"; document.head.appendChild(pre);
    setTimeout(()=> pre.remove(), 35000);
    setTimeout(()=> {
      source.src = nextVideo.src;
      player.load();
      player.play().catch(()=>{});
      info.innerHTML = `<h3>${escapeHtml(nextVideo.title)}</h3><p>${escapeHtml(nextVideo.desc||"")}</p>`;
      history.replaceState(null, "", `video.html?vid=${encodeURIComponent(nextVideo.id)}`);
      // increment
      try {
        const key = `video_views_${nextVideo.id}`;
        const prev = parseInt(localStorage.getItem(key) || "0",10);
        localStorage.setItem(key, prev + 1);
      } catch(e) {}
      if (parent) parent.style.opacity = 1;
      // rebuild recommended list
      const recListEl = document.getElementById("recommended-list");
      if (recListEl) {
        const rec = allVideos.filter(v => v.id !== nextVideo.id).sort(()=>0.5 - Math.random()).slice(0,6);
        recListEl.innerHTML = "";
        rec.forEach(v => {
          const c = document.createElement("div");
          c.className = "video-card small";
          c.innerHTML = `<video src="${v.src}" muted preload="metadata" playsinline crossorigin="anonymous"></video><div class="video-info"><h4>${escapeHtml(v.title)}</h4><p>${escapeHtml((v.desc||"").slice(0,70))}</p></div>`;
          c.addEventListener("click", ()=> switchToVideo(v, allVideos));
          recListEl.appendChild(c);
        });
      }
    }, 260);
  }

  function escapeHtml(s=""){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
});