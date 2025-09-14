document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.querySelector(".calendar");
  const titleEl = document.querySelector(".calendar__title");
  const prevBtn = document.querySelector(".calendar__prev");
  const nextBtn = document.querySelector(".calendar__next");

  if (!calendarEl) return;

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  let calendarData = {};
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1); // 今月
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1); // 翌々月まで

  // JSONを読み込む
  fetch("/assets/data/calendar.json")
    .then((res) => res.json())
    .then((data) => {
      calendarData = data;
      renderCalendar(currentYear, currentMonth);
    })
    .catch((err) => console.error("カレンダーデータの読み込みエラー:", err));

  function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    const ymKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthData = calendarData[ymKey];

    // タイトル（例：2025年9月）
    titleEl.textContent = `${year}年${month + 1}月`;

    let html = '<table class="calendar__table">';
    html += "<thead><tr>";
    ["日", "月", "火", "水", "木", "金", "土"].forEach(
      (d) => (html += `<th>${d}</th>`)
    );
    html += "</tr></thead><tbody><tr>";

    // 空白セル
    for (let i = 0; i < startDay; i++) {
      html += "<td></td>";
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      let mark = "◯";
      let className = "";

      if (dateObj < today) {
        mark = "";
        className = "calendar__day--past";
      } else if (monthData && monthData.closed.includes(dateString)) {
        mark = "×";
        className = "calendar__day--closed";
      } else if (monthData) {
        // openの日を青く
        mark = "◯";
        className = "calendar__day--open";
      } else {
        mark = "未定";
        className = "calendar__day--future";
      }

      html += `<td class="${className}"><span>${day}<br>${mark}</span></td>`;

      if ((startDay + day) % 7 === 0) {
        html += "</tr><tr>";
      }
    }

    html += "</tr></tbody></table>";
    calendarEl.innerHTML = html;
  }

  // ナビゲーション制御
  prevBtn.addEventListener("click", () => {
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    if (prevDate >= minDate) {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    }
  });

  nextBtn.addEventListener("click", () => {
    const nextDate = new Date(currentYear, currentMonth + 1, 1);
    if (nextDate <= maxDate) {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    }
  });
});
