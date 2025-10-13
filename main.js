// === PONDASI 7: LOADER + SEO AUTO META ===

// Loader animasi
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => loader.classList.add("hidden"), 800);
  }
});

// SEO otomatis di halaman video
if (window.location.pathname.includes("video.html")) {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  const video = allVideos.find(v => v.id === id);

  if (video) {
    document.title = `${video.title} | MOVILA Shorts`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", video.desc || "Watch trending short videos on MOVILA");
    document
      .querySelector('meta[property="og:image"]')
      ?.setAttribute("content", `https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
  }
}

// === PONDASI 8: KATEGORI + INFINITE SCROLL + DAILY SHORT ===

let loadedCount = 0;
const perLoad = 12;

// Fungsi load video bertahap
function loadMoreVideos() {
  const nextBatch = allVideos.slice(loadedCount, loadedCount + perLoad);
  nextBatch.forEach(v => {
    const rank = getTrendingRank(v.id);
    const badge = rank ? `<div class="trending-badge">🔥 #${rank}</div>` : "";

    const card = document.createElement("a");
    card.href = `video.html?id=${v.id}`;
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-wrapper">
        <video src="${v.url}" muted preload="metadata"></video>
        ${badge}
      </div>
      <h3>${v.title}</h3>
      <p>${v.desc}</p>
    `;
    list.appendChild(card);
  });
  loadedCount += perLoad;
}

// Infinite scroll listener
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMoreVideos();
  }
});

// Filter by category
function filterCategory(cat) {
  const filtered = allVideos.filter(v => v.category === cat);
  list.innerHTML = "";
  loadedCount = 0;
  filtered.forEach(v => {
    const card = document.createElement("a");
    card.href = `video.html?id=${v.id}`;
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-wrapper">
        <video src="${v.url}" muted preload="metadata"></video>
      </div>
      <h3>${v.title}</h3>
      <p>${v.desc}</p>
    `;
    list.appendChild(card);
  });
}

// === RANDOM DAILY SHORT ===
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  const today = new Date().toDateString();
  const stored = localStorage.getItem("movila_daily_date");

  if (stored !== today) {
    const random = Math.floor(Math.random() * allVideos.length);
    localStorage.setItem("movila_daily_index", random);
    localStorage.setItem("movila_daily_date", today);
  }

  const dailyIndex = localStorage.getItem("movila_daily_index");
  if (dailyIndex) {
    const dailyVideo = allVideos[dailyIndex];
    const section = document.createElement("section");
    section.className = "daily-short";
    section.innerHTML = `
      <h2>🎥 Today’s Short</h2>
      <video src="${dailyVideo.url}" autoplay muted loop></video>
      <h3>${dailyVideo.title}</h3>
      <p>${dailyVideo.desc}</p>
    `;
    document.querySelector("main").prepend(section);
  }
}

// === PONDASI 9: THEME SWITCHER ===
const themeBtn = document.getElementById("themeToggle");
if (themeBtn) {
  // Cek tema terakhir dari localStorage
  const savedTheme = localStorage.getItem("movila_theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeBtn.textContent = "☀️";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeBtn.textContent = isLight ? "☀️" : "🌙";
    localStorage.setItem("movila_theme", isLight ? "light" : "dark");
  });
}

// PONDASI 1: Auto-load video dari JSON ke homepage
fetch("videos.json")
  .then(res => res.json())
  .then(videos => {
    const list = document.getElementById("video-list");
    videos.forEach(v => {
      const card = document.createElement("a");
      card.href = `video.html?id=${v.id}`;
      card.className = "video-card";
      card.innerHTML = `
        <video src="${v.url}" muted preload="metadata"></video>
        <h3>${v.title}</h3>
        <p>${v.desc}</p>
      `;
      list.appendChild(card);
    });
  });

// === PONDASI 4 (REVISI): AUTO SEARCH + AUTO CATEGORIES ===
let allVideos = [];
let list = document.getElementById("video-list");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");

// Auto detect category dari judul atau url
function detectCategory(title, url) {
  const text = (title + url).toLowerCase();
  if (text.includes("cat") || text.includes("funny")) return "funny";
  if (text.includes("car") || text.includes("drift") || text.includes("race")) return "cars";
  if (text.includes("dance") || text.includes("music")) return "music";
  if (text.includes("viral")) return "viral";
  return "other";
}

function displayVideos(videos) {
  list.innerHTML = "";
  videos.forEach(v => {
    const card = document.createElement("a");
    card.href = `video.html?id=${v.id}`;
    card.className = "video-card";
    card.innerHTML = `
      <video src="${v.url}" muted preload="metadata"></video>
      <h3>${v.title}</h3>
      <p>${v.desc}</p>
    `;
    list.appendChild(card);
  });
}

fetch("videos.json")
  .then(res => res.json())
  .then(videos => {
    // Tambahkan kategori otomatis untuk setiap video
    allVideos = videos.map(v => ({
      ...v,
      category: detectCategory(v.title, v.url)
    }));

    // Buat daftar kategori unik
    const categories = [...new Set(allVideos.map(v => v.category))];
    categories.unshift("all"); // tambah opsi "All" di awal

    // Buat dropdown kategori otomatis
    categorySelect.innerHTML = categories
      .map(cat => `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`)
      .join("");

    // Tampilkan semua video pertama kali
    displayVideos(allVideos);
  });

// Search event
searchInput?.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(keyword) ||
    v.desc.toLowerCase().includes(keyword)
  );
  displayVideos(filtered);
});

// Category event
categorySelect?.addEventListener("change", e => {
  const category = e.target.value;
  const filtered = category === "all"
    ? allVideos
    : allVideos.filter(v => v.category === category);
  displayVideos(filtered);
});

// === PONDASI 5: TRENDING SHORT SYSTEM ===

// Simpan view count ke localStorage saat video dibuka
if (window.location.pathname.includes("video.html")) {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  const key = `video_views_${id}`;
  let views = localStorage.getItem(key) || 0;
  localStorage.setItem(key, parseInt(views) + 1);
}

// Tombol untuk tampilkan Trending Short
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  const trendingBtn = document.createElement("button");
  trendingBtn.textContent = "🔥 Trending Short";
  trendingBtn.className = "trending-btn";
  document.querySelector("header").appendChild(trendingBtn);

  trendingBtn.addEventListener("click", () => {
    const trendingList = allVideos
      .map(v => {
        const views = localStorage.getItem(`video_views_${v.id}`) || 0;
        return { ...v, views: parseInt(views) };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10); // ambil 10 video teratas

    displayVideos(trendingList);
  });
}

// === PONDASI 6: BADGE TRENDING + SMOOTH LOADING ===

// === Trending Badge ===
function getTrendingRank(id) {
  const ranked = allVideos
    .map(v => {
      const views = localStorage.getItem(`video_views_${v.id}`) || 0;
      return { ...v, views: parseInt(views) };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10); // top 10

  const rank = ranked.findIndex(v => v.id === id);
  return rank >= 0 ? rank + 1 : null;
}

// Modifikasi fungsi displayVideos agar ada badge
function displayVideos(videos) {
  list.innerHTML = "";
  videos.forEach(v => {
    const rank = getTrendingRank(v.id);
    const badge = rank ? `<div class="trending-badge">🔥 #${rank}</div>` : "";

    const card = document.createElement("a");
    card.href = `video.html?id=${v.id}`;
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-wrapper">
        <video src="${v.url}" muted preload="metadata"></video>
        ${badge}
      </div>
      <h3>${v.title}</h3>
      <p>${v.desc}</p>
    `;
    list.appendChild(card);
  });
}

// === Smooth Transition saat pindah halaman ===
document.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", e => {
    const href = link.getAttribute("href");
    if (href && href.endsWith(".html")) {
      e.preventDefault();
      document.body.classList.add("fade-out");
      setTimeout(() => (window.location.href = href), 300);
    }
  });
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove("fade-out");
});

// PONDASI 2: Halaman video individual
if (window.location.pathname.includes("video.html")) {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  fetch("videos.json")
    .then(res => res.json())
    .then(videos => {
      const video = videos.find(v => v.id === id);
      const main = document.getElementById("main-video");

      if (video) {
        main.innerHTML = `
          <video src="${video.url}" controls autoplay></video>
          <h2>${video.title}</h2>
          <p>${video.desc}</p>
        `;
      }

// PONDASI 3: Autoplay next video + smooth transition
const player = main.querySelector("video");

if (player) {
  player.addEventListener("ended", () => {
    // Cari semua video kecuali yang sekarang
    const nextList = videos.filter(v => v.id !== id);
    const next = nextList[Math.floor(Math.random() * nextList.length)];

    // Efek transisi halus
    main.style.opacity = 0;
    setTimeout(() => {
      // Ganti konten video utama
      main.innerHTML = `
        <video src="${next.url}" controls autoplay></video>
        <h2>${next.title}</h2>
        <p>${next.desc}</p>
      `;
      history.replaceState(null, "", `video.html?id=${next.id}`);

      // Fade in
      setTimeout(() => (main.style.opacity = 1), 200);

      // Scroll ke atas biar fokus ke video baru
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  });
}

    // Generate 3 rekomendasi acak
      const recommended = document.getElementById("recommended");
      const others = videos.filter(v => v.id !== id);
      const random = others.sort(() => 0.5 - Math.random()).slice(0, 3);

      random.forEach(v => {
        const card = document.createElement("a");
        card.href = `video.html?id=${v.id}`;
        card.className = "video-card";
        card.innerHTML = `
          <video src="${v.url}" muted preload="metadata"></video>
          <h3>${v.title}</h3>
          <p>${v.desc}</p>
        `;
        recommended.appendChild(card);
      });
    });
}


