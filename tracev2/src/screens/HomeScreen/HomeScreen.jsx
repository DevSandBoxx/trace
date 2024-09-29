import { useRef, useState } from 'react';
import pandaLogo from '../../assets/panda3d-transparent.png';
import tensorLogo from '../../assets/tensor-2.png';
import './homescreen.css';
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const HomeScreen = () => {
    const [webcamStream, setWebcamStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const videoRef = useRef(null);
    const statusRef = useRef(null);
    const recordingIndicatorRef = useRef(null);
    const downloadLinkRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false); // State to track recording statusc
    const navigate = useNavigate();

    const startWebcam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setWebcamStream(stream);
                videoRef.current.srcObject = stream;
                statusRef.current.textContent = "Webcam is live!";
            } catch (error) {
                statusRef.current.textContent = "Error: Unable to access webcam.";
                console.error('Error accessing webcam:', error);
            }
        } else {
            statusRef.current.textContent = "getUserMedia is not supported in this browser.";
        }
    };

    const stopWebcam = () => {
        if (webcamStream) {
            const tracks = webcamStream.getTracks();
            tracks.forEach(track => track.stop());
            setWebcamStream(null); // Clear the webcam stream state
            statusRef.current.textContent = "Webcam has been stopped.";
        } else {
            statusRef.current.textContent = "No webcam stream to stop.";
        }
    };

    const startRecording = () => {
        setRecordedChunks([]);
        const options = { mimeType: 'video/webm; codecs=vp9' };
        const recorder = new MediaRecorder(webcamStream, options);

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks(prev => [...prev, event.data]);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            downloadLinkRef.current.href = url;
            downloadLinkRef.current.download = 'recorded_video.webm';
            downloadLinkRef.current.style.display = 'inline';
            downloadLinkRef.current.textContent = 'Download Video';
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true); // Set recording status
        statusRef.current.textContent = 'Recording...';
        recordingIndicatorRef.current.style.display = 'block'; // Show recording indicator
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false); // Reset recording status
            statusRef.current.textContent = 'Recording stopped.';
            recordingIndicatorRef.current.style.display = 'none'; // Hide recording indicator
        }
    };

    const handleLogOut = async () => {
        try {
          await signOut(auth);
          // Redirect or show a success message after logging out
          navigate("/");
        } catch (error) {
          console.error('Logout failed:', error);
          // Handle logout error (e.g., show an error message)
        }
      };

  const uploadToGCS = async () => {
    console.log("hello");
    const storage = getStorage();
    const storageRef = ref(storage, `videos/${Date.now()}.webm`);

    const metadata = { type: "video/webm" };

    const blob = new Blob(recordedChunks, metadata);

    let downloadURL = "";

    try {
      const snapshot = await uploadBytes(storageRef, blob);
      downloadURL = await getDownloadURL(snapshot.ref);
      console.log(downloadURL);
      deleteChunks();
      window.alert("Success: " + downloadURL);
    } catch (error) {
      console.error("Problem getting download url", error);
      console.error("File upload failed", error);
    }
  };

  const deleteChunks = () => {
    setRecordedChunks([]);
  };

    const switchToFeed = async () => {
        navigate("/feed");
    }
    

    return (
        <>
            <header>
                <h1 style={{fontFamily:"Poppins", fontWeight:"lighter"}} className='homescreen_title'>trace ai</h1>
            </header>

            <nav>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2em', backgroundColor: 'transparent' }}>
                    <div>
                        <button>home</button>
                    </div>
                    <div>
                        <button onClick={switchToFeed}>feed</button>
                    </div>
                    <div>
                        <button onClick={handleLogOut}>logout</button>
                    </div>
                    
                </div>
            </nav>
            <main>
                <section>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <h2></h2>
                        <div className="recording-indicator" ref={recordingIndicatorRef}></div>
                        <a ref={downloadLinkRef} style={{ display: 'none', margin: '20px', color: 'white', textDecoration: 'none' }}>download video</a>
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div>
                            <img src={pandaLogo} alt="Panda Logo" style={{ height: '100px', width: '100px' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <button className="cool-button" onClick={startWebcam}>start</button>
                                <button className="cool-button" onClick={stopWebcam}>stop</button>
                            </div>
                            <div className="video">
                                <video ref={videoRef} style={{ width: 'inherit', height: 'inherit' }} autoPlay playsInline></video>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <p ref={statusRef}></p>
                                <button className="cool-button" onClick={startRecording} disabled={isRecording}>record</button>
                                <button className="cool-button" onClick={stopRecording} disabled={!isRecording}>end</button>
                                <button className="cool-button" onClick={uploadToGCS} disabled={webcamStream && recordedChunks.length > 0 && !isRecording}>Upload to Firebase</button>
                            </div>
                        </div>
                        <div>
                            <img src={tensorLogo} alt="Tensor Logo" style={{ height: '100px', width: '100px' }} />
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <p>Contributors - Basil Khwaja, Heet Shah, Arvind, Areeb Ehsan</p>
            </footer>
        </>
    );
};

export default HomeScreen;
