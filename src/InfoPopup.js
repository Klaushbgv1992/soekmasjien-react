import React from 'react';
import './InfoPopup.css';

function InfoPopup({ text, onClose }) {
  return (
    <div className="info-popup-overlay" onClick={onClose}>
      <div className="info-popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <div className="info-popup-content">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
}

export default InfoPopup;
