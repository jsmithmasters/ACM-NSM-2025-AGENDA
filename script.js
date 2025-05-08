document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  let userEmail = urlParams.get("email");
  const previewParam = urlParams.get("previewDate");
  const now = getNow(previewParam);

  const daySections = {
    "day1": new Date(2025, 5, 16),
    "day2": new Date(2025, 5, 17),
    "day3": new Date(2025, 5, 18),
    "day4": new Date(2025, 5, 19)
  };

  Object.entries(daySections).forEach(([id, date]) => {
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setHours(0, 0, 0, 0);

    if (now >= dayEnd) {
      const section = document.getElementById(id);
      if (section) section.style.display = "none";
    }
  });

  if (userEmail) {
    userEmail = userEmail.toLowerCase();
    document.getElementById("emailInput").value = userEmail;
    loadAgenda(userEmail);
    setInterval(() => loadAgenda(userEmail), 30000);
    setInterval(updateCurrentEventHighlight, 30000);
  }
});

function getNow(previewParam) {
  let now = new Date();
  if (previewParam) {
    const previewDate = new Date(previewParam + "T00:00:00");
    const realNow = new Date();
    return new Date(
      previewDate.getFullYear(),
      previewDate.getMonth(),
      previewDate.getDate(),
      realNow.getHours(),
      realNow.getMinutes()
    );
  }
  return now;
}

function parseTime(timeStr) {
  let now = new Date();
  let [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes || 0);
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

const dayMapping = {
  "Day 1": new Date(2025, 5, 16),
  "Day 2": new Date(2025, 5, 17),
  "Day 3": new Date(2025, 5, 18),
  "Day 4": new Date(2025, 5, 19)
};

function updateCurrentEventHighlight() {
  const urlParams = new URLSearchParams(window.location.search);
  const previewParam = urlParams.get("previewDate");
  const now = getNow(previewParam);

  const agendaItems = document.querySelectorAll('.agenda-item');
  agendaItems.forEach(item => item.classList.remove('current'));

  let events = [];
  agendaItems.forEach(item => {
    let eventDay = item.getAttribute('data-day');
    if (!eventDay) return;

    let eventDate = dayMapping[eventDay];
    if (!isSameDay(now, eventDate)) return;

    let startStr = item.getAttribute('data-start');
    let endStr = item.getAttribute('data-end');
    if (!startStr) return;

    let startDate = parseTime(startStr);
    let endDate = endStr ? parseTime(endStr) : null;
    let adjustedStart = new Date(startDate.getTime() - 5 * 60000);

    events.push({ adjustedStart, endDate, element: item });
  });

  events.sort((a, b) => a.adjustedStart - b.adjustedStart);

  let currentEvent = null;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (
      now >= event.adjustedStart &&
      (!event.endDate || now < event.endDate)
    ) {
      currentEvent = event;
    }
  }

  if (currentEvent) {
    currentEvent.element.classList.add('current');
  }
}

function loadAgenda(userEmail) {
  const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

  fetch(sheetURL)
    .then(res => res.text())
    .then(data => {
      try {
        const jsonData = JSON.parse(data.substring(47).slice(0, -2));
        const rows = jsonData.table.rows;

        let found = false;
        let attendeeName = "Unknown Attendee";
        let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [], "Day 4": [] };

        rows.forEach(row => {
          const email = row.c[0]?.v?.toLowerCase();
          if (email === userEmail) {
            found = true;
            attendeeName = row.c[1]?.v || "Unknown Attendee";
            let day = row.c[2]?.v || "Other";
            let session = row.c[3]?.v || "TBD";
            let time = row.c[4]?.v || "TBD";
            let room = row.c[5]?.v || "TBD";
            let table = row.c[6]?.v || "";
            let notes = row.c[7]?.v || "";

            let timeParts = time.split("-");
            let startTime = timeParts[0]?.trim() || "TBD";
            let endTime = timeParts[1] ? timeParts[1].trim() : "TBD";

            if (!agendaData[day]) agendaData[day] = [];

            let tableHTML = table && table !== "Not Assigned"
              ? `<p><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${table}</p>` : "";
            let notesHTML = notes && notes !== "No Notes"
              ? `<p><i class="fa-solid fa-comment-dots"></i> <strong>Notes:</strong> ${notes}</p>` : "";

            agendaData[day].push(`
              <div class="agenda-item" data-start="${startTime}" data-end="${endTime}" data-day="${day}">
                <p><strong>Session:</strong> ${session}</p>
                <p><i class="fa-regular fa-clock"></i> <strong>Time:</strong> ${time}</p>
                <p><i class="fa-solid fa-map-marker-alt"></i> <strong>Room:</strong> ${room}</p>
                ${tableHTML}
                ${notesHTML}
              </div>
            `);
          }
        });

        if (!found) {
          document.getElementById("agenda").innerHTML = "<p>No agenda found for this email.</p>";
        } else {
          document.getElementById("attendeeName").innerHTML =
            `Welcome, ${attendeeName}! Your personalized agenda is ready.`;

          document.getElementById("day1-content").innerHTML =
            (agendaData["Day 1"] || []).join("") || "<p>No events scheduled.</p>";
          document.getElementById("day2-content").innerHTML =
            (agendaData["Day 2"] || []).join("") || "<p>No events scheduled.</p>";
          document.getElementById("day3-content").innerHTML =
            (agendaData["Day 3"] || []).join("") || "<p>No events scheduled.</p>";
          document.getElementById("day4-content").innerHTML =
            (agendaData["Day 4"] || []).join("") || "<p>No events scheduled.</p>";

          showNomineeMessage(attendeeName, userEmail);
          updateCurrentEventHighlight();
        }
      } catch (error) {
        console.error("Error processing agenda:", error);
        document.getElementById("agenda").innerHTML =
          "<p>Error loading agenda. Please try again.</p>";
      }
    })
    .catch(error => {
      console.error("Error fetching agenda:", error);
      document.getElementById("agenda").innerHTML =
        "<p>Error loading agenda. Please try again.</p>";
    });
}

function showNomineeMessage(attendeeName, userEmail) {
  const nomineeEmails = {
    "jesse.smith@conagra.com": "Ov6OeEutv_Q"
  };

  if (nomineeEmails[userEmail]) {
    let videoID = nomineeEmails[userEmail];
    let videoSrc = `https://www.youtube.com/embed/${videoID}?autoplay=1`;

    document.getElementById("nomineeSection").innerHTML = `
      <h2 class="nominee-title">🌟 Congratulations, ${attendeeName}! 🌟</h2>
      <p class="nominee-text">You are a nominee for an award!</p>
      <div style="max-width:600px; margin: 0 auto;">
        <iframe id="nomineeVideo" style="width:100%; aspect-ratio:16/9;" src="${videoSrc}" frameborder="0" allowfullscreen></iframe>
      </div>
    `;
  }
}

