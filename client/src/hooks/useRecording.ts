import { useState, useRef, useEffect, useCallback } from "react";

type RecordingState = "idle" | "recording" | "stopped";

export function useRecording(
  localStream: MediaStream | null,
  remoteStream: MediaStream | null
) {
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");

  const [elapsedTime, setElapsedTime] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recordedBlob = useRef<Blob | null>(null);

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrame = useRef<number | null>(null);

  const localVideoEl = useRef<HTMLVideoElement | null>(null);
  const remoteVideoEl = useRef<HTMLVideoElement | null>(null);

  const audioContext = useRef<AudioContext | null>(null);


  // Create hidden video elements
  useEffect(() => {
    if (localStream && !localVideoEl.current) {
      const vid = document.createElement("video");
      vid.srcObject = localStream;
      vid.muted = true;
      vid.play().catch(() => {});
      localVideoEl.current = vid;
    }

    if (remoteStream && !remoteVideoEl.current) {
      const vid = document.createElement("video");
      vid.srcObject = remoteStream;
      vid.play().catch(() => {});
      remoteVideoEl.current = vid;
    }
  }, [localStream, remoteStream]);


  const getCombinedStream = useCallback(() => {
    const canvas = document.createElement("canvas");

    canvas.width = 1280;
    canvas.height = 720;

    const ctx = canvas.getContext("2d");

    if (!ctx) return null;


    const draw = () => {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);


      const hasRemote =
        remoteVideoEl.current &&
        remoteVideoEl.current.readyState >= 2;

      const hasLocal =
        localVideoEl.current &&
        localVideoEl.current.readyState >= 2;


      if (hasRemote) {
        ctx.drawImage(
          remoteVideoEl.current!,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else if (hasLocal) {
        ctx.drawImage(
          localVideoEl.current!,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }


      // Picture in picture
      if (hasLocal && hasRemote) {
        const pipW = 320;
        const pipH = 240;

        const pipX = canvas.width - pipW - 24;
        const pipY = 24;


        ctx.fillStyle = "#000";
        ctx.fillRect(
          pipX - 4,
          pipY - 4,
          pipW + 8,
          pipH + 8
        );


        ctx.drawImage(
          localVideoEl.current!,
          pipX,
          pipY,
          pipW,
          pipH
        );


        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(
          pipX,
          pipY + pipH - 28,
          50,
          28
        );


        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(
          "You",
          pipX + 10,
          pipY + pipH - 8
        );
      }


      animationFrame.current =
        requestAnimationFrame(draw);
    };


    draw();


    const canvasStream = canvas.captureStream(30);


    // Audio mixing
    audioContext.current = new AudioContext();

    const destination =
      audioContext.current.createMediaStreamDestination();


    if (localStream) {
      try {
        const source =
          audioContext.current.createMediaStreamSource(
            localStream
          );

        source.connect(destination);
      } catch {}
    }


    if (remoteStream) {
      try {
        const source =
          audioContext.current.createMediaStreamSource(
            remoteStream
          );

        source.connect(destination);
      } catch {}
    }


    destination.stream
      .getAudioTracks()
      .forEach((track) => {
        canvasStream.addTrack(track);
      });


    return canvasStream;

  }, [localStream, remoteStream]);



  const startRecording = useCallback(() => {

    const stream = getCombinedStream();


    if (!stream) {
      console.error(
        "Failed to create recording stream"
      );
      return;
    }


    recordedChunks.current = [];
    recordedBlob.current = null;


    let recorder: MediaRecorder;


    const supportedType =
      "video/webm;codecs=vp9,opus";


    try {
      recorder = new MediaRecorder(
        stream,
        {
          mimeType: supportedType,
        }
      );
    } catch {
      recorder = new MediaRecorder(stream);
    }



    recorder.ondataavailable = (event) => {

      if (event.data.size > 0) {
        recordedChunks.current.push(
          event.data
        );
      }

    };



    recorder.onstop = () => {

      if (recordedChunks.current.length === 0) {
        setRecordingState("idle");
        return;
      }


      const blob = new Blob(
        recordedChunks.current,
        {
          type:
            recorder.mimeType ||
            "video/webm",
        }
      );


      
      recordedBlob.current = blob;



      const url =
        URL.createObjectURL(blob);


      setDownloadUrl(url);
      setRecordingState("stopped");



      if (animationFrame.current) {
        cancelAnimationFrame(
          animationFrame.current
        );

        animationFrame.current = null;
      }



      if (audioContext.current) {
        audioContext.current.close();

        audioContext.current = null;
      }

    };



    recorder.onerror = (e) => {
      console.error(
        "Recording error:",
        e
      );
    };



    recorder.start(1000);


    mediaRecorder.current = recorder;


    setRecordingState("recording");
    setElapsedTime(0);
    setDownloadUrl(null);



    timerInterval.current =
      setInterval(() => {
        setElapsedTime(
          (prev) => prev + 1
        );
      }, 1000);



  }, [getCombinedStream]);



  const stopRecording = useCallback(() => {

    if (
      mediaRecorder.current &&
      mediaRecorder.current.state !== "inactive"
    ) {
      mediaRecorder.current.stop();
    }


    if (timerInterval.current) {
      clearInterval(
        timerInterval.current
      );

      timerInterval.current = null;
    }

  }, []);




  const resetRecording = useCallback(() => {

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }


    recordedBlob.current = null;
    recordedChunks.current = [];


    setDownloadUrl(null);
    setRecordingState("idle");
    setElapsedTime(0);


  }, [downloadUrl]);




  useEffect(() => {

    return () => {

      if (timerInterval.current) {
        clearInterval(
          timerInterval.current
        );
      }


      if (animationFrame.current) {
        cancelAnimationFrame(
          animationFrame.current
        );
      }


      if (
        mediaRecorder.current &&
        mediaRecorder.current.state !== "inactive"
      ) {
        mediaRecorder.current.stop();
      }


      if (audioContext.current) {
        audioContext.current.close();
      }


      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }


      recordedBlob.current = null;

    };

  }, [downloadUrl]);




  const formatTime = (seconds: number) => {

    const mins =
      Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");


    const secs =
      (seconds % 60)
        .toString()
        .padStart(2, "0");


    return `${mins}:${secs}`;

  };



  return {

    recordingState,

    elapsedTime:
      formatTime(elapsedTime),

    downloadUrl,

    // NEW: Blob ready for upload
    blob:
      recordedBlob.current,

    startRecording,

    stopRecording,

    resetRecording,

  };
}
