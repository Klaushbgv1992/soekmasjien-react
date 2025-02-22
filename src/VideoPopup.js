import React from 'react';
import './VideoPopup.css';

function VideoPopup({ videoUrl, onClose }) {
  return (
    <div className="video-popup-overlay" onClick={onClose}>
      <div className="video-popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <div className="video-popup-content">
          <iframe 
            width="560" 
            height="315" 
            src={videoUrl} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default VideoPopup;
