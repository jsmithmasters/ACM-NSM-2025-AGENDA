document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email");

    if (userEmail) {
        document.getElementById("emailInput").value = userEmail;
        loadAgenda(userEmail);
        setInterval(() => loadAgenda(userEmail), 30000); // Auto-refresh every 30 seconds
    }
});

function loadAgenda(userEmail) {
    if (!userEmail) {
        alert("No email found. Please log in again.");
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
                    const email = row.c[0]?.v;
                    if (email === userEmail) {
                        found = true;
                        attendeeName = row.c[1]?.v || "Unknown Attendee";
                        let day = row.c[2]?.v || "Other";  
                        let session = row.c[3]?.v || "TBD"; 
                        let time = row.c[4]?.v || "TBD"; 
                        let room = row.c[5]?.v ? row.c[5]?.v : "TBD";  
                        let table = row.c[6]?.v ? row.c[6]?.v : "Not Assigned";  
                        let notes = row.c[7]?.v ? row.c[7]?.v : "No Notes";  

                        if (!agendaData[day]) {  
                            agendaData[day] = [];  
                        }

                        if (session.trim() !== "" && time.trim() !== "") {
                            agendaData[day].push(
                                `<div class="agenda-item">
                                    <p><strong>${session}</strong> at ${time}</p>
                                    <p>
                                        <i class="fa-solid fa-map-marker-alt"></i> <strong>Room:</strong> ${room}  
                                        | <i class="fa-solid fa-chair"></i> <strong>Table:</strong> ${table}  
                                        | <i class="fa-solid fa-comment-dots"></i> <strong>Notes:</strong> ${notes}
                                    </p>
                                </div>`
                            );
                        }
                    }
                });

                if (!found) {
                    document.getElementById("agenda").innerHTML = "<p>No agenda found for this email.</p>";
                } else {
                    document.getElementById("attendeeName").innerHTML = `Welcome, ${attendeeName}! Your personalized agenda is ready.`;
                    document.getElementById("day1-content").innerHTML = (agendaData["Day 1"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day2-content").innerHTML = (agendaData["Day 2"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day3-content").innerHTML = (agendaData["Day 3"] || []).join("") || "<p>No events scheduled.</p>";
                    document.getElementById("day4-content").innerHTML = (agendaData["Day 4"] || []).join("") || "<p>No events scheduled.</p>";

                    // Update last refreshed time
                    const now = new Date();
                    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    document.getElementById("lastUpdated").innerHTML = `Last updated at: ${formattedTime}`;
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
