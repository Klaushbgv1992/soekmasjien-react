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
    // Keep the welcome message intact
    setMessages((prev) => {
      if (prev.length === 1) return prev;
      return [{ text: "Hallo! Welkom by SoekmasjienKI. Hoe kan ek help?", sender: "system" }];
    });
    
    // Check if device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
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

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if MediaRecorder is supported
    const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined';
    
    // If on iOS Safari and MediaRecorder isn't well supported, show a message
    if (isIOS && (!isMediaRecorderSupported || !MediaRecorder.isTypeSupported)) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Jammer, spraakopname word nie goed ondersteun in Safari op iOS nie. Probeer asseblief 'n ander blaaier soos Chrome of gebruik die teksinvoer.",
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
        
        // Determine supported MIME types
        let options = {};
        let mimeType = 'audio/webm';
        
        // For iOS Safari, use different approach
        if (isIOS) {
          // iOS Safari doesn't support WebM, try MP4 container
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            // Fallback to default with no specified MIME type on iOS
            mimeType = '';
          }
        } else {
          // For other browsers, prefer WebM with Opus codec
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          }
        }
        
        // Set options if we have a valid mime type
        if (mimeType) {
          options = { mimeType };
        }
        
        console.log(`Using audio format: ${mimeType || 'browser default'}`);
        
        // Create MediaRecorder with appropriate options
        const mediaRecorder = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            // Determine the correct MIME type for the Blob
            const blobMimeType = mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
            
            // Add loading message
            const loadingMsgIndex = messages.length;
            setMessages((prev) => [
              ...prev,
              { text: "Besig om jou spraak te verwerk...", sender: 'bot' }
            ]);

            // Convert recorded audio to base64
            const audioContent = await blobToBase64(audioBlob);
            
            // Determine the correct encoding parameter for Google Speech API
            let encoding = 'WEBM_OPUS';
            if (isIOS) {
              encoding = 'MP4';  // For iOS
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

            const googleResponse = await axios.post(
              `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.REACT_APP_GOOGLE_SPEECH_API_KEY}`,
              payload,
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );

            // Remove the loading message
            setMessages((prev) => prev.filter((_, index) => index !== loadingMsgIndex));

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
        mediaRecorder.start();
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

export default Chat;
