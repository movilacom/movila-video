/* main.js — MOVILA Video Engine (Integrated, v1.2) */

const BASE = ""; // if hosted under movila-video/ folder, keep empty
const VIDEO_JSON = "videos.json";

let allVideos = [];
const perLoad = 12;
let loadedCount = 0;

const list = document.getElementById("video-list");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const yearEl = document.getElementById("year");

if (yearEl) yearEl.textContent = new Date().getFullYear();
const year2 = document.getElementById("year2");
if (year2) year2.textContent = new Date().getFullYear();

/* Loader hide */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) setTimeout(()=> loader.classList.add("hidden"), 700);
});

/* utility: detect category from title/url */
function detectCategory(title = "", url = "") {
  const text = (title + " " + url).toLowerCase();
  if (text.match(/\b(cat|kitten|pet|pets|animal|cute)\b/)) return "animals";
  if (text.match(/\b(car|drift|race|motorsport|drive)\b/)) return "cars";
  if (text.match(/\b(dance|music|song|beat|dj)\b/)) return "music";
  if (text.match(/\b(funny|comedy|lol|fail|fails)\b/)) return "funny";
  if (text.match(/\b(sport|skate|parkour|basket|football|soccer)\b/)) return "sports";
  if (text.match(/\b(viral|trend|trending|short)\b/)) return "viral";
  return "other";
}

/* trending rank util (top 10) */
function getTrendingRank(id) {
  if (!allVideos.length) return null;
  const ranked = allVideos.map(v => {
    const views = parseInt(localStorage.getItem(`video_views_${v.id}`) || "0", 10);
    return {...v, views};
  }).sort((a,b) => b.views - a.views).slice(0, 10);
  const idx = ranked.findIndex(r => r.id === id);
  return idx >= 0 ? idx+1 : null;
}

/* Render with polish: skeleton, hover preview, prefetch */
async function renderWithPolish(videosToShow) {
  if (!list) return;
  // skeleton
  list.innerHTML = Array.from({length:6}).map(()=>`
    <div class="video-card skeleton-card">
      <div class="skeleton"></div>
      <div style="padding:12px;">
        <div style="height:14px;width:60%;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:8px;"></div>
        <div style="height:10px;width:40%;background:rgba(255,255,255,0.02);border-radius:6px;"></div>
      </div>
    </div>
  `).join("");
  await new Promise(r=>setTimeout(r,80));

  list.innerHTML = "";
  videosToShow.forEach((v, i) => {
    const card = document.createElement("a");
    card.className = "video-card fade-in";
    card.href = `video.html?vid=${v.id}`;

    // wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    // thumbnail video element
    const thumb = document.createElement("video");
    thumb.src = v.url;
    thumb.muted = true;
    thumb.playsInline = true;
    thumb.preload = "metadata";
    thumb.className = "preview-solo";
    thumb.setAttribute("aria-hidden","true");

    // ensure frame ready and paused
    thumb.addEventListener("loadeddata", () => {
      try { thumb.currentTime = 0.5; } catch(e){}
      thumb.pause();
    });
    thumb.addEventListener("error", ()=> thumb.style.background = "#111");

    // overlay + badge
    const overlay = document.createElement("div");
    overlay.className = "switch-overlay";
    overlay.textContent = "Loading...";

    const rank = getTrendingRank(v.id);
    if (rank) {
      const badge = document.createElement("div");
      badge.className = "trending-badge";
      badge.innerText = `🔥 #${rank}`;
      wrapper.appendChild(badge);
    }

    wrapper.appendChild(thumb);
    wrapper.appendChild(overlay);

    const info = document.createElement("div");
    info.className = "video-info";
    info.innerHTML = `<h3>${v.title}</h3><p>${(v.desc||"").slice(0,80)}</p>`;

    card.appendChild(wrapper);
    card.appendChild(info);

    // hover preview
    let hoverTimer = null;
    card.addEventListener("mouseenter", ()=> {
      hoverTimer = setTimeout(()=> { try{ thumb.play(); }catch(e){} }, 220);
    });
    card.addEventListener("mouseleave", ()=> {
      clearTimeout(hoverTimer);
      try{ thumb.pause(); thumb.currentTime = 0.5; }catch(e){}
    });

    // prefetch on mousedown/click
    card.addEventListener("mousedown", ()=> {
      const pre = document.createElement("link");
      pre.rel = "prefetch"; pre.href = v.url; pre.as = "video";
      document.head.appendChild(pre);
      setTimeout(()=> pre.remove(), 60000);
      overlay.classList.add("show");
    });

    list.appendChild(card);
  });
}

/* initial load: fetch videos.json */
async function init() {
  try {
    const res = await fetch(VIDEO_JSON);
    const videos = await res.json();

    // normalize add category if missing
    allVideos = videos.map(v => ({
      ...v,
      category: v.category || detectCategory(v.title, v.url)
    }));

    // build categories dropdown (unique)
    const categories = ["all", ...Array.from(new Set(allVideos.map(v=>v.category)))];
    if (categorySelect) {
      categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join("");
    }

    // shuffle initially for dynamic feed, then load first batch
    allVideos = allVideos.sort(()=>0.5 - Math.random());
    loadedCount = 0;
    loadMoreVideos();

    // daily short
    injectDailyShort();

    // trending button
    addTrendingButton();

    // wire search & category events
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        const q = e.target.value.toLowerCase();
        const filtered = allVideos.filter(v => v.title.toLowerCase().includes(q) || (v.desc||"").toLowerCase().includes(q));
        // reset loadedCount and render filtered
        loadedCount = filtered.length; // so loadMore won't append more mistakenly
        renderWithPolish(filtered);
      });
    }

    categorySelect?.addEventListener("change",(e) => {
      const cat = e.target.value;
      const filtered = cat === "all" ? allVideos : allVideos.filter(v => v.category === cat);
      loadedCount = filtered.length;
      renderWithPolish(filtered);
    });

    // infinite scroll
    window.addEventListener("scroll", () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 220) {
        loadMoreVideos();
      }
    });

    // keyboard play/pause
    window.addEventListener("keydown", (ev)=> {
      if (ev.code === "Space" && document.activeElement.tagName !== "INPUT") {
        const player = document.querySelector("#main-video");
        if (player) { ev.preventDefault(); player.paused ? player.play() : player.pause(); }
      }
    });

    // theme toggle wiring (might exist twice on pages)
    wireThemeToggle();

  } catch (err) {
    console.error("Failed to load videos.json", err);
    if (list) list.innerHTML = `<p style="padding:20px;color:var(--muted)">Failed to load videos. Check videos.json path & CORS.</p>`;
  }
}

/* load more (infinite scroll) */
function loadMoreVideos() {
  if (!allVideos || !list) return;
  const next = allVideos.slice(loadedCount, loadedCount + perLoad);
  if (!next.length) return;
  // append using renderWithPolish for just the new items
  // for simplicity: accumulate a visible array
  const visible = Array.from(list.querySelectorAll(".video-card")).map(n => {
    const title = n.querySelector("h3")?.innerText || "";
    return allVideos.find(v => v.title === title);
  }).filter(Boolean);
  const combined = visible.concat(next);
  loadedCount += perLoad;
  renderWithPolish(combined);
}

/* trending button */
function addTrendingButton() {
  const header = document.querySelector(".header-inner");
  if (!header) return;
  // avoid duplicate
  if (document.querySelector(".trending-btn")) return;
  const btn = document.createElement("button");
  btn.className = "trending-btn";
  btn.textContent = "🔥 Trending Short";
  btn.style.marginLeft = "12px";
  btn.addEventListener("click", ()=> {
    const ranked = allVideos.map(v => ({...v, views: parseInt(localStorage.getItem(`video_views_${v.id}`) || "0",10)}))
      .sort((a,b)=>b.views - a.views).slice(0, 10);
    renderWithPolish(ranked);
  });
  header.appendChild(btn);
}

/* daily short injection */
function injectDailyShort() {
  try {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("movila_daily_date");
    if (stored !== today) {
      const randomIdx = Math.floor(Math.random() * allVideos.length);
      localStorage.setItem("movila_daily_index", randomIdx);
      localStorage.setItem("movila_daily_date", today);
    }
    const idx = parseInt(localStorage.getItem("movila_daily_index") || "0",10);
    const daily = allVideos[idx] || allVideos[0];
    if (!daily) return;
    const section = document.createElement("section");
    section.className = "daily-short fade-in";
    section.innerHTML = `
      <h2>🎥 Today's Short</h2>
      <video src="${daily.url}" autoplay muted loop playsinline></video>
      <h3>${daily.title}</h3>
      <p>${daily.desc}</p>
    `;
    const main = document.querySelector("main #main-content");
    if (main) main.prepend(section);
  } catch(e) { console.warn(e); }
}

/* Theme toggle wiring */
function wireThemeToggle() {
  const btns = document.querySelectorAll("#themeToggle");
  btns.forEach(btn => {
    const saved = localStorage.getItem("movila_theme");
    if (saved === "light") {
      document.body.classList.add("light-theme");
      btn.textContent = "☀️";
    } else {
      btn.textContent = "🌙";
    }
    btn.addEventListener("click", ()=> {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      btn.textContent = isLight ? "☀️" : "🌙";
      localStorage.setItem("movila_theme", isLight ? "light" : "dark");
    });
  });
}

/* init */
init();