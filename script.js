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

function toggleDay(header) {
  const content = header.nextElementSibling;
  const icon = header.querySelector('i');

  if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    header.classList.add('collapsed');
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
    content.style.maxHeight = null;
  } else {
    content.classList.add('expanded');
    header.classList.remove('collapsed');
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
    content.style.maxHeight = content.scrollHeight + "px";
  }
}

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
    let endDate = endStr && endStr !== "TBD" ? parseTime(endStr, eventDate) : null;

    events.push({ startDate, endDate, element: item });
  });

  events.sort((a, b) => a.startDate - b.startDate);

  let currentEvent = null;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (
      new Date() >= event.startDate &&
      (!event.endDate || new Date() < event.endDate)
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
      console.log("Fetched rows:", rows);

      if (!rows || rows.length === 0) {
        document.getElementById("agenda").innerHTML = "<p>No agenda found for this email.</p>";
        return;
      }

      let attendeeName = rows[0]["Name"] || "Unknown Attendee";
      let firstName = attendeeName.split(" ")[0];
      document.getElementById("attendeeName").innerHTML =
        `Welcome, ${firstName}! Your personalized agenda is ready.`;

      let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [], "Day 4": [] };
      let nomineeVideoExists = rows.some(row => row["Nominee Video"]);

      rows.forEach(row => {
        let day = row["Day"] || "Other";
        let session = row["Breakout Session"] || "TBD";
        let time = row["Time"] || "TBD";
        let room = row["Room"] && row["Room"].trim() !== "" ? row["Room"] : null;
        let table = row["Dinner Table"] || "";
        let notes = row["Special Notes"] || "";

        let timeParts = time.split("-");
        let startTime = timeParts[0]?.trim() || "TBD";
        let endTime = timeParts[1] ? timeParts[1].trim() : "TBD";

        if (!agendaData[day]) agendaData[day] = [];

        let roomHTML = room ? `<p class="room"><i class="fa-solid fa-map-marker-alt"></i> <strong>Room:</strong> ${room}</p>` : "";
        let tableHTML = table && table !== "Not Assigned"
          ? `<p class="table"><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${table}</p>` : "";
        let notesHTML = notes && notes !== "No Notes"
          ? `<p class="notes"><i class="fa-solid fa-comment-dots"></i> <strong>Notes:</strong> ${notes}</p>` : "";

        agendaData[day].push({
          html: `
            <div class="agenda-item" data-start="${startTime}" data-end="${endTime}" data-day="${day}">
              <p><strong>Session:</strong> ${session}</p>
              <p><i class="fa-regular fa-clock"></i> <strong>Time:</strong> ${time}</p>
              ${roomHTML}
              ${tableHTML}
              ${notesHTML}
            </div>
          `,
          endTime: endTime !== "TBD" ? parseTime(endTime, dayMapping[day]) : null
        });
      });

      ["Day 1", "Day 2", "Day 3", "Day 4"].forEach((day, index) => {
        const contentId = `day${index + 1}-content`;
        const sectionId = `day${index + 1}`;
        const content = document.getElementById(contentId);
        const section = document.getElementById(sectionId);
        const items = agendaData[day] || [];

        if (items.length === 0) {
          section.style.display = "none";
        } else {
          console.log(`Agenda for ${day}`, items);
          content.innerHTML = items.map(i => i.html).join("");
          section.style.display = "block";
          content.classList.add('expanded');
          content.style.maxHeight = content.scrollHeight + "px";

          // 💡 Reset chevron state
          const header = section.querySelector('h3');
          const icon = header.querySelector('i');
          header.classList.remove('collapsed');
          icon.classList.remove('fa-chevron-down');
          icon.classList.add('fa-chevron-up');
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
          video.play().catch(err => {
            console.warn("Video play failed or was blocked:", err);
          });
        };
      }

      updateCurrentEventHighlight();
    })
    .catch(error => {
      console.error("Error fetching agenda:", error);
      document.getElementById("agenda").innerHTML =
        "<p>Error loading agenda. Please try again.</p>";
    });
}
