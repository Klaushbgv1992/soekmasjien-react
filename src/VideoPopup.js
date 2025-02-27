import React, { useState } from 'react';
import './VideoPopup.css';

function VideoPopup({ videoUrl, onClose }) {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="video-popup-overlay" onClick={onClose}>
      <div className="video-popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <div className="video-popup-content">
          {isLoading && <div className="loading-spinner"></div>}
          <iframe 
            className={isLoading ? 'video-hidden' : 'video-visible'}
            width="560" 
            height="315" 
            src={videoUrl} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            onLoad={handleIframeLoad}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default VideoPopup;
