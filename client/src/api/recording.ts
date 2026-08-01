import API from "./axios";

export const uploadRecording = async (
  blob: Blob,
  title: string,
  duration: number,
  roomId?: string,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append("video", blob, "recording.webm");
  formData.append("title", title);
  formData.append("duration", duration.toString());
  if (roomId) formData.append("roomId", roomId);

  const response = await API.post("/recordings", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};