import React from 'react';
import './ThankYouPopup.css';

function ThankYouPopup({ onClose }) {
  return (
    <div className="thank-you-overlay" onClick={onClose}>
      <div className="thank-you-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <div className="thank-you-content">
          <h2>Dankie!</h2>
          <p>Dankie vir jou boodskap. Ons sal jou indiening binnekort nagaan en met jou in verbinding tree.</p>
          <button className="ok-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

export default ThankYouPopup;
