document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.querySelector(".calendar");
  const monthEl = document.querySelector(".calendar__month");
  const prevBtn = document.querySelector(".calendar__prev");
  const nextBtn = document.querySelector(".calendar__next");
  if (!calendarEl || !monthEl || !prevBtn || !nextBtn) return;

  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();

  let calendarData = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  fetch("/assets/data/calendar.json")
    .then((res) => res.json())
    .then((data) => {
      calendarData = data;
      renderCalendar(currentYear, currentMonth);
    })
    .catch((err) => console.error("カレンダーデータの読み込みエラー:", err));

  prevBtn.addEventListener("click", () => {
    if (
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
      return;
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });

  nextBtn.addEventListener("click", () => {
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    if (
      currentYear > maxMonth.getFullYear() ||
      (currentYear === maxMonth.getFullYear() &&
        currentMonth >= maxMonth.getMonth())
    )
      return;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });

  function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    monthEl.textContent = `${year}年${month + 1}月`;

    let html = "<table class='calendar__table'><thead><tr>";
    ["日", "月", "火", "水", "木", "金", "土"].forEach(
      (d) => (html += `<th>${d}</th>`)
    );
    html += "</tr></thead><tbody><tr>";

    for (let i = 0; i < startDay; i++) html += "<td></td>";

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().slice(0, 10);
      let mark = "◯";
      let className = "calendar__day--open";

      if (dateObj < today) {
        html += "<td></td>";
        continue;
      }

      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (!calendarData[monthKey]) {
        mark = "未定";
        className = "calendar__day--future";
      } else if (calendarData[monthKey].closed.includes(dateStr)) {
        mark = "×";
        className = "calendar__day--closed";
      }

      html += `<td class="${className}">${day}<br>${mark}</td>`;

      if ((startDay + day) % 7 === 0) html += "</tr><tr>";
    }

    html += "</tr></tbody></table>";
    calendarEl.innerHTML = html;
  }
});
