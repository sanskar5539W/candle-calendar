(function () {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fixed-date holidays (month is 0-indexed). Add more as needed.
  const holidays = {
    "0-1": "New Year's Day",
    "1-14": "Valentine's Day",
    "2-17": "St. Patrick's Day",
    "6-4": "Independence Day",
    "9-31": "Halloween",
    "10-11": "Veterans Day",
    "10-27": "Thanksgiving",
    "11-24": "Christmas Eve",
    "11-25": "Christmas Day",
    "11-31": "New Year's Eve"
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

  function isHoliday(m, d) {
    return holidays[`${m}-${d}`];
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
      const holidayName = isHoliday(viewMonth, d);
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

  saveEventBtn.addEventListener("click", () => {
    if (!activeKey) return;
    const text = eventInput.value.trim();
    if (text) {
      const isNew = !events[activeKey];
      events[activeKey] = text;
      if (isNew) justAddedKey = activeKey;
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
