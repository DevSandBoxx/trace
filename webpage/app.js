
// Create an IntersectionObserver instance
const observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.5 // Video must be 50% visible to trigger
});

// Select all video elements to observe
const videos = document.querySelectorAll('video');
// const canvas = document.querySelectorAll('canvas');

// console.log(canvas);

videos.forEach(video => {
    observer.observe(video);
});

// canvas.forEach(canva => {
//     observer.observe(canva);
// });


// Import the required TensorFlow.js and Pose Detection library
// function pose_estimator(id, id_canvas,) {
// Import the required TensorFlow.js and Pose Detection library
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Configure MoveNet detector (Lightning model is faster; Thunder is more accurate)
        const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        console.log('MoveNet detector initialized:', detector);

        // Get the video and canvas elements
        const videoElement = document.getElementById('video1');
        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');

        // Define keypoint pairs to draw edges (limbs)
        const keypointPairs = [
            [5, 6],  // Shoulders
            [5, 7],  // Left shoulder to left elbow
            [7, 9],  // Left elbow to left wrist
            [6, 8],  // Right shoulder to right elbow
            [8, 10], // Right elbow to right wrist
            [5, 11], // Left shoulder to left hip
            [6, 12], // Right shoulder to right hip
            [11, 13], // Left hip to left knee
            [13, 15], // Left knee to left ankle
            [12, 14], // Right hip to right knee
            [14, 16], // Right knee to right ankle
        ];

        // Function to set up the video source and play
        function setupVideo() {
            videoElement.src = 'videos/jk.mp4'; // Replace with the correct path to your video file
            // videoElement.play();
        }

        // Event listener for when the video loads
        videoElement.onloadeddata = async () => {
            console.log('Video data loaded, starting pose detection');
            // Adjust canvas size to match the video dimensions
            canvas.width = videoElement.videoWidth / 2.5;
            canvas.height = videoElement.videoHeight / 2.5;

            // Start detecting poses as the video plays
            videoElement.addEventListener('play', async () => {
                try {
                    while (!videoElement.paused && !videoElement.ended) {
                        // Draw the current video frame onto the canvas
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                        // Convert the current canvas image to a Tensor
                        const inputImage = tf.browser.fromPixels(canvas);

                        // Estimate poses on the current frame
                        const poses = await detector.estimatePoses(inputImage);

                        // Clear the canvas and draw the detected keypoints
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                        // Log poses for debugging
                        console.log('Detected poses:', poses);

                        // Draw keypoints and edges on the canvas
                        poses.forEach((pose) => {
                            // Draw edges (connecting limbs)
                            keypointPairs.forEach(([i, j]) => {
                                const keypoint1 = pose.keypoints[i];
                                const keypoint2 = pose.keypoints[j];

                                if (keypoint1.score > 0.5 && keypoint2.score > 0.5) {
                                    // Draw a line between the two keypoints
                                    ctx.beginPath();
                                    ctx.moveTo(keypoint1.x, keypoint1.y);
                                    ctx.lineTo(keypoint2.x, keypoint2.y);
                                    ctx.strokeStyle = 'blue'; // Set the color of the lines (edges)
                                    ctx.lineWidth = 2; // Set the thickness of the lines
                                    ctx.stroke();
                                }
                            });

                            // Draw keypoints (joints)
                            pose.keypoints.forEach((keypoint) => {
                                if (keypoint.score > 0.5) { // Draw only keypoints with a confidence score higher than 0.5
                                    ctx.beginPath();
                                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                                    ctx.fillStyle = 'red'; // Set the color of the keypoints (joints)
                                    ctx.fill();
                                }
                            });
                        });

                        // Dispose of the tensor to free up resources
                        inputImage.dispose();

                        // Use requestAnimationFrame to keep processing frames
                        await new Promise(requestAnimationFrame);
                    }
                } catch (poseError) {
                    console.error('Error in pose detection:', poseError);
                }
            });
        };

        // Setup the video when the page loads
        setupVideo();

        // Add error handling for video loading errors
        videoElement.onerror = (error) => {
            console.error('Error loading video:', error);
        };
    } catch (error) {
        console.error('Error initializing MoveNet detector or video:', error);
    }
});




// Function to pause video when it's out of view
function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        const video = entry.target;
        // const canvas = entry.nextElementSibling;

        // console.log(video);
        // console.log(canvas);
        if (entry.isIntersecting) {
            // pose_estimator(video, canvas);
            video.play(); // Play video when it's in the viewport


        } else {
            video.pause(); // Pause video when it's out of the viewport
        }
    });
}



