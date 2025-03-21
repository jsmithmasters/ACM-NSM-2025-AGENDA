document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email");

    if (userEmail) {
        document.getElementById("emailInput").value = userEmail;
        loadAgenda(userEmail);
        checkQASession(userEmail); // Only enable Q&A if the session allows it
        setInterval(() => loadAgenda(userEmail), 30000); // Auto-refresh every 30 seconds
    }
});

// ✅ Check Google Sheets for which sessions have Q&A enabled
function checkQASession(userEmail) {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1TOi1FJbyBpCUZ0RL9XgH8Kvl9R3VspUcmD0XWUQubuE/gviz/tq?tqx=out:json";

    fetch(sheetURL)
        .then(res => res.text())
        .then(data => {
            const jsonData = JSON.parse(data.substring(47).slice(0, -2));
            const rows = jsonData.table.rows;

            let userSession = null;
            let speakerEmail = null;
            let questionsEnabled = "NO";

            rows.forEach(row => {
                const email = row.c[0]?.v?.toLowerCase();
                if (email === userEmail) {
                    userSession = row.c[3]?.v || "Unknown Session"; // Breakout Session Name
                    speakerEmail = row.c[10]?.v || "No Speaker"; // Speaker Email
                    questionsEnabled = row.c[9]?.v || "NO"; // YES/NO for Q&A
                }
            });

            if (questionsEnabled === "YES") {
                document.getElementById("questionSection").style.display = "block"; // Show form
                document.getElementById("questionSessionName").innerText = userSession;
                document.getElementById("questionSpeaker").innerText = speakerEmail;
            } else {
                document.getElementById("questionSection").style.display = "none"; // Hide form
            }
        })
        .catch(error => console.error("Error checking Q&A status:", error));
}

// ✅ Submit Question to Google Sheets (Only for Enabled Sessions)
function submitQuestion() {
    const question = document.getElementById("questionInput").value.trim();
    const userEmail = document.getElementById("emailInput").value;
    const sessionName = document.getElementById("questionSessionName").innerText;
    const speakerEmail = document.getElementById("questionSpeaker").innerText;

    if (question === "") {
        document.getElementById("questionMessage").innerHTML = "⚠️ Please enter a question!";
        return;
    }

    const sheetURL = "https://script.google.com/macros/s/AKfycby2FVlQuGEfCzFLaS8SK9giwWtIbVqg_seCR_p7FLmRJWQmo1_d7eTmcKn6KiumiGWzpQ/exec";
    
    fetch(sheetURL, {
        method: "POST",
        body: JSON.stringify({ email: userEmail, session: sessionName, speaker: speakerEmail, question: question }),
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
    .catch(error => console.error("Error submitting question:", error));
}
