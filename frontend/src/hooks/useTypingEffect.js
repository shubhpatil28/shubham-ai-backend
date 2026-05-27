import { useState, useEffect } from 'react';

const useTypingEffect = (text, speed = 15, isTyping = false) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(!isTyping);

  useEffect(() => {
    if (!isTyping || !text) {
      setDisplayedText(text || '');
      setIsDone(true);
      return;
    }

    let i = 0;
    setIsDone(false);
    setDisplayedText('');

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, isTyping]);

  return { displayedText, isDone };
};

export default useTypingEffect;
