document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (id) {
        loadAgenda(id);
    }

    // Load Dark Mode Preference
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});

function loadAgenda(userId) {
    if (!userId) {
        userId = document.getElementById("userId").value;
    }
    if (!userId) {
        alert("Please enter a valid ID.");
        return;
    }

    const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            try {
                const jsonData = JSON.parse(data.substring(47).slice(0, -2));
                const rows = jsonData.table.rows;

                let found = false;
                let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [], "Day 4": [] };
                let attendeeName = "Unknown Attendee";

                rows.forEach(row => {
                    const userID = row.c[0]?.v;
                    if (userID == userId) {
                        found = true;
                        attendeeName = row.c[1]?.v || "Unknown Attendee";
                        let day = row.c[2]?.v || "Other";  
                        let session = row.c[3]?.v || "TBD"; 
                        let time = formatDate(row.c[4]?.v); 
                        let room = row.c[5]?.v ? row.c[5]?.v : "TBD";  
                        let table = row.c[6]?.v ? row.c[6]?.v : "Not Assigned";  
                        let notes = row.c[7]?.v ? row.c[7]?.v : "No Notes";  

                        if (!agendaData[day]) {  
                            agendaData[day] = [];  
                        }
                        
                        agendaData[day].push(
                            `<p><strong>${session}</strong> at ${time}<br>
                            <i class="fa-solid fa-door-open"></i> Room: ${room}  
                            | <i class="fa-solid fa-utensils"></i> Table: ${table}  
                            | <i class="fa-solid fa-sticky-note"></i> Notes: ${notes}</p>`
                        );
                    }
                });

                if (!found) {
                    document.getElementById("agenda").innerHTML = "<p>No agenda found for this ID.</p>";
                } else {
                    document.getElementById("attendeeName").innerText = `Welcome, ${attendeeName}! We're glade to have you here. Your personalized agenda is ready.`;
                    document.getElementById("day1-content").innerHTML = (agendaData["Day 1"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day2-content").innerHTML = (agendaData["Day 2"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day3-content").innerHTML = (agendaData["Day 3"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day4-content").innerHTML = (agendaData["Day 4"] || []).join("") || "<p>No events scheduled.</p>";
                    showAgendaSections();
                    highlightNextEvent();
                }
            } catch (error) {
                console.error("Error processing JSON:", error);
                document.getElementById("agenda").innerHTML = "<p>Error loading agenda. Please try again.</p>";
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            document.getElementById("agenda").innerHTML = "<p>Error loading agenda. Please try again.</p>";
        });
}

function showAgendaSections() {
    document.querySelectorAll(".day-section").forEach(section => {
        section.classList.add("show");
    });
}

function highlightNextEvent() {
    let allEvents = document.querySelectorAll(".day-section p");
    let now = new Date().getTime();

    allEvents.forEach(event => {
        let eventText = event.innerText.match(/\d{1,2}:\d{2} [APM]{2}/);
        if (eventText) {
            let eventTime = new Date("2025-01-15 " + eventText[0]).getTime();
            if (eventTime > now) {
                event.classList.add("next-event");
                return;
            }
        }
    });
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// ✅ Function to correctly format Google Sheets dates
function formatDate(excelDate) {
    if (!excelDate) return "TBD";  
    if (typeof excelDate === "string") return excelDate; // If already a string, return it as-is
    let date = new Date((excelDate - 25569) * 86400000);  
    return date.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}
