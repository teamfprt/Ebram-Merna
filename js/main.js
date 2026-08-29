/* =========================================================================
   main.js
   -------------------------------------------------------------------------
   كل الإعدادات القابلة للتعديل موجودة في أول الملف (CONFIG).
   غيّر منها بس ومش محتاج تلمس باقي الكود.
========================================================================= */

const CONFIG = {
  // رابط قاعة الاحتفال على خرائط جوجل — استبدله برابط قاعتك الحقيقي
  // (افتح Google Maps، دور على المكان، دوس Share، وانسخ الرابط هنا)
  GOOGLE_MAPS_URL: "https://maps.app.goo.gl/56scbbzYrYKPNm4x6?g_st=aw",

  // بيانات المناسبة (تستخدم في التقويم وملف .ics)
  EVENT: {
    title: "خطوبة ابرام و ميرنا",
    year: 2026,
    month: 9,       // سبتمبر = 9
    day: 20,
    startHour: 19,  // 7 مساءً بنظام 24 ساعة
    durationHours: 3,
    location: "قاعة الاحتفال",
    description: "خطوبة ابرام و ميرنا - بانتظاركم لنحتفل معًا",
  },

  // عدد بتلات الورد المتساقطة (قلل الرقم لو حسيت إن الجهاز بطيء)
  PETALS_COUNT: 26,
};

/* =========================================================================
   1) توليد بتلات الورد ثلاثية الأبعاد
   -------------------------------------------------------------------------
   بننشئ عدد PETALS_COUNT من عناصر div.petal، كل واحدة بموضع بداية عشوائي،
   مدة سقوط عشوائية، وانحراف جانبي عشوائي (--drift) عشان الحركة متبقاش
   متكررة بشكل واضح.
========================================================================= */
function createPetals() {
  const layer = document.getElementById("petalsLayer");
  if (!layer) return;

  for (let i = 0; i < CONFIG.PETALS_COUNT; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";

    const leftPos = Math.random() * 100; // % من عرض الشاشة
    const duration = 9 + Math.random() * 8; // بين 9 و 17 ثانية
    const delay = Math.random() * 12; // تأخير عشوائي عشان مايبدأوش كلهم مع بعض
    const size = 10 + Math.random() * 14; // حجم البتلة
    const drift = (Math.random() * 120 - 60) + "px"; // انحراف يمين/شمال

    petal.style.left = leftPos + "%";
    petal.style.width = size + "px";
    petal.style.height = size * 1.25 + "px";
    petal.style.animationDuration = duration + "s";
    petal.style.animationDelay = delay + "s";
    petal.style.setProperty("--drift", drift);

    // بعض البتلات ذهبية بدل الوردي لإضافة تنوع بسيط
    if (Math.random() > 0.75) {
      petal.style.background =
        "linear-gradient(135deg, #f3e3c3 0%, #cc9a4a 100%)";
    }

    layer.appendChild(petal);
  }
}

/* =========================================================================
   2) زر "ابدأ": يظهر باقي الموقع + يشغّل الأغنية + يفعّل الـ Visualizer
========================================================================= */
function initStartButton() {
  const startBtn = document.getElementById("startBtn");
  const audio = document.getElementById("bgMusic");

  startBtn.addEventListener("click", () => {
    document.body.classList.add("revealed");

    // تشغيل الأغنية — لازم يحصل جوه حدث ضغط زر عشان المتصفح يسمح بالـ autoplay
    audio.volume = 0.9;
    audio.play().catch(() => {
      // لو المتصفح رفض التشغيل لأي سبب، مش هيوقف باقي الموقع
      console.warn("تعذر تشغيل الأغنية تلقائيًا، تأكد من وجود ملف assets/song.mp3");
    });

    initVisualizer(audio);
  });
}

/* =========================================================================
   3) Music Visualizer
   -------------------------------------------------------------------------
   بنستخدم Web Audio API عشان ناخد بيانات التردد من الأغنية ونرسمها كأعمدة
   متحركة داخل canvas صغير في أسفل الشاشة. مفيش أي تايم لاين ظاهر للمستخدم،
   بس تأثير بصري بيهتز مع الموسيقى.
========================================================================= */
let audioCtxStarted = false;

function initVisualizer(audioEl) {
  if (audioCtxStarted) return; // امنع التهيئة أكتر من مرة
  audioCtxStarted = true;

  const canvas = document.getElementById("visualizerCanvas");
  const ctx2d = canvas.getContext("2d");

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audioEl);
  const analyser = audioCtx.createAnalyser();

  analyser.fftSize = 64; // عدد قليل نسبيًا يكفي لعدد أعمدة بسيط وجميل
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = 14; // عدد الأعمدة المرسومة
    const barWidth = canvas.width / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i] || 0;
      const barHeight = (value / 255) * canvas.height;

      // تدرج لوني وردي-ذهبي لكل عمود
      const gradient = ctx2d.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "#e85c82");
      gradient.addColorStop(1, "#cc9a4a");
      ctx2d.fillStyle = gradient;

      const x = i * (barWidth + 2);
      const y = canvas.height - barHeight;
      ctx2d.beginPath();
      if (ctx2d.roundRect) {
        ctx2d.roundRect(x, y, barWidth, barHeight, 2);
      } else {
        ctx2d.rect(x, y, barWidth, barHeight);
      }
      ctx2d.fill();
    }
  }

  draw();
}

/* =========================================================================
   4) بناء تقويم شهر سبتمبر 2026 مع تحديد يوم 20 بشكل قلب
========================================================================= */
function buildCalendar() {
  const { year, month, day } = CONFIG.EVENT;
  const weekdaysEl = document.getElementById("calendarWeekdays");
  const gridEl = document.getElementById("calendarGrid");

  // أسماء الأيام بالعربي، بادئين بالسبت (الأسبوع العربي التقليدي)
  const weekdayNames = ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
  weekdayNames.forEach((name) => {
    const span = document.createElement("span");
    span.textContent = name;
    weekdaysEl.appendChild(span);
  });

  // أول يوم في الشهر (0 = الأحد حسب JS، هنحوله عشان الأسبوع يبدأ بالسبت)
  const firstDay = new Date(year, month - 1, 1);
  const jsWeekday = firstDay.getDay(); // 0=أحد ... 6=سبت
  const offset = (jsWeekday + 1) % 7; // تحويل بحيث 0=سبت

  const daysInMonth = new Date(year, month, 0).getDate();

  // خانات فاضية قبل أول يوم فعلي
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("span");
    empty.className = "calendar-day empty";
    gridEl.appendChild(empty);
  }

  // أيام الشهر
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("span");
    cell.className = "calendar-day";
    cell.textContent = d;
    if (d === day) {
      cell.classList.add("selected");
      cell.setAttribute("aria-label", "يوم الخطوبة");
    }
    gridEl.appendChild(cell);
  }
}

/* =========================================================================
   5) زر "أضف الموعد لتقويمك" — بينزل ملف .ics يشتغل مع أي تقويم
   (Google Calendar / Apple Calendar / Outlook...)
========================================================================= */
function initAddToCalendar() {
  const btn = document.getElementById("addToCalendarBtn");
  btn.addEventListener("click", () => {
    const { title, year, month, day, startHour, durationHours, location, description } = CONFIG.EVENT;

    // تنسيق التاريخ المطلوب لملف ICS: YYYYMMDDTHHMMSS
    const pad = (n) => String(n).padStart(2, "0");
    const startStr = `${year}${pad(month)}${pad(day)}T${pad(startHour)}0000`;
    const endHour = startHour + durationHours;
    const endStr = `${year}${pad(month)}${pad(day)}T${pad(endHour)}0000`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "engagement-event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/* =========================================================================
   6) شباك القاعة: بيفتح موقع جوجل مابس في تاب جديد عند الضغط
========================================================================= */
function initHallWindow() {
  const hallBtn = document.getElementById("hallWindow");
  hallBtn.addEventListener("click", () => {
    window.open(CONFIG.GOOGLE_MAPS_URL, "_blank", "noopener");
  });
}

/* =========================================================================
   تشغيل كل الوظائف بعد تحميل الصفحة
========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  createPetals();
  buildCalendar();
  initStartButton();
  initAddToCalendar();
  initHallWindow();
});
