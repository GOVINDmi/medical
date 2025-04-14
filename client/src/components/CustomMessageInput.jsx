import React, { useState, useRef } from 'react';
import { MessageInput, useMessageInputContext } from 'stream-chat-react';
import EmojiPicker from 'emoji-picker-react';

const CustomMessageInput = () => {
    const [emojiOpen, setEmojiOpen] = useState(false);
    const { insertText, text, setText } = useMessageInputContext();

    const handleEmojiClick = (emojiData) => {
        insertText?.(emojiData.emoji);
        setEmojiOpen(false);
    };

    const handleGifClick = () => {
        if (!text.startsWith('/giphy ')) {
            setText(`/giphy ${text}`);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className="custom-buttons" style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                <button onClick={() => setEmojiOpen(!emojiOpen)}>😊</button>
                <button onClick={handleGifClick}>GIF</button>
            </div>

            {emojiOpen && (
                <div style={{ position: 'absolute', bottom: '60px', zIndex: 100 }}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
            )}

            <MessageInput grow />
        </div>
    );
};

export default CustomMessageInput;
