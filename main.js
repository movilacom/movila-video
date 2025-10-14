// main.js - index page script
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const list = document.getElementById("video-list");
  const search = document.getElementById("search");
  const category = document.getElementById("category");
  const themeToggle = document.getElementById("themeToggle");
  if (document.getElementById("year")) document.getElementById("year").textContent = new Date().getFullYear();

  if (themeToggle) {
    const saved = localStorage.getItem("movila_theme");
    if (saved === "light") document.body.classList.add("light-theme");
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      localStorage.setItem("movila_theme", document.body.classList.contains("light-theme") ? "light" : "dark");
    });
  }

  fetch("videos.json").then(r => {
    if (!r.ok) throw new Error("videos.json not found");
    return r.json();
  }).then(data => {
    const videos = Array.isArray(data) ? data : [];
    // init categories
    const cats = ["all", ...Array.from(new Set(videos.map(v => v.category || "random")))];
    if (category) category.innerHTML = cats.map(c => `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join("");

    // shuffle feed
    let feed = videos.slice().sort(() => 0.5 - Math.random());

    // daily short
    injectDailyShort(feed);

    // render
    function render(arr) {
      list.innerHTML = "";
      arr.forEach(v => {
        const a = document.createElement("a");
        a.className = "video-card";
        a.href = `video.html?vid=${encodeURIComponent(v.id)}`;
        a.innerHTML = `<div class="video-wrapper"><video src="${v.src}" muted preload="metadata" playsinline crossorigin="anonymous"></video></div><div class="video-info"><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml((v.desc||"").slice(0,80))}</p></div>`;
        // hover preview
        const vidEl = a.querySelector("video");
        let t;
        a.addEventListener("mouseenter", ()=> { t = setTimeout(()=> { try{ vidEl.play(); }catch{} }, 220); });
        a.addEventListener("mouseleave", ()=> { clearTimeout(t); try{ vidEl.pause(); vidEl.currentTime = 0.5; }catch{} });
        list.appendChild(a);
      });
      if (loader) loader.classList.add("hidden");
    }

    render(feed);

    search?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      render(feed.filter(v => v.title.toLowerCase().includes(q) || (v.desc||"").toLowerCase().includes(q)));
    });

    category?.addEventListener("change", (e) => {
      const c = e.target.value;
      render(c === "all" ? feed : feed.filter(v => (v.category||"random") === c));
    });

    // infinite append
    let busy = false;
    window.addEventListener("scroll", () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 220 && !busy) {
        busy = true;
        const more = videos.slice().sort(()=>0.5 - Math.random()).slice(0, 12);
        feed = feed.concat(more);
        render(feed);
        setTimeout(()=> busy = false, 800);
      }
    });
  }).catch(err => {
    console.error(err);
    if (loader) loader.classList.add("hidden");
    if (list) list.innerHTML = `<p style="padding:20px;color:#bbb">Failed to load videos.json — check path.</p>`;
  });

  function injectDailyShort(all) {
    if (!all || !all.length) return;
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem("movila_daily_date");
      if (stored !== today) {
        const idx = Math.floor(Math.random() * all.length);
        localStorage.setItem("movila_daily_index", idx);
        localStorage.setItem("movila_daily_date", today);
      }
      const idx = parseInt(localStorage.getItem("movila_daily_index")||"0",10);
      const daily = all[idx] || all[0];
      const main = document.getElementById("main-content");
      if (main) {
        const section = document.createElement("section");
        section.className = "daily-short";
        section.innerHTML = `<h2>🎥 Today's Short</h2><video src="${daily.src}" autoplay muted loop playsinline crossorigin="anonymous"></video><h3>${escapeHtml(daily.title)}</h3><p>${escapeHtml(daily.desc||"")}</p>`;
        main.prepend(section);
      }
    } catch(e) { console.warn(e); }
  }

  function escapeHtml(s=""){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
});