import { useEffect, useRef, useState } from "react";
import "./feed.css";
import Swiper from "swiper/bundle";
import "swiper/swiper-bundle.css";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-webgpu";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import CreditTag from "./components/CreditTag";
import {
  getStorage,
  ref,
  getDownloadURL,
  listAll,
  uploadString,
  getMetadata,
} from "firebase/storage";

async function initializeTensorFlow() {
  // Try to use WebGL backend first, fall back to CPU if not available
  try {
    await tf.setBackend("webgl");
    console.log("Using WebGL backend");
  } catch {
    console.warn("WebGL backend not available, falling back to CPU");
    await tf.setBackend("cpu");
  }
  await tf.ready();
  console.log("TensorFlow.js initialized with backend:", tf.getBackend());
}

const authors = [
  "@author 1",
  "@author 2",
  "@author 3",
  "@author 4",
  "@author 5",
];

const Feed = () => {
  const [videos, setVideoUrls] = useState([]);
  const navigate = useNavigate();
  const videoRefs = useRef([]);
  const canvasRefs = useRef([]);
  // const [allPoses, setAllPoses] = useState([]);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const switchToHome = async () => {
    navigate("/home");
  };

  async function checkFileExists(filename) {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `json_data/${filename}.json`);

      await getMetadata(storageRef);
      console.log("File already exists.");
      return true;
    } catch (error) {
      if (error.code === "storage/object-not-found") {
        console.log("File does not exist.");
        return false;
      } else {
        console.error("Error checking file existence:", error);
        return false;
      }
    }
  }

  async function uploadJSONtoFirebase(pose_data, filename) {
    const fileExists = await checkFileExists(filename);
    if (!fileExists) {
      const finalData = {
        video_name: filename,
        pose_data: pose_data,
      };

      const jsonData = JSON.stringify(finalData);

      try {
        const storage = getStorage();
        console.log(storage);
        const storageRef = ref(storage, `json_data/${filename}.json`);
        console.log(storageRef);

        await uploadString(storageRef, jsonData, "raw", {
          contentType: "application/json",
        });
        console.log("JSON file uploaded successfully!");
      } catch (error) {
        console.error("Error uploading JSON file:", error);
      }
    }
  }

  useEffect(() => {
    const storage = getStorage();

    const listVideos = async () => {
      const storageRef = ref(storage, "videos/");
      const listResult = await listAll(storageRef);
      const urls = await Promise.all(
        listResult.items.map((item) => getDownloadURL(item))
      );
      setVideoUrls(urls);
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });

    listVideos().then(() => {
      const videos = videoRefs.current;
      videos.forEach((video) => {
        observer.observe(video); // Observe each video
      });

      // Initialize Swiper
      const swiper = new Swiper(".swiper-container", {
        direction: "horizontal",
        loop: false,
        slidesPerView: 1,
        spaceBetween: 100,
        centeredSlides: true,
        on: {
          slideChangeTransitionStart: () => {
            const currentSlideVideo = videoRefs.current[swiper.activeIndex];
            if (currentSlideVideo) currentSlideVideo.pause();
          },
          slideChangeTransitionEnd: () => {
            const currentSlideVideo = videoRefs.current[swiper.activeIndex];
            if (currentSlideVideo) currentSlideVideo.play();
          },
        },
      });
    });

    return () => {
      observer.disconnect(); // Cleanup observer on unmount
    };
  }, []);

  async function playEstimator(video, canvas, src) {
    try {
      await initializeTensorFlow();
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
      );
      const ctx = canvas.getContext("2d");

      const keypointPairs = [
        [5, 6],
        [5, 7],
        [7, 9],
        [6, 8],
        [8, 10],
        [5, 11],
        [6, 12],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
      ];

      function setupVideo() {
        video.src = src;
      }

      video.onloadeddata = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log("Canvas size set to:", canvas.width, "x", canvas.height);

        video.addEventListener("play", async () => {
          let allPoses = [];
          while (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const inputImage = tf.browser.fromPixels(canvas);

            try {
              const poses = await detector.estimatePoses(inputImage);
              console.log("Poses detected:", poses);
              allPoses.push(poses.map((pose) => pose.keypoints));

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              poses.forEach((pose) => {
                keypointPairs.forEach(([i, j]) => {
                  const keypoint1 = pose.keypoints[i];
                  const keypoint2 = pose.keypoints[j];
                  if (keypoint1.score > 0.3 && keypoint2.score > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(keypoint1.x, keypoint1.y);
                    ctx.lineTo(keypoint2.x, keypoint2.y);
                    ctx.strokeStyle = "blue";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                  }
                });

                pose.keypoints.forEach((keypoint) => {
                  if (keypoint.score > 0.3) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = "red";
                    ctx.fill();
                  }
                });
              });
            } catch (error) {
              console.error("Error during pose detection:", error);
            }

            inputImage.dispose();

            await new Promise(requestAnimationFrame);
          }

          await uploadJSONtoFirebase(allPoses, src.split("/").pop());
        });
      };

      setupVideo();

      video.onerror = (error) => {
        console.error("Error loading video:", error);
      };
    } catch (error) {
      console.error("Error initializing MoveNet detector or video:", error);
    }
  }

  function handleIntersection(entries) {
    entries.forEach((entry) => {
      const video = entry.target;
      const index = videoRefs.current.indexOf(video); // Get the index of the current video
      const canvas = canvasRefs.current[index]; // Get the corresponding canvas

      const src = video.currentSrc;

      if (entry.isIntersecting) {
        if (video && canvas) {
          playEstimator(video, canvas, src);
          video.play();
        }
      } else {
        video.pause();
      }
    });
  }

  if (videos.length === 0) {
    return <h1>Loading</h1>;
  }

  return (
    <div>
      <header>
        <h1
          style={{ fontFamily: "Poppins", fontWeight: "lighter" }}
          className="feed_title"
        >
          trace ai
        </h1>
      </header>

      <nav>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2em",
            backgroundColor: "transparent",
          }}
        >
          <div>
            <button onClick={switchToHome}>home</button>
          </div>
          <div>
            <button>feed</button>
          </div>
          <div>
            <button onClick={handleLogOut}>logout</button>
          </div>
        </div>
      </nav>

      <div className="swiper-container" style={{ display: "flex" }}>
        <div className="swiper-wrapper">
          {videos.map((video, index) => (
            <div
              className="swiper-slide"
              key={index}
              style={{
                display: "flex",
                position: "relative",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                className="video-container"
                controls
                playsInline
                autoPlay
                crossOrigin="anonymous"
              >
                <source src={video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <canvas
                id={`outputCanvas${index + 1}`}
                ref={(el) => (canvasRefs.current[index] = el)}
                style={{
                  backgroundColor: "white",
                  height: 500,
                  width: 300,
                  marginLeft: 20,
                }}
              ></canvas>
              <CreditTag author={authors[index]} />
            </div>
          ))}
        </div>
        <div className="glow-box-right" style={{ display: "flex" }}></div>
        <div className="glow-box-left"></div>
      </div>
    </div>
  );
};

export default Feed;
