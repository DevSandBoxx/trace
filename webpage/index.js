
let webcamStream;
let mediaRecorder;
let recordedChunks = [];

async function startWebcam() {
  const videoElement = document.getElementById('videoElement');
  const statusElement = document.getElementById('status');

  // Check if browser supports getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      // Request video stream from webcam
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = webcamStream;
      statusElement.textContent = "Webcam is live!";
    } catch (error) {
      statusElement.textContent = "Error: Unable to access webcam.";
      console.error('Error accessing webcam:', error);
    }
  } else {
    statusElement.textContent = "getUserMedia is not supported in this browser.";
  }
}

// Function to stop the webcam stream
function stopWebcam() {
  const statusElement = document.getElementById('status');

  if (webcamStream) {
    // Get all the video tracks and stop them
    const tracks = webcamStream.getTracks();
    tracks.forEach(track => track.stop());
    statusElement.textContent = "Webcam has been stopped.";
  } else {
    statusElement.textContent = "No webcam stream to stop.";
  }
}

function startRecording() {
  recordedChunks = [];
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(webcamStream, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = url;
    downloadLink.download = 'recorded_video.webm';
    downloadLink.style.display = 'inline';
    downloadLink.textContent = 'Download Video';
  };

  mediaRecorder.start();
  document.getElementById('startRec').disabled = true;
  document.getElementById('stopRec').disabled = false;
  document.getElementById('status').textContent = 'Recording...';
  document.getElementById('recording-indicator').style.display = 'block'; // Show recording indicator
}

function stopRecording() {
  mediaRecorder.stop();
  document.getElementById('startRec').disabled = false;
  document.getElementById('stopRec').disabled = true;
  document.getElementById('status').textContent = 'Recording stopped.';
  document.getElementById('recording-indicator').style.display = 'none'; // Hide recording indicator
}


// Start webcam when the page loads
// window.onload = startWebcam;