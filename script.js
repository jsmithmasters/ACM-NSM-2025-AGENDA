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
            rows.forEach(row => {
                const userID = row.c[0]?.v; // Column 0 = ID
                if (userID == userId) {
                    found = true;
                    document.getElementById("agenda").innerHTML = `
                        <h2>Agenda for ${row.c[1]?.v}</h2>
                        <p><strong>Breakout Session:</strong> ${row.c[2]?.v} at ${row.c[3]?.v}</p>
                        <p><strong>Room:</strong> ${row.c[4]?.v}</p>
                        <p><strong>Dinner Table:</strong> ${row.c[5]?.v}</p>
                        <p><strong>Notes:</strong> ${row.c[6]?.v}</p>
                    `;
                }
            });

            if (!found) {
                document.getElementById("agenda").innerHTML = "<p>No agenda found for this ID.</p>";
            }
        })
        .catch(error => console.error("Error fetching data:", error));
}
