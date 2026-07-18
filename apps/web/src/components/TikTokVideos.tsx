"use client";

import { ExternalLink, Play } from "lucide-react";
import { useMemo, useState } from "react";

const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@worldcamdemexico";
const tiktokVideoUrls = [
  ...(process.env.NEXT_PUBLIC_TIKTOK_VIDEO_URLS?.split(",") ?? []),
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_1,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_2,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_3,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_4,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_5,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_6,
]
  .map((url) => url?.trim())
  .filter((url, index, values): url is string => Boolean(url) && values.indexOf(url) === index);

type VideoItem = {
  title: string;
  source: string;
  embedSource: string;
};

function getTikTokEmbedUrl(value: string) {
  const match = value.match(/video\/(\d+)/) ?? value.match(/[?&]item_id=(\d+)/) ?? value.match(/^(\d+)$/);
  return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : value;
}

export default function TikTokVideos() {
  const videos = useMemo<VideoItem[]>(() => {
    if (tiktokVideoUrls.length) {
      return tiktokVideoUrls.map((url, index) => ({
        title: `Video ${index + 1}`,
        source: url,
        embedSource: getTikTokEmbedUrl(url),
      }));
    }

    return [];
  }, []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedVideo = videos[selectedIndex];

  return (
    <section className="tiktok-section">
      <div className="tiktok-heading">
        <span className="tiktok-label">VIDEOS</span>
        <h2>Aprende con Worldcam</h2>
        <p>Consejos, demostraciones y novedades sobre camaras de seguridad.</p>
      </div>

      {selectedVideo ? (
        <div className="tiktok-video-stage">
          <div className="tiktok-player">
            <iframe
              key={selectedVideo.embedSource}
              className="tiktok-frame"
              src={selectedVideo.embedSource}
              title={selectedVideo.title}
              allow="encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="tiktok-playlist" aria-label="Videos de Worldcam">
            {videos.map((video, index) => (
              <button
                key={video.source}
                type="button"
                className={`tiktok-video-card ${selectedIndex === index ? "active" : ""}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="tiktok-video-thumb">
                  <img src="/images/logo/logo.png" alt="" />
                  <span className="tiktok-card-play">
                    <Play aria-hidden />
                  </span>
                </span>
                <span className="tiktok-video-meta">
                  <span className="tiktok-preview-kicker">Worldcam</span>
                  <span className="tiktok-video-title">{video.title}</span>
                  <span className="tiktok-video-copy">Reproducir aqui</span>
                </span>
              </button>
            ))}

            <a className="tiktok-open-link" href={tiktokUrl} target="_blank" rel="noopener noreferrer">
              Ver canal
              <ExternalLink aria-hidden />
            </a>
          </div>
        </div>
      ) : (
        <div className="tiktok-empty">
          <div>
            <span className="tiktok-preview-kicker">TikTok Worldcam</span>
            <h3>Agrega los enlaces de los videos para reproducirlos aqui.</h3>
            <p>Pega links de publicaciones en NEXT_PUBLIC_TIKTOK_VIDEO_URLS separados por coma.</p>
          </div>
          <a className="tiktok-open-link" href={tiktokUrl} target="_blank" rel="noopener noreferrer">
            Ver canal
            <ExternalLink aria-hidden />
          </a>
        </div>
      )}
    </section>
  );
}
