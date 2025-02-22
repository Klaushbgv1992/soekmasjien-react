import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import soekIcon from './assets/soek.ico';
import microphoneIcon from './assets/microphone.png';
import './Chat.css';

const Chat = ({ setHasError, isSnaaks, setIsSnaaks }) => {
  const [messages, setMessages] = useState([
    { text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Ensure welcome message stays intact
    setMessages((prev) => {
      if (prev.length === 1) return prev;
      return [{ text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }];
    });
  }, []);

  const handleSend = async (message) => {
    const userMessage = message || input.trim();
    if (!userMessage) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: isSnaaks ? 'Respond humorously in Afrikaans.' : 'Respond only in Afrikaans.' },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const botResponse = response?.data?.choices?.[0]?.message?.content || "Jammer, ek het nie 'n antwoord nie.";
      setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
      if (setHasError) setHasError(false);
    } catch (error) {
      console.error('Error fetching OpenAI response:', error);
      setMessages((prev) => [...prev, { text: "Jammer, daar was 'n fout. Probeer weer later.", sender: 'bot' }]);
      if (setHasError) setHasError(true);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Microphone access not supported in this browser.');
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.wav');
          formData.append('language', 'af');

          try {
            const transcriptionResponse = await axios.post(
              'https://api.openai.com/v1/audio/transcriptions',
              formData,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );

            const transcribedText = transcriptionResponse?.data?.text?.trim();
            if (transcribedText) {
              handleSend(transcribedText);
            } else {
              throw new Error('Geen geldige transkripsie ontvang nie.');
            }
          } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            setMessages((prev) => [...prev, { text: "Jammer, ek kon nie jou spraak herken nie. Probeer weer.", sender: 'bot' }]);
            if (setHasError) setHasError(true);
          }

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Recording error:', error);
        setMessages((prev) => [...prev, { text: "Jammer, ek kon nie toegang kry tot jou mikrofoon nie.", sender: 'bot' }]);
        if (setHasError) setHasError(true);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Vra Soekmasjien..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          onClick={() => handleSend()} 
          className={`send-icon ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
          aria-label="Send message"
        >
          <img src={soekIcon} alt="Send" />
        </button>
        <button 
          onClick={toggleRecording}
          className={`microphone-icon ${isRecording ? 'recording' : ''}`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <img src={microphoneIcon} alt="Microphone" />
        </button>
        <div className="toggle-container">
          <label>
            <div>Snaaks</div>
            <input
              type="checkbox"
              checked={isSnaaks}
              onChange={() => setIsSnaaks(!isSnaaks)}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Chat;
