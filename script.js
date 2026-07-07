(function () {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Indian holidays. Fixed-date ones (month is 0-indexed) apply every year.
  const fixedHolidays = {
    "0-1": "New Year's Day",
    "0-14": "Makar Sankranti / Pongal",
    "0-26": "Republic Day",
    "3-14": "Ambedkar Jayanti",
    "4-1": "May Day",
    "7-15": "Independence Day",
    "9-2": "Gandhi Jayanti",
    "11-25": "Christmas Day"
  };

  // Movable festivals shift each year (lunar calendar) — keyed year-month-day.
  const movableHolidays = {
    "2026-1-15": "Maha Shivratri",
    "2026-2-3": "Holika Dahan",
    "2026-2-4": "Holi",
    "2026-2-21": "Eid al-Fitr",
    "2026-3-3": "Good Friday",
    "2026-4-27": "Eid al-Adha (Bakrid)",
    "2026-7-26": "Eid-e-Milad",
    "2026-7-28": "Raksha Bandhan",
    "2026-8-4": "Janmashtami",
    "2026-8-14": "Ganesh Chaturthi",
    "2026-9-21": "Dussehra",
    "2026-10-8": "Diwali",
    "2026-10-24": "Guru Nanak Jayanti"
  };

  const EVENTS_KEY = "candleCalendarEvents";

  function loadEvents() {
    try {
      return JSON.parse(localStorage.getItem(EVENTS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveEvents(events) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  let events = loadEvents();

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let justAddedKey = null; // date key that should play the "ignite" animation

  const monthYearEl = document.getElementById("monthYear");
  const gridEl = document.getElementById("calendarGrid");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");

  const eventReaction = document.getElementById("eventReaction");
  const reactionImages = ["assets/reaction.png", "assets/reaction2.png", "assets/reaction3.jpg"];
  let reactionIndex = 0;
  const overlay = document.getElementById("overlay");
  const closeModalBtn = document.getElementById("closeModal");
  const modalDate = document.getElementById("modalDate");
  const modalHoliday = document.getElementById("modalHoliday");
  const eventInput = document.getElementById("eventInput");
  const saveEventBtn = document.getElementById("saveEvent");
  const deleteEventBtn = document.getElementById("deleteEvent");

  let activeKey = null;

  function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function isHoliday(y, m, d) {
    return movableHolidays[`${y}-${m}-${d}`] || fixedHolidays[`${m}-${d}`];
  }

  function buildCandle(state) {
    const wrap = document.createElement("div");
    wrap.className = "candle-wrap";

    const candle = document.createElement("div");
    candle.className = `candle ${state}`;

    const flame = document.createElement("div");
    flame.className = "flame";
    const wick = document.createElement("div");
    wick.className = "wick";
    const body = document.createElement("div");
    body.className = "candle-body";

    candle.appendChild(flame);
    candle.appendChild(wick);
    candle.appendChild(body);
    wrap.appendChild(candle);
    return { wrap, candle };
  }

  function render() {
    monthYearEl.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    gridEl.innerHTML = "";

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "day-cell empty";
      gridEl.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(viewYear, viewMonth, d);
      const holidayName = isHoliday(viewYear, viewMonth, d);
      const eventText = events[key];

      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.key = key;

      const isToday =
        viewYear === today.getFullYear() &&
        viewMonth === today.getMonth() &&
        d === today.getDate();
      if (isToday) cell.classList.add("today");

      const num = document.createElement("div");
      num.className = "day-number";
      num.textContent = d;
      cell.appendChild(num);

      if (holidayName && !eventText) {
        const label = document.createElement("div");
        label.className = "holiday-label";
        label.textContent = holidayName;
        cell.appendChild(label);
      }
      if (eventText) {
        const label = document.createElement("div");
        label.className = "event-label";
        label.textContent = eventText;
        cell.appendChild(label);
      }

      let state = "unlit";
      if (eventText) state = "event";
      else if (holidayName) state = "holiday";

      const { wrap, candle } = buildCandle(state);
      if (state === "event" && key === justAddedKey) {
        candle.classList.add("lighting");
      }
      cell.appendChild(wrap);

      cell.addEventListener("click", () => openModal(key, d, holidayName));
      gridEl.appendChild(cell);
    }

    justAddedKey = null;
  }

  function openModal(key, day, holidayName) {
    activeKey = key;
    modalDate.textContent = `${monthNames[viewMonth]} ${day}, ${viewYear}`;
    if (holidayName) {
      modalHoliday.textContent = `Holiday: ${holidayName}`;
      modalHoliday.classList.remove("hidden");
    } else {
      modalHoliday.classList.add("hidden");
    }
    eventInput.value = events[key] || "";
    deleteEventBtn.classList.toggle("hidden", !events[key]);
    overlay.classList.remove("hidden");
    setTimeout(() => eventInput.focus(), 0);
  }

  function closeModal() {
    overlay.classList.add("hidden");
    activeKey = null;
  }

  function showEventReaction() {
    eventReaction.classList.remove("show");
    eventReaction.src = reactionImages[reactionIndex];
    reactionIndex = (reactionIndex + 1) % reactionImages.length;
    void eventReaction.offsetWidth; // restart animation if already playing
    eventReaction.classList.add("show");
  }

  saveEventBtn.addEventListener("click", () => {
    if (!activeKey) return;
    const text = eventInput.value.trim();
    if (text) {
      const isNew = !events[activeKey];
      events[activeKey] = text;
      if (isNew) {
        justAddedKey = activeKey;
        showEventReaction();
      }
    } else {
      delete events[activeKey];
    }
    saveEvents(events);
    closeModal();
    render();
  });

  deleteEventBtn.addEventListener("click", () => {
    if (!activeKey) return;
    delete events[activeKey];
    saveEvents(events);
    closeModal();
    render();
  });

  closeModalBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeModal();
  });

  prevBtn.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    render();
  });

  nextBtn.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    render();
  });

  render();
})();
