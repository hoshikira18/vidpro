import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

export default function VideoCutter() {
  const [videoSrc, setVideoSrc] = useState("");
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:05");
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);

  const loadFFmpeg = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    setLoading(true);
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
    setLoading(false);
  };

  const cutVideo = async () => {
    setLoading(true);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoSrc));
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      startTime,
      "-to",
      endTime,
      "-c",
      "copy",
      "cut.mp4",
    ]);
    const data = await ffmpeg.readFile("cut.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    setOutputUrl(url);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h3>Video Cutter</h3>
      {!loaded ? (
        <>
          {loading && <p>Loading ffmpeg-core...</p>}
          <button onClick={loadFFmpeg}>Load ffmpeg-core</button>
        </>
      ) : (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const fileUrl = URL.createObjectURL(file);
                setVideoSrc(fileUrl);
              }
            }}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="Start time (e.g., 00:00:03)"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="text"
              placeholder="End time (e.g., 00:00:08)"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <br />
          <button onClick={cutVideo} disabled={loading}>
            {loading ? "Cutting..." : "Cut Video"}
          </button>
          <br />
          {outputUrl && (
            <video
              src={outputUrl}
              controls
              style={{ width: "100%", marginTop: 20 }}
            />
          )}
        </>
      )}
    </div>
  );
}
