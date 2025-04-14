import React, { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react';

const ChatRequests = () => {
    const { client } = useChatContext();
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        // Listen for real-time chat requests
        const handleEvent = (event) => {
            if (event.type === 'chat_request' && event.toUserId === client.userID) {
                setRequests((prev) => [...prev, { fromUserId: event.user.id }]);
            }
        };

        client.on('chat_request', handleEvent);

        // On mount: fetch any pending requests from backend
        fetch(`http://localhost:5000/api/chat-requests/${client.userID}`)
            .then(res => res.json())
            .then(data => setRequests(data.requests || []));

        return () => client.off('chat_request', handleEvent);
    }, [client]);

    const handleResponse = async (fromUserId, action) => {
        const channelId = `${fromUserId}-${client.userID}`;
        await fetch('http://localhost:5000/api/handle-chat-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromUserId,
                toUserId: client.userID,
                action,
                channelId
            })
        });

        setRequests((prev) => prev.filter(req => req.fromUserId !== fromUserId));
    };

    return (
        <div className="chat-request-container">
            {requests.map(({ fromUserId }) => (
                <div key={fromUserId} className="chat-request-item">
                    <p>{fromUserId} wants to chat with you.</p>
                    <button onClick={() => handleResponse(fromUserId, 'accept')}>Accept</button>
                    <button onClick={() => handleResponse(fromUserId, 'reject')}>Reject</button>
                </div>
            ))}
        </div>
    );
};

export default ChatRequests;
