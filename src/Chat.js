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
    // Keep the welcome message intact
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
            {
              role: 'system',
              content: isSnaaks
                ? 'Respond humorously in Afrikaans.'
                : 'Respond only in Afrikaans.'
            },
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

      const botResponse =
        response?.data?.choices?.[0]?.message?.content ||
        "Jammer, ek het nie 'n antwoord nie.";
      setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
      if (setHasError) setHasError(false);
    } catch (error) {
      console.error('Error fetching OpenAI response:', error);
      setMessages((prev) => [
        ...prev,
        { text: "Jammer, daar was 'n fout. Probeer weer later.", sender: 'bot' }
      ]);
      if (setHasError) setHasError(true);
    } finally {
      setIsLoading(false);
      setInput('');
      document.querySelector('textarea').style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Convert blob to base64 (strip out "data:audio/webm;base64," prefix)
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
    });

  const toggleRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Microphone access not supported in this browser.');
      setMessages((prev) => [
        ...prev,
        {
          text: "Jammer, mikrofoon toegang word nie deur hierdie blaaier ondersteun nie.",
          sender: 'bot'
        }
      ]);
      if (setHasError) setHasError(true);
      return;
    }

    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        // Explicitly ask for Opus in WebM container
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm; codecs=opus' };
        const mediaRecorder = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm; codecs=opus'
          });

          try {
            // Convert recorded WebM/Opus to base64
            const audioContent = await blobToBase64(audioBlob);

            // Google Speech-to-Text config for WebM Opus
            const payload = {
              config: {
                encoding: 'WEBM_OPUS', // <--- Important
                languageCode: 'af-ZA'  // Afrikaans
              },
              audio: {
                content: audioContent
              }
            };

            const googleResponse = await axios.post(
              `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.REACT_APP_GOOGLE_SPEECH_API_KEY}`,
              payload,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );

            const transcription =
              googleResponse?.data?.results?.[0]?.alternatives?.[0]?.transcript;

            if (transcription) {
              handleSend(transcription);
            } else {
              throw new Error('Geen geldige transkripsie ontvang nie.');
            }
          } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            setMessages((prev) => [
              ...prev,
              {
                text: "Jammer, ek kon nie jou spraak herken nie. Probeer weer.",
                sender: 'bot'
              }
            ]);
            if (setHasError) setHasError(true);
          }

          // Stop all mic tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Recording error:', error);
        setMessages((prev) => [
          ...prev,
          { text: "Jammer, ek kon nie toegang kry tot jou mikrofoon nie.", sender: 'bot' }
        ]);
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
        <textarea
          placeholder="Vra Soekmasjien..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          style={{ resize: 'none', overflow: 'hidden' }}
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
