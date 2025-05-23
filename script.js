// === NOMINEE VIDEO LOGIC ===
document.addEventListener("DOMContentLoaded", function () {
  const playButton = document.getElementById("playNomineeVideoBtn");
  const videoWrapper = document.getElementById("videoWrapper");
  const sourceElement = document.getElementById("nomineeVideoSrc");
  const videoElement = sourceElement.closest("video");

  if (playButton && sourceElement && videoElement && videoWrapper) {
    playButton.addEventListener("click", function () {
      const videoSrc = "nomination_fr.mp4"; // Update this if dynamically pulling from Google Sheets
      sourceElement.src = videoSrc;
      videoElement.load();
      videoWrapper.style.display = "block";
    });
  }
});

// === OPTIONAL: EMAIL PREFILL & NAME DISPLAY ===
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", function () {
  const email = getQueryParam("email");
  const emailInput = document.getElementById("emailInput");
  const nameHeader = document.getElementById("attendeeName");

  if (email) {
    emailInput.value = email;
    const name = email.split("@")[0].replace(".", " ");
    nameHeader.textContent = `Welcome ${name.charAt(0).toUpperCase() + name.slice(1)}! Your personalized agenda is ready.`;
  }
});

// === PLACEHOLDER: Your existing agenda loading logic goes below ===
// Example: fetch Google Sheet data and populate #agenda content areas.
