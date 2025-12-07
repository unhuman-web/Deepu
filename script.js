// script.js — mobile-first countdown → birthday → proposal flow with Deepu photo integration
// TARGET: 24-Jan-2026 00:00 IST
const TARGET_ISO = "2026-01-24T00:00:00+05:30";

let unlocked = false;
let chimeEnabled = false;
let countdownInterval = null;

// DOM refs
const app = document.getElementById("app");
const desktopNotice = document.getElementById("desktopNotice");
const previewBtn = document.getElementById("previewBtn");

const lockOverlay = document.getElementById("lockOverlay");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minsEl = document.getElementById("minutes");
const secsEl = document.getElementById("seconds");
const progressFg = document.querySelector(".ring-fg");

const birthdayScreen = document.getElementById("birthdayScreen");
const cake = document.getElementById("cake");
const candleFlame = document.getElementById("candleFlame");
const giftBox = document.getElementById("giftBox");
const birthdayMessageArea = document.getElementById("birthdayMessageArea");
const continueToProposalBtn = document.getElementById("continueToProposal");
const balloonLayer = document.getElementById("balloonLayer");
const giftPhotoWrap = document.getElementById("giftPhotoWrap");
const giftPhoto = document.getElementById("giftPhoto");

const proposalScreen = document.getElementById("proposalScreen");
const chaptersContainer = document.getElementById("chapters");
const proposalHero = document.getElementById("proposalHero");
const floatingSticker = document.getElementById("floatingSticker");

const yesBtn = document.getElementById("yesBtn");
const timeBtn = document.getElementById("timeBtn");
const confettiWrap = document.getElementById("confettiWrap");
const draggableHeart = document.getElementById("draggableHeart");
const muteToggle = document.getElementById("muteToggle");
const toast = document.getElementById("toast");

// audio (left blank to avoid autoplay); user toggles sound to enable
const beep = new Audio();

// ensure mobile-first UI on desktop preview
function checkViewport() {
  const wide = window.innerWidth >= 700;
  if (wide) {
    desktopNotice.setAttribute("aria-hidden", "false");
    desktopNotice.style.display = "flex";
    app.style.display = "none";
  } else {
    desktopNotice.setAttribute("aria-hidden", "true");
    desktopNotice.style.display = "none";
    app.style.display = "block";
  }
}
window.addEventListener("resize", throttle(checkViewport, 250));

document.addEventListener("DOMContentLoaded", () => {
  checkViewport();
  previewBtn?.addEventListener("click", () => {
    desktopNotice.style.display = "none";
    app.style.display = "block";
    showToast("Preview on desktop. Best experienced on phone.");
  });

  startCountdown(TARGET_ISO, onUnlock);

  initCake();
  initGift();
  continueToProposalBtn.addEventListener("click", revealProposal);

  initProposalControls();
  initDraggableHeart();
  muteToggle?.addEventListener("click", () => {
    chimeEnabled = !chimeEnabled;
    muteToggle.setAttribute("aria-pressed", String(chimeEnabled));
    muteToggle.textContent = chimeEnabled ? "🔔" : "🔕";
    showToast(chimeEnabled ? "Sound enabled" : "Sound muted");
  });

  createBackgroundHearts();
});

/* Countdown */
function startCountdown(targetIso, onComplete) {
  const target = new Date(targetIso);
  const now = new Date();
  if (target - now <= 0) { onComplete(); return; }

  const startMs = Date.now();
  const totalDuration = target - startMs;

  function tick() {
    const now2 = new Date();
    let delta = target - now2;
    if (delta <= 0) {
      updateTime(0,0,0,0);
      updateProgress(1);
      clearInterval(countdownInterval);
      onComplete();
      return;
    }
    const d = Math.floor(delta / (1000*60*60*24));
    delta -= d*(1000*60*60*24);
    const h = Math.floor(delta / (1000*60*60));
    delta -= h*(1000*60*60);
    const m = Math.floor(delta / (1000*60));
    delta -= m*(1000*60);
    const s = Math.floor(delta / 1000);
    updateTime(d,h,m,s);

    const elapsed = Date.now() - startMs;
    const progress = Math.min(1, elapsed / totalDuration);
    updateProgress(progress);
  }
  tick();
  countdownInterval = setInterval(tick, 250);
}

function updateTime(d,h,m,s) {
  daysEl.textContent = String(d).padStart(2,"0");
  hoursEl.textContent = String(h).padStart(2,"0");
  minsEl.textContent = String(m).padStart(2,"0");
  secsEl.textContent = String(s).padStart(2,"0");
}
function updateProgress(progress) {
  const circ = 2 * Math.PI * 52;
  const offset = Math.round(circ * (1 - progress));
  if (progressFg) progressFg.style.strokeDashoffset = offset;
}

/* Unlock sequence */
function onUnlock() {
  if (unlocked) return;
  unlocked = true;
  if (chimeEnabled) safePlayBeep();
  lockOverlay.classList.add("unlocked");
  setTimeout(()=> lockOverlay.style.display = "none", 900);
  setTimeout(showBirthday, 700);
}

/* Birthday interactions */
function showBirthday() {
  birthdayScreen.classList.remove("hidden");
  birthdayScreen.setAttribute("aria-hidden","false");
  birthdayScreen.querySelector(".title")?.focus?.();
  spawnBalloons(6);
}

function initCake() {
  if (!cake) return;
  const blow = () => {
    if (candleFlame.classList.contains("gone")) return;
    candleFlame.classList.add("blown");
    setTimeout(()=> {
      candleFlame.classList.add("gone");
      spawnClickHeartsAt(cake.getBoundingClientRect().left + 60, cake.getBoundingClientRect().top + 10, 6);
      showToast("You blew the candle! Make a wish ✨");
    }, 420);
  };
  cake.addEventListener("click", blow);
  cake.addEventListener("keydown", (e)=> { if (e.key==="Enter"||e.key===" ") blow(); });
}

function initGift() {
  if (!giftBox) return;
  let opened = false;
  const openGift = async () => {
    if (opened) return;
    opened = true;
    giftBox.classList.add("opened");

    // Build birthday message + your promise lines
    const base = birthdayMessage();
    let letterContent = "";
    try {
      const resp = await fetch('letter.html', {cache:"no-cache"});
      if (resp.ok) {
        const txt = await resp.text();
        const bodyMatch = txt.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im);
        if (bodyMatch && bodyMatch[1]) {
          letterContent = bodyMatch[1].replace(/<[^>]+>/g,'').trim();
        } else letterContent = txt.replace(/<[^>]+>/g,'').trim();
      }
    } catch (e) { letterContent = ""; }

    const finalText = letterContent ? (base + "\n\n" + letterContent) : (base + "\n\n" + "(The full letter will be revealed when available.)");
    typewriterReveal(finalText, birthdayMessageArea, 22, () => {
      giftPhotoWrap.setAttribute("aria-hidden","false");
      giftPhotoWrap.classList.add("reveal");
      spawnClickHearts(8);
    });
  };

  giftBox.addEventListener("click", openGift);
  giftBox.addEventListener("keydown", (e)=> { if (e.key==="Enter"||e.key===" ") openGift(); });
}

/* Proposal reveal & chapters loading */
function revealProposal() {
  birthdayScreen.classList.add("fade-out");
  setTimeout(()=> {
    birthdayScreen.style.display = "none";

    // YOUR ORDER: index → page2 → page3 → page4 → letter → final
    loadUploadedPages(['index.html','page2.html','page3.html','page4.html','letter.html','final.html']).then(() => {

      const preface = proposalPreface();
      const preEl = document.createElement("div");
      preEl.className = "chapter preface";
      preEl.innerHTML = `<div class="preface-wrap"><p>${escapeHtmlForHTML(preface).replace(/\n/g,'<br>')}</p></div>`;
      chaptersContainer.insertBefore(preEl, chaptersContainer.firstChild);

      proposalHero.classList.add("show");
      floatingSticker.classList.add("float-in");

      proposalScreen.classList.remove("hidden");
      proposalScreen.setAttribute("aria-hidden","false");
      proposalScreen.querySelector(".proposal-title")?.focus?.();
      createBackgroundHearts();
      spawnConfettiBurst(28);

      yesBtn.disabled = false; yesBtn.classList.remove("btn-disabled");
      timeBtn.disabled = false; timeBtn.classList.remove("btn-disabled");
    });
  }, 480);
}

async function loadUploadedPages(list) {
  chaptersContainer.innerHTML = "";
  for (const name of list) {
    try {
      const resp = await fetch(name, {cache:"no-cache"});
      if (!resp.ok) throw new Error("no file");
      const text = await resp.text();
      const wrapper = document.createElement("div");
      wrapper.className = "chapter";

      const bodyMatch = text.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im);
      if (bodyMatch && bodyMatch[1]) wrapper.innerHTML = bodyMatch[1];
      else wrapper.innerHTML = text;

      chaptersContainer.appendChild(wrapper);

      const heroChunk = document.createElement("div");
      heroChunk.className = "chapter-photo";
      heroChunk.innerHTML = `<img src="deepu.jpg" alt="Deepu" class="chapter-photo-img">`;
      chaptersContainer.appendChild(heroChunk);

    } catch (e) {
      const placeholder = document.createElement("div");
      placeholder.className = "chapter placeholder";
      placeholder.innerHTML = `<h3>${name}</h3><p>(Cannot load file. Make sure ${name} is in the same folder.)</p>`;
      chaptersContainer.appendChild(placeholder);
    }
  }
  return true;
}

/* Proposal controls */
function initProposalControls() {
  yesBtn.disabled = true;
  timeBtn.disabled = true;

  yesBtn.addEventListener("click", () => {
    if (!unlocked) return;
    announce("Yesss! 💗 Thank you.");
    spawnConfettiBurst(120);
    spawnClickHearts(24);

    const heroImg = document.querySelector('.hero-photo');
    if (heroImg) {
      heroImg.classList.add('hero-zoom');
      setTimeout(()=> heroImg.classList.remove('hero-zoom'), 1800);
    }
    showToast("She said YES! Celebrate 💞");
  });

  timeBtn.addEventListener("click", () => {
    if (!unlocked) return;
    announce("I understand. I'll wait patiently. 🕊️");
    spawnClickHearts(8);
    showToast("You chose 'I need time' — gentle and kind.");
  });
}

/* Visual spawns */
function spawnBalloons(n=6) {
  for (let i=0;i<n;i++){
    const b = document.createElement("div");
    b.className = "balloon";
    b.style.left = `${10 + Math.random()*80}vw`;
    b.style.animationDelay = `${Math.random()*2}s`;
    balloonLayer.appendChild(b);
    b.addEventListener("click", () => {
      b.classList.add("pop");
      spawnClickHeartsAt(b.getBoundingClientRect().left+16, b.getBoundingClientRect().top+16, 4);
      setTimeout(()=>b.remove(),300);
    });
    setTimeout(()=>b.remove(), 12000 + Math.random()*6000);
  }
}

function spawnClickHeartsAt(x,y,count=5) {
  for (let i=0;i<count;i++){
    const h = document.createElement("div");
    h.className = "click-heart";
    h.style.left = `${x + (Math.random()-0.5)*80}px`;
    h.style.bottom = `${window.innerHeight - y + (Math.random()-0.5)*80}px`;
    document.body.appendChild(h);
    setTimeout(()=>h.remove(),1600);
  }
}

function spawnClickHearts(count=5) {
  for (let i=0;i<count;i++){
    setTimeout(()=>{
      const h = document.createElement("div");
      h.className = "click-heart";
      h.style.left = `${20 + Math.random()*60}vw`;
      h.style.bottom = `${6 + Math.random()*30}vh`;
      document.body.appendChild(h);
      setTimeout(()=>h.remove(),1600);
    }, i*70);
  }
}

function spawnConfettiBurst(total=40) {
  const colors = ["#ff6b9b","#ffd166","#7ee787","#8ec5ff","#d7b2ff"];
  for (let i=0;i<total;i++){
    setTimeout(()=>{
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = `${10 + Math.random()*80}vw`;
      c.style.background = colors[i % colors.length];
      confettiWrap.appendChild(c);
      const dur = 1200 + Math.random()*900;
      c.animate([
        { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity:1 },
        { transform: `translateY(${- (20 + Math.random()*60)}vh) rotate(${Math.random()*720}deg)`, opacity:0.9 },
        { transform: `translateY(${20 + Math.random()*60}vh) rotate(${Math.random()*1080}deg)`, opacity:0 }
      ], { duration: dur, easing: "cubic-bezier(.2,.8,.2,1)"});
      setTimeout(()=>c.remove(), dur+50);
    }, i*16);
  }
}

/* Draggable heart */
function initDraggableHeart() {
  draggableHeart.style.display = "flex";
  draggableHeart.setAttribute("aria-hidden","false");
  let dragging=false, ox=0, oy=0;

  draggableHeart.addEventListener("pointerdown", (e) => {
    if (!unlocked) return;
    dragging = true;
    draggableHeart.setPointerCapture(e.pointerId);
    const r = draggableHeart.getBoundingClientRect();
    ox = e.clientX - r.left; 
    oy = e.clientY - r.top;
    draggableHeart.classList.add("dragging");
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const x = e.clientX - ox;
    const y = e.clientY - oy;
    draggableHeart.style.left = `${Math.max(6, Math.min(window.innerWidth - 56, x))}px`;
    draggableHeart.style.top = `${Math.max(6, Math.min(window.innerHeight - 56, y))}px`;
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    draggableHeart.releasePointerCapture?.(e.pointerId);
    draggableHeart.classList.remove("dragging");
    spawnHeartsAtPos(8, e.clientX, e.clientY);
  });
}

function spawnHeartsAtPos(count,x,y){
  for(let i=0;i<count;i++){
    const h=document.createElement("div");
    h.className="click-heart";
    h.style.left=`${x + (Math.random()-0.5)*120}px`;
    h.style.bottom=`${window.innerHeight - y + (Math.random()-0.5)*120}px`;
    document.body.appendChild(h);
    setTimeout(()=>h.remove(),1600);
  }
}

/* Typewriter */
function typewriterReveal(text, container, speed=24, done){
  container.innerHTML="";
  let i=0;
  const wrap=document.createElement("div");
  wrap.className="typewrap";
  container.appendChild(wrap);
  const timer=setInterval(()=>{
    if(i>=text.length){ clearInterval(timer); done && done(); return; }
    const ch=text[i++];
    if(ch==="\n") wrap.appendChild(document.createElement("br"));
    else{ 
      const sp=document.createElement("span");
      sp.textContent=ch;
      wrap.appendChild(sp);
    }
    container.scrollTop = container.scrollHeight;
  }, speed);
}

/* Helpers */
function announce(msg){ 
  toast.textContent = msg; 
  toast.classList.add("visible"); 
  setTimeout(()=>toast.classList.remove("visible"),2200); 
}
function showToast(msg){ announce(msg); }

function safePlayBeep(){ 
  try { 
    beep.currentTime = 0; 
    beep.play().catch(()=>{}); 
  } catch(e){} 
}

function createBackgroundHearts(){ 
  for(let i=0;i<5;i++){ 
    setTimeout(()=> { 
      const h=document.createElement("div"); 
      h.className="floating-heart big"; 
      h.style.left = `${5 + Math.random()*90}vw`; 
      h.style.animationDelay = `${Math.random()*6}s`; 
      document.body.appendChild(h); 
      setTimeout(()=>h.remove(),14000); 
    }, i*300); 
  } 
}

function throttle(fn,wait){ 
  let last=0; 
  return (...args)=>{ 
    const now=Date.now(); 
    if(now-last>=wait){ 
      last=now; 
      fn(...args); 
    } 
  } 
}

/* Prefab messages */
function birthdayMessage(){
  return `Happy Birthday, Deepu! 🎂
You make ordinary moments feel so warm and bright. Today is all yours — laugh, eat cake, and let me spoil you. 💖

I want to make you happy and I want to explore the world with you. I want to give you everything that you missed in this time and I promise I will treat you like a queen. Remember I'm all yours and you're all mine and mine only.`;
}

function proposalPreface(){
  return `I want to make you happy and I want to explore the world with you. I want to give you everything that you missed in this time and I promise I will treat you like a queen. Remember I'm all yours and you're all mine and mine only.

(Scroll down to see everything I saved for you.)`;
}

function escapeHtmlForHTML(s){ 
  if(!s) return ""; 
  return s
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;'); 
}