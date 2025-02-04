document.addEventListener("DOMContentLoaded", function () {
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

    const sheetURL = "https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9IJKLMNOPQRSTUVWXYZ/gviz/tq?tqx=out:json";

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
                    let day = row.c[2]?.v || "Other";  
                    let session = row.c[3]?.v || "TBD"; 
                    let time = formatDate(row.c[4]?.v); 
                    let room = row.c[5]?.v ? row.c[5]?.v : "TBD";  
                    let table = row.c[6]?.v ? row.c[6]?.v : "Not Assigned";  
                    let notes = row.c[7]?.v ? row.c[7]?.v : "No Notes";  

                    agendaData[day].push(
                        `<p><strong>${session}</strong> at ${time}<br>
                        📍 Room: ${room} | 🍽 Table: ${table}<br>
                        📌 Notes: ${notes}</p>`
                    );
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

// ✅ Updated function to correctly format Google Sheets date
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
