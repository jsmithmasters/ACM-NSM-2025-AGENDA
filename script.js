document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    let userEmail = urlParams.get("email");
    if (userEmail) {
        userEmail = userEmail.toLowerCase();
        document.getElementById("emailInput").value = userEmail;
        loadAgenda(userEmail);
        // Auto-refresh agenda every 30 seconds
        setInterval(() => loadAgenda(userEmail), 30000);
        // Update current event highlight every 30 seconds
        setInterval(updateCurrentEventHighlight, 30000);
    }
});

// Helper function to parse a time string (e.g., "9:00 AM") into a Date object.
function parseTime(timeStr) {
    let now = new Date();
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier?.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier?.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    const parsedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes || 0);
    console.log(`Parsed time for "${timeStr}":`, parsedTime);
    return parsedTime;
}

// Helper function to compare if two dates fall on the same day.
function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

// Mapping from day label (from the sheet) to actual calendar dates.
// Note: Months are zero-indexed (June = 5).
const dayMapping = {
    "Day 1": new Date(2025, 5, 16),
    "Day 2": new Date(2025, 5, 17),
    "Day 3": new Date(2025, 5, 18),
    "Day 4": new Date(2025, 5, 19)
};

// Update the current event highlight based on current time (only for events on today's mapped day).
function updateCurrentEventHighlight() {
    const now = new Date();
    console.log("Current time:", now);

    // Remove any existing highlight.
    const agendaItems = document.querySelectorAll('.agenda-item');
    agendaItems.forEach(item => item.classList.remove('current'));

    // Build an array of events for today.
    let events = [];
    agendaItems.forEach(item => {
        let eventDay = item.getAttribute('data-day');
        if (!eventDay) return;
        let eventDate = dayMapping[eventDay];
        // Only process events for which the mapped date is today.
        if (!isSameDay(now, eventDate)) return;

        let startStr = item.getAttribute('data-start');
        let endStr = item.getAttribute('data-end');
        if (!startStr || !endStr) return;

        let startDate = parseTime(startStr);
        let endDate = parseTime(endStr);
        // Adjust start time: 5 minutes before the scheduled start.
        let adjustedStart = new Date(startDate.getTime() - 5 * 60000);
        console.log(`For event "${item.innerText.trim().slice(0, 20)}..." on ${eventDay}, adjusted start is:`, adjustedStart, "and end time is:", endDate);
        events.push({ adjustedStart, endDate, element: item });
    });

    // Sort events by adjusted start time.
    events.sort((a, b) => a.adjustedStart - b.adjustedStart);

    // Determine which event is current.
    let currentEvent = null;
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let nextEvent = events[i + 1];
        if (now >= event.adjustedStart) {
            if (nextEvent) {
                if (now < nextEvent.adjustedStart) {
                    currentEvent = event;
                    break;
                }
            } else {
                if (now < event.endDate) {
                    currentEvent = event;
                    break;
                }
            }
        }
    }

    if (currentEvent) {
        console.log("Highlighting current event:", currentEvent);
        currentEvent.element.classList.add('current');
    } else {
        console.log("No current event found at this time.");
    }
}

// Load Agenda from Google Sheets.
function loadAgenda(userEmail) {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            console.log("Raw data from Sheets:", data);
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
                        let day = row.c[2]?.v || "Other"; // Expected values: "Day 1", "Day 2", etc.
                        let session = row.c[3]?.v || "TBD";
                        let time = row.c[4]?.v || "TBD";  // Expected format: "9:00 AM - 10:00 AM"
                        let room = row.c[5]?.v || "TBD";
                        let table = row.c[6]?.v || "Not Assigned";
                        let notes = row.c[7]?.v || "No Notes";

                        // Split time into start and end times.
                        let timeParts = time.split("-");
                        let startTime = timeParts[0]?.trim() || "TBD";
                        let endTime = timeParts[1] ? timeParts[1].trim() : "TBD";

                        if (!agendaData[day]) {
                            agendaData[day] = [];
                        }

                        // Build the agenda item with data attributes for start, end, and day.
                        agendaData[day].push(`
                            <div class="agenda-item" data-start="${startTime}" data-end="${endTime}" data-day="${day}">
                                <p><strong>Session:</strong> ${session}</p>
                                <p><i class="fa-regular fa-clock"></i> <strong>Time:</strong> ${time}</p>
                                <p><i class="fa-solid fa-map-marker-alt"></i> <strong>Room:</strong> ${room}</p>
                                <p><i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${table}</p>
                                <p><i class="fa-solid fa-comment-dots"></i> <strong>Notes:</strong> ${notes}</p>
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
                    // Immediately update the current event highlight after loading.
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

// Nominee Message & Video Display.
function showNomineeMessage(attendeeName, userEmail) {
    const nomineeEmails = {
        "jesse.smith@conagra.com": "Ov6OeEutv_Q"
    };

    if (nomineeEmails[userEmail]) {
        let videoID = nomineeEmails[userEmail];
        let videoSrc = `https://www.youtube.com/embed/${videoID}?autoplay=1`;

        // Adjusted video styling: width is 100% up to a max of 600px, with a 16:9 ratio.
        document.getElementById("nomineeSection").innerHTML = `
            <h2 class="nominee-title">🌟 Congratulations, ${attendeeName}! 🌟</h2>
            <p class="nominee-text">You are a nominee for an award!</p>
            <div style="max-width:600px; margin: 0 auto;">
                <iframe id="nomineeVideo" style="width:100%; aspect-ratio:16/9;" src="${videoSrc}" 
                    frameborder="0" allowfullscreen></iframe>
            </div>
        `;
  .watermark-logo {
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 80px;
    opacity: 0.1;
    pointer-events: none;
    z-index: 10;
}

    }
}
