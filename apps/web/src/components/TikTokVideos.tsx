"use client";

import { useEffect } from "react";

export default function TikTokVideos() {
  useEffect(() => {
    const previousScript = document.querySelector(
      'script[src="https://www.tiktok.com/embed.js"]'
    );

    previousScript?.remove();

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  

  return (
    <section className="tiktok-section">
      <div className="tiktok-heading">
        <span className="tiktok-label">VIDEOS</span>

        <h2>Aprende con Worldcam</h2>

        <p>Consejos, demostraciones y novedades sobre cámaras de seguridad.</p>
      </div>

      <div className="tiktok-container">
        <blockquote
          className="tiktok-embed"
          cite="https://www.tiktok.com/@worldcamdemexico"
          data-unique-id="worldcamdemexico"
          data-embed-type="creator"
          style={{ maxWidth: "780px", minWidth: "288px", width: "100%" }}
        >
          <section>
            <a
              href="https://www.tiktok.com/@worldcamdemexico"
              target="_blank"
              rel="noopener noreferrer"
            >
              @worldcamdemexico
            </a>
          </section>
        </blockquote>
      </div>
    </section>
  );
}
