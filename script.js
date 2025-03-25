document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email");

    if (userEmail) {
        document.getElementById("emailInput").value = userEmail;
        loadAgenda(userEmail.toLowerCase());
        checkQASession(userEmail.toLowerCase());
        // Auto-refresh agenda every 30 seconds
        setInterval(() => loadAgenda(userEmail.toLowerCase()), 30000);
        // Update current event highlight every 30 seconds
        setInterval(updateCurrentEventHighlight, 30000);
    }
});

// Helper function to parse a time string (e.g., "9:00 AM") into a Date object for today.
function parseTime(timeStr) {
    let now = new Date();
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    const parsedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    console.log(`Parsed time for "${timeStr}":`, parsedTime);
    return parsedTime;
}

// Update the current event highlight based on current time.
function updateCurrentEventHighlight() {
    const now = new Date();
    console.log("Current time:", now);

    // Remove any existing highlight.
    const agendaItems = document.querySelectorAll('.agenda-item');
    agendaItems.forEach(item => item.classList.remove('current'));

    // Build an array of events with their adjusted start (5 minutes before) and end times.
    let events = [];
    agendaItems.forEach(item => {
        let startStr = item.getAttribute('data-start');
        let endStr = item.getAttribute('data-end');
        if (!startStr || !endStr) return;

        let startDate = parseTime(startStr);
        let endDate = parseTime(endStr);
        // Adjust the start time: subtract 5 minutes.
        let adjustedStart = new Date(startDate.getTime() - 5 * 60000);
        console.log(`For event "${item.innerText.trim().slice(0, 20)}...", adjusted start is:`, adjustedStart, "and end time is:", endDate);
        events.push({ adjustedStart, endDate, element: item });
    });

    // Sort events by their adjusted start times.
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
            // Debug: Log the raw data from Google Sheets.
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
                        let day = row.c[2]?.v || "Other";
                        let session = row.c[3]?.v || "TBD";
                        let time = row.c[4]?.v || "TBD";  // Expected format: "9:00 AM - 10:00 AM"
                        let room = row.c[5]?.v || "TBD";
                        let table = row.c[6]?.v || "Not Assigned";
                        let notes = row.c[7]?.v || "No Notes";

                        // Split time into start and end times.
                        let timeParts = time.split("-");
                        let startTime = timeParts[0].trim();
                        let endTime = timeParts[1] ? timeParts[1].trim() : "TBD";

                        if (!agendaData[day]) {
                            agendaData[day] = [];
                        }

                        // Build the agenda item with data attributes for start and end times.
                        agendaData[day].push(`
                            <div class="agenda-item" data-start="${startTime}" data-end="${endTime}">
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

// Q&A Control: Enable or Hide Question Form Based on Google Sheets.
function checkQASession(userEmail) {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            try {
                const jsonData = JSON.parse(data.substring(47).slice(0, -2));
                const rows = jsonData.table.rows;

                let userSession = null;
                let speakerEmail = null;
                let questionsEnabled = "NO";

                rows.forEach(row => {
                    const email = row.c[0]?.v?.toLowerCase();
                    if (email === userEmail) {
                        userSession = row.c[3]?.v || "Unknown Session";  // Breakout Session
                        speakerEmail = row.c[10]?.v || "No Speaker";
                        questionsEnabled = row.c[9]?.v || "NO"; // Q&A Enabled
                    }
                });

                if (questionsEnabled.trim().toUpperCase() === "YES") {
                    document.getElementById("questionSection").style.display = "block";
                    document.getElementById("questionSessionName").innerText = userSession;
                    document.getElementById("questionSpeaker").innerText = speakerEmail;
                } else {
                    document.getElementById("questionSection").style.display = "none";
                }
            } catch (error) {
                console.error("Error checking Q&A toggle:", error);
            }
        })
        .catch(error => {
            console.error("Error fetching Q&A status:", error);
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

        document.getElementById("nomineeSection").innerHTML = `
            <h2 class="nominee-title">🌟 Congratulations, ${attendeeName}! 🌟</h2>
            <p class="nominee-text">You are a nominee for an award at this event!</p>
            <iframe id="nomineeVideo" width="500" height="280" src="${videoSrc}" 
                frameborder="0" allowfullscreen></iframe>
        `;
    }
}

// Submit Question to Google Sheets.
function submitQuestion() {
    const question = document.getElementById("questionInput").value.trim();
    const userEmail = document.getElementById("emailInput").value;
    const sessionName = document.getElementById("questionSessionName").innerText;
    const speakerEmail = document.getElementById("questionSpeaker").innerText;

    if (question === "") {
        document.getElementById("questionMessage").innerHTML = "⚠️ Please enter a question!";
        return;
    }

    const scriptURL = "https://script.google.com/macros/s/AKfycby2FVlQuGEfCzFLaS8SK9giwWtIbVqg_seCR_p7FLmRJWQmo1_d7eTmcKn6KiumiGWzpQ/exec";

    fetch(scriptURL, {
        method: "POST",
        body: JSON.stringify({
            email: userEmail,
            session: sessionName,
            speaker: speakerEmail,
            question: question
        }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById("questionMessage").innerHTML = "✅ Question submitted!";
            document.getElementById("questionInput").value = "";
        } else {
            document.getElementById("questionMessage").innerHTML = "❌ Error submitting question.";
        }
    })
    .catch(error => {
        console.error("Error submitting question:", error);
        document.getElementById("questionMessage").innerHTML = "❌ Error submitting question.";
    });
}
