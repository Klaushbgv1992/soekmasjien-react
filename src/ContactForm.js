import React, { useState } from 'react';
import './ContactForm.css';
import ThankYouPopup from './ThankYouPopup';

function ContactForm({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', { name, email, message });
    setShowThankYou(true);
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    onClose();
  };

  return (
    <div className="contact-form-overlay" onClick={onClose}>
      <div className="contact-form-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <form onSubmit={handleSubmit}>
          <h2>Contact Us</h2>
          <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Message:
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>
          <button type="submit">Send</button>
        </form>
      </div>
      {showThankYou && <ThankYouPopup onClose={handleThankYouClose} />}
    </div>
  );
}

export default ContactForm;
