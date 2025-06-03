document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  let userEmail = urlParams.get("email");

  if (userEmail) {
    userEmail = userEmail.toLowerCase();
    document.getElementById("emailInput").value = userEmail;
    loadAgenda(userEmail);
    setInterval(() => loadAgenda(userEmail), 30000);
    setInterval(updateCurrentEventHighlight, 30000);
  }
});

function parseTime(timeStr, referenceDate) {
  let [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    hours,
    minutes || 0
  );
}

const dayMapping = {
  "Day 1": new Date(2025, 5, 16),
  "Day 2": new Date(2025, 5, 17),
  "Day 3": new Date(2025, 5, 18),
  "Day 4": new Date(2025, 5, 19)
};

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function updateCurrentEventHighlight() {
  const now = new Date();
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

    let startDate = parseTime(startStr, eventDate);
    let endDate = endStr ? parseTime(endStr, eventDate) : null;

    events.push({ startDate, endDate, element: item });
  });

  events.sort((a, b) => a.startDate - b.startDate);

  let currentEvent = null;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (
      now >= event.startDate &&
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
  const apiUrl = `https://script.google.com/macros/s/AKfycby0OVCPk5e3Fzx29zf7BB0JS8YvJvXithiGcwgYqIooKEAvk0dqR8XgBRbWJ1tR7-9GFA/exec?email=${encodeURIComponent(userEmail)}`;

  fetch(apiUrl)
    .then(res => res.json())
    .then(rows => {
      if (!rows || rows.length === 0) {
        document.getElementById("agenda").innerHTML = "<p>No agenda found for this email.</p>";
        return;
      }

      let attendeeName = rows[0]["Name"] || "Unknown Attendee";
      let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [], "Day 4": [] };
      let nomineeVideo = null;

      rows.forEach(row => {
        let day = row["Day"] || "Other";
        let session = row["Breakout Session"] || "TBD";
        let time = row["Time"] || "TBD";
        let room = row["Room"] || "TBD";
        let table = row["Dinner Table"] || "";
        let notes = row["Special Notes"] || "";

        if (!nomineeVideo && row["Nominee Video"]) {
          nomineeVideo = row["Nominee Video"];
        }

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
      });

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

      if (nomineeVideo) {
        const section = document.getElementById("nomineeSection");
        const button = document.getElementById("playNomineeVideoBtn");
        const wrapper = document.getElementById("videoWrapper");
        const source = document.getElementById("nomineeVideoSrc");
        const video = source.closest("video");

        source.src = nomineeVideo;
        section.style.display = "block";

        button.addEventListener("click", () => {
          video.load(); // refresh the video
          video.play(); // autoplay
          wrapper.style.display = "block";
          button.style.display = "none";
        });
      }

      updateCurrentEventHighlight();
    })
    .catch(error => {
      console.error("Error fetching agenda:", error);
      document.getElementById("agenda").innerHTML =
        "<p>Error loading agenda. Please try again.</p>";
    });
}
