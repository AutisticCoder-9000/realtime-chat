import React, { useState, useEffect } from 'react';
import './style.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!username) return; // Skip if username is empty

    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send(JSON.stringify({ type: 'JOIN', username }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [username]);

  const sendMessage = () => {
    if (inputMessage.trim() !== '' && socket) {
      socket.send(JSON.stringify({ type: 'MESSAGE', message: inputMessage }));
      setInputMessage('');
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault(); // Prevent form submission

    if (username.trim() !== '') {
      setUsername(username);
    }
  };

  return (
    <div className="app">
      <h1>Real-time Chat</h1>
      {username ? (
        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className="message">
                <span className="username">{message.username}</span>
                <span className="message-text">{message.message}</span>
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="message-input"
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="username-input">
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="username-input-field"
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
