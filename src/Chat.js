import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import soekIcon from './assets/soek.ico';
import microphoneIcon from './assets/microphone.png';
import './Chat.css';

// Preload images to ensure they're available immediately
const preloadImages = () => {
  const soekImg = new Image();
  soekImg.src = soekIcon;
  
  const micImg = new Image();
  micImg.src = microphoneIcon;
};

const Chat = ({ setHasError, isSnaaks, setIsSnaaks }) => {
  const [messages, setMessages] = useState([
    { text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  // Store conversation history for context
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: 'You are a helpful assistant that responds in Afrikaans.' }
  ]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    // Preload images
    preloadImages();
    
    // Keep the welcome message intact
    setMessages((prev) => {
      if (prev.length === 1) return prev;
      return [{ text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }];
    });
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSend = async (message) => {
    const userMessage = message || input.trim();
    if (!userMessage) return;

    setIsLoading(true);
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);

    // Add user message to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    // Keep only the last 8 messages (4 exchanges) plus the system message
    const limitedHistory = updatedHistory.length > 9 
      ? [updatedHistory[0], ...updatedHistory.slice(updatedHistory.length - 8)]
      : updatedHistory;
    
    setConversationHistory(limitedHistory);

    try {
      // Update system message based on isSnaaks state
      const systemMessage = isSnaaks
        ? 'Respond humorously in Afrikaans.'
        : 'Respond only in Afrikaans.';
      
      // Update the system message in the history
      const historyWithUpdatedSystem = [
        { role: 'system', content: systemMessage },
        ...limitedHistory.slice(1)
      ];

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: historyWithUpdatedSystem,
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
      
      // Add bot response to messages for display
      setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
      
      // Add bot response to conversation history
      setConversationHistory([
        ...historyWithUpdatedSystem,
        { role: 'assistant', content: botResponse }
      ]);
      
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
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
  
  const handleTextareaFocus = () => {
    setIsTextareaFocused(true);
    if (isMobile && chatInputRef.current) {
      chatInputRef.current.classList.add('textarea-focused');
    }
  };
  
  const handleTextareaBlur = () => {
    setIsTextareaFocused(false);
    if (isMobile && chatInputRef.current) {
      chatInputRef.current.classList.remove('textarea-focused');
    }
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
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log("Browser detection - iOS:", isIOS);
    
    // For iOS devices, show a direct message about limitations
    if (isIOS) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Spraakopname werk nie op iOS Safari nie. Apple se beperkings verhoed dat hierdie funksie werk. Gebruik asseblief die teksinvoer of 'n ander blaaier soos Chrome.",
          sender: 'bot'
        }
      ]);
      return;
    }
    
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

    // Check if MediaRecorder is supported
    const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined';
    console.log("MediaRecorder supported:", isMediaRecorderSupported);
    
    if (!isMediaRecorderSupported) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Jammer, spraakopname word nie ondersteun in hierdie blaaier nie. Gebruik asseblief die teksinvoer.",
          sender: 'bot'
        }
      ]);
      return;
    }
    
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        // Get audio stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Audio stream obtained successfully");
        
        // Determine supported MIME types
        let options = {};
        let mimeType = '';
        
        // Check for supported formats
        const supportedTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          ''  // empty string = browser default
        ];
        
        for (const type of supportedTypes) {
          if (!type || (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type))) {
            mimeType = type;
            console.log(`Selected MIME type: ${mimeType || 'browser default'}`);
            break;
          }
        }
        
        // Set options if we have a valid mime type
        if (mimeType) {
          options = { mimeType };
        }
        
        // Create MediaRecorder with appropriate options
        const mediaRecorder = new MediaRecorder(stream, options);
        console.log("MediaRecorder created with options:", options);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log("Data available event, size:", event.data.size);
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setMessages((prev) => [
            ...prev,
            { text: "Fout met opname. Probeer asseblief weer.", sender: 'bot' }
          ]);
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.onstop = async () => {
          try {
            console.log("Recording stopped, chunks:", audioChunksRef.current.length);
            if (audioChunksRef.current.length === 0) {
              throw new Error('No audio data recorded');
            }
            
            // Determine the correct MIME type for the Blob
            const blobMimeType = mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
            console.log("Audio blob created, size:", audioBlob.size);
            
            if (audioBlob.size < 100) {
              throw new Error('Audio recording too short or empty');
            }
            
            // Add loading message
            const loadingMsgIndex = messages.length;
            setMessages((prev) => [
              ...prev,
              { text: "Besig om jou spraak te verwerk...", sender: 'bot' }
            ]);

            // Convert recorded audio to base64
            const audioContent = await blobToBase64(audioBlob);
            console.log("Audio converted to base64, length:", audioContent.length);
            
            // Determine the correct encoding parameter for Google Speech API
            let encoding = 'WEBM_OPUS';
            if (mimeType.includes('mp4')) {
              encoding = 'MP4';
            } else if (mimeType.includes('ogg')) {
              encoding = 'OGG_OPUS';
            }
            
            console.log(`Using Speech API encoding: ${encoding}`);

            // Google Speech-to-Text config
            const payload = {
              config: {
                encoding: encoding,
                languageCode: 'af-ZA',  // Afrikaans
                model: 'default',
                sampleRateHertz: 48000,  // Common sample rate
              },
              audio: {
                content: audioContent
              }
            };

            console.log("Sending request to Google Speech API");
            const googleResponse = await axios.post(
              `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.REACT_APP_GOOGLE_SPEECH_API_KEY}`,
              payload,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );
            
            console.log("Google Speech API response:", googleResponse.data);

            // Remove the loading message
            setMessages((prev) => prev.filter((_, index) => index !== loadingMsgIndex));

            const transcription =
              googleResponse?.data?.results?.[0]?.alternatives?.[0]?.transcript;

            if (transcription) {
              console.log("Transcription successful:", transcription);
              handleSend(transcription);
            } else {
              console.error("No transcription in response");
              throw new Error('Geen geldige transkripsie ontvang nie.');
            }
          } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            setMessages((prev) => [
              ...prev,
              {
                text: "Jammer, ek kon nie jou spraak herken nie. Probeer weer of gebruik die teksinvoer.",
                sender: 'bot'
              }
            ]);
            if (setHasError) setHasError(true);
          }

          // Stop all mic tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        
        // Request data every second to handle short recordings better
        mediaRecorder.start(1000);
        console.log("MediaRecorder started");
        setIsRecording(true);
      } catch (error) {
        console.error('Recording error:', error);
        setMessages((prev) => [
          ...prev,
          { text: "Jammer, ek kon nie toegang kry tot jou mikrofoon nie. Maak seker dat jy toestemming gegee het vir mikrofoongebruik.", sender: 'bot' }
        ]);
        if (setHasError) setHasError(true);
        setIsRecording(false);
      }
    }
  };

  // Function to clear chat history
  const clearChat = () => {
    setMessages([
      { text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }
    ]);
    setConversationHistory([
      { role: 'system', content: 'You are a helpful assistant that responds in Afrikaans.' }
    ]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>SoekmasjienKI Chat</h2>
        <button className="clear-chat-button" onClick={clearChat} aria-label="Clear chat">
          <span>Nuwe Gesprek</span>
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
        ))}
      </div>
      <div className={`chat-input ${isTextareaFocused && isMobile ? 'textarea-focused' : ''}`} ref={chatInputRef}>
        <textarea
          ref={textareaRef}
          placeholder="Vra Soekmasjien..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleTextareaFocus}
          onBlur={handleTextareaBlur}
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

preloadImages();

export default Chat;
