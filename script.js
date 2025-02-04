document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (id) {
        loadAgenda(id);
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

    const sheetURL = "https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            const jsonData = JSON.parse(data.substring(47).slice(0, -2));
            const rows = jsonData.table.rows;

            let found = false;
            let agendaData = { "Day 1": [], "Day 2": [], "Day 3": [] };

            rows.forEach(row => {
                const userID = row.c[0]?.v;
                if (userID == userId) {
                    found = true;
                    let day = row.c[2]?.v || "Other";  // Column "Day"
                    let session = row.c[3]?.v || "TBD"; // Column "Breakout Session"
                    let time = formatDate(row.c[4]?.v); // Column "Time"
                    let room = row.c[5]?.v || "TBD";  // Column "Room"
                    let table = row.c[6]?.v || "TBD";  // Column "Dinner Table"
                    let notes = row.c[7]?.v || "-";  // Column "Notes"

                    agendaData[day].push(`<p><strong>${session}</strong> at ${time}<br>📍 Room: ${room} | 🍽 Table: ${table}<br>📌 Notes: ${notes}</p>`);
                }
            });

            if (!found) {
                document.getElementById("agenda").innerHTML = "<p>No agenda found for this ID.</p>";
            } else {
                document.getElementById("agenda").innerHTML = `
                    <h2>Agenda for ${rows.find(row => row.c[0]?.v == userId)?.c[1]?.v}</h2>
                    <div class="day-section"><h3>Day 1</h3>${agendaData["Day 1"].join("") || "<p>No events scheduled.</p>"}</div>
                    <div class="day-section"><h3>Day 2</h3>${agendaData["Day 2"].join("") || "<p>No events scheduled.</p>"}</div>
                    <div class="day-section"><h3>Day 3</h3>${agendaData["Day 3"].join("") || "<p>No events scheduled.</p>"}</div>
                `;
            }
        })
        .catch(error => console.error("Error fetching data:", error));
}

// ✅ Function to fix date formatting
function formatDate(excelDate) {
    if (!excelDate) return "TBD";  // If no date is available
    let date = new Date((excelDate - 25569) * 86400000);  // Convert Google Sheets number to JS Date
    return date.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}
