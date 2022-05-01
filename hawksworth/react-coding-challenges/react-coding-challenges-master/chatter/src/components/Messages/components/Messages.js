import React, { useContext, useEffect, useState, useCallback, useRef} from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';
import INITIAL_BOTTY_MESSAGE from '../../../common/constants/initialBottyMessage';

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);
const ME = 'me';
const BOT = 'bot';
const initialMessage = {
  user: BOT,
  id: Date.now(),
  message:INITIAL_BOTTY_MESSAGE
}


function Messages() {
  const messageScrollRef = useRef(null);
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const [botTyping, setBotTyping] = useState(false);

  const scrollToBottom = () => {
    messageScrollRef.current.scrollTo({ top: messageScrollRef.current.scrollHeight, behavior: 'smooth' });
  }

  useEffect(() => {
    socket.off('bot-message');
    socket.on('bot-message', (msg)=>{
        setBotTyping(false);
        setMessages([...messages,{message: msg, id: Date.now(), user: BOT}]);
        setLatestMessage(BOT, msg );
        playReceive();
        scrollToBottom();
    });
    },[messages]);
    
  useEffect(() => {
    document.getElementById('user-message-input').focus();
    socket.on('bot-typing', () => {
      setBotTyping(true);
    })
  }, []);

  const sendMessage = useCallback(() => {
    if (!userMessage) {
      return;
    }
    setMessages([...messages,{user: ME, message: userMessage, id: Date.now()}]);
    setLatestMessage(ME, userMessage );
    socket.emit('user-message', (userMessage));
    playSend();
    setUserMessage('');
    scrollToBottom();
  }, [messages, userMessage]);

  const onChangeMessage = ({target: { value }}) => {
    setUserMessage(value);
  };

  return (
    <div className="messages">
      <Header />
      <div ref = {messageScrollRef} className="messages__list" id="message-list">
      {messages.map((msg, index ) => (
        <Message message={msg} nextMessage={messages[index+1]} botTyping={botTyping} />
      ))}
        
      
      {botTyping ? <TypingMessage /> : null}
      </div>
      <Footer message={userMessage} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;
