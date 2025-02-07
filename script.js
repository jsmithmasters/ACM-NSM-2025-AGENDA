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

    const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            try {
                const jsonData = JSON.parse(data.substring(47).slice(0, -2));
                const rows = jsonData.table.rows;

                let found = false;
                let agendaData = { "Day 1 - ACM": [], "Day 2 Process Proud": [], "Day 3 Market Proud": [], "Day 4 People Proud": [] };

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

                        if (agendaData[day]) {
                            agendaData[day].push(
                                `<p><strong>${session}</strong> at ${time}<br>
                                <img src="home.png" class="icon"> Room: ${room}  
                                | <img src="table.png" class="icon"> Table: ${table}  
                                | <img src="notes.png" class="icon"> Notes: ${notes}</p>`
                            );
                        }
                    }
                });

                if (!found) {
                    document.getElementById("agenda").innerHTML = "<p>No agenda found for this ID.</p>";
                } else {
                    document.getElementById("agenda").innerHTML = `
                        <h2>Agenda for ${rows.find(row => row.c[0]?.v == userId)?.c[1]?.v}</h2>
                        <div class="day-section"><h3>Day 1 - Kickoff & Strategy</h3>${agendaData["Day 1"].join("") || "<p>No events scheduled.</p>"}</div>
                        <div class="day-section"><h3>Day 2 - Workshops & Training</h3>${agendaData["Day 2"].join("") || "<p>No events scheduled.</p>"}</div>
                        <div class="day-section"><h3>Day 3 - Collaboration & Execution</h3>${agendaData["Day 3"].join("") || "<p>No events scheduled.</p>"}</div>
                        <div class="day-section"><h3>Day 4 - Wrap-up & Networking</h3>${agendaData["Day 4"].join("") || "<p>No events scheduled.</p>"}</div>
                    `;
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
