import React, { useState, useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import axios from 'axios';
import { UserList } from './';
import { CloseCreateChannel } from '../assets';
import './EditChannel.css'

const ChannelNameInput = ({ channelName = '', setChannelName }) => {
  const handleChange = (event) => {
    event.preventDefault();
    setChannelName(event.target.value);
  };

  return (
    <div className="channel-name-input__wrapper">
      <p>Name</p>
      <input value={channelName} onChange={handleChange} placeholder="channel-name" />
      <p>Add Members</p>
    </div>
  );
};

const EditChannel = ({ setIsEditing }) => {
  const { client, channel } = useChatContext();
  const [channelName, setChannelName] = useState(channel?.data?.name);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await client.queryUsers({ id: { $ne: client.userID } });

      const channelMemberIDs = Object.keys(channel.state.members);
      setCurrentMembers(Object.values(channel.state.members));

      const filtered = allUsers.users.filter(
        (u) => !channelMemberIDs.includes(u.id)
      );
      setOtherUsers(filtered);
    };

    fetchUsers();
  }, [client, channel]);

  const updateChannel = async (event) => {
    event.preventDefault();

    const nameChanged = channelName !== (channel.data.name || channel.data.id);

    if (nameChanged) {
      await channel.update({ name: channelName }, {
        text: `Channel name changed to ${channelName}`
      });
    }

    try {
        console.log(selectedUsers,channel.id);
        if (selectedUsers.length) {
          const res = await axios.post('https://medical-pager-n1gy.onrender.com/api/add-member', {
            channelId: channel.id,
            userId: selectedUsers,
          });
      
          console.log('Members added:', res.data); // ✅ See what server returns
        }
      
        if (nameChanged) {
          await channel.update(
            { name: channelName },
            { text: `Channel name changed to ${channelName}` }
          );
        }
      
        setIsEditing(false);
        setSelectedUsers([]);
      } catch (err) {
        console.error('Failed to update channel:', err);
      
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Something went wrong adding members.';
      
        alert(`Failed to update channel: ${msg}`);
      }

    setChannelName(null);
    setIsEditing(false);
    setSelectedUsers([]);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="edit-channel__container">
      <div className="edit-channel__header">
        <p>Edit Channel</p>
        <CloseCreateChannel setIsEditing={setIsEditing} />
      </div>

      {channel.type === 'team' && (
        <>
          <ChannelNameInput channelName={channelName} setChannelName={setChannelName} />

          <div className="current-members">
            <p>Current Members:</p>
            {currentMembers.map(({ user }) => (
                <div
                key={user.id}
                style={{
                    margin: '6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
                >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* ✅ Avatar or fallback */}
                    <div
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#d4d4d4',
                        color: '#222',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                    >
                    {user.image ? (
                        <img
                        src={user.image}
                        alt={user.fullName || user.id}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <span>{(user.fullName || user.id)?.[0]?.toUpperCase()}</span>
                    )}
                    </div>

                    {/* ✅ Name */}
                    <span>{user.fullName || user.id}</span>
                </div>

                {/* ✅ Remove button (if not self) */}
                {user.id !== client.userID && (
                    <button
                    onClick={async () => {
                        try {
                        await axios.post('https://medical-pager-n1gy.onrender.com/api/remove-member', {
                            channelId: channel.id,
                            userId: user.id,
                        });
                        window.location.reload();
                        } catch (err) {
                        alert(
                            'Failed to remove member: ' +
                            (err.response?.data?.message || err.message)
                        );
                        }
                    }}
                    style={{
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                    >
                    Remove
                    </button>
                )}
                </div>
            ))}
            </div>


          <div className="available-users">
            <p>Available Users to Add:</p>
            {otherUsers.map((user) => (
              <div key={user.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                  {user.fullName || user.id}
                </label>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="edit-channel__button-wrapper" onClick={updateChannel}>
        <p>Save Changes</p>
      </div>
    </div>
  );
};

export default EditChannel;
