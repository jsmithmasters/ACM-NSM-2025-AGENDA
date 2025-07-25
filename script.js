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

  const toggles = document.querySelectorAll('.day-section h3');
  toggles.forEach(header => {
    header.addEventListener('click', function () {
      const content = this.nextElementSibling;
      const icon = this.querySelector('i');
      if (!content.classList.contains('expanded')) {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.add('expanded');
      } else {
        content.style.maxHeight = null;
        content.classList.remove('expanded');
      }
    });
  });
});

function parseTime(timeStr, referenceDate) {
  let [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), hours, minutes || 0);
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
    let endDate = endStr && endStr !== "TBD" ? parseTime(endStr, eventDate) : null;

    events.push({ startDate, endDate, element: item });
  });

  events.sort((a, b) => a.startDate - b.startDate);

  let currentEvent = events.find(event =>
    new Date() >= event.startDate &&
    (!event.endDate || new Date() < event.endDate)
  );

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

      let firstName = (rows[0]["Name"] || "Unknown Attendee").split(" ")[0];
      document.getElementById("attendeeName").innerHTML = `Welcome, ${firstName}! Your personalized agenda is ready.`;

      let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [], "Day 4": [] };
      let nomineeVideoExists = rows.some(row => row["Nominee Video"]);

      rows.forEach(row => {
        const day = row["Day"] || "Other";
        const session = row["Breakout Session"] || "TBD";
        const time = row["Time"] || "TBD";
        const room = row["Room"]?.trim() || "";
        const table = row["Dinner Table"] || "";
        const notes = row["Special Notes"] || "";

        const [startTime, endTime] = time.split("-").map(t => t?.trim() || "TBD");

        if (!agendaData[day]) agendaData[day] = [];

        agendaData[day].push(`
          <div class="agenda-item" data-start="${startTime}" data-end="${endTime}" data-day="${day}">
            <p><strong>Session:</strong> ${session}</p>
            <p><i class="fa-regular fa-clock"></i> <strong>Time:</strong> ${time}</p>
            ${room ? `<p class="room"><i class="fa-solid fa-map-marker-alt"></i> <strong>Room:</strong> ${room}</p>` : ""}
            ${table && table !== "Not Assigned" ? `<p class="table"><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${table}</p>` : ""}
            ${notes && notes !== "No Notes" ? `<p class="notes"><i class="fa-solid fa-comment-dots"></i> <strong>Notes:</strong> ${notes}</p>` : ""}
          </div>
        `);
      });

      ["Day 1", "Day 2", "Day 3", "Day 4"].forEach((day, index) => {
        const content = document.getElementById(`day${index + 1}-content`);
        const section = document.getElementById(`day${index + 1}`);
        const items = agendaData[day] || [];

        if (items.length === 0) {
          section.style.display = "none";
        } else {
          content.innerHTML = items.join("");
          section.style.display = "block";
          content.classList.add("expanded");
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });

      if (nomineeVideoExists) {
        const section = document.getElementById("nomineeSection");
        const button = document.getElementById("playNomineeVideoBtn");
        const wrapper = document.getElementById("videoWrapper");
        const video = document.getElementById("nomineeVideo");

        section.style.display = "block";
        button.onclick = () => {
          wrapper.style.display = "block";
          button.style.display = "none";
          video.load();
          video.play().catch(err => console.warn("Video play failed:", err));
        };
      }

      updateCurrentEventHighlight();
    })
    .catch(error => {
      console.error("Error fetching agenda:", error);
      document.getElementById("agenda").innerHTML = "<p>Error loading agenda. Please try again.</p>";
    });
}
