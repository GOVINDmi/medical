import React, { useState, useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { CloseCreateChannel } from '../assets';
import './EditChannel.css';

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
  const [menuOpenFor, setMenuOpenFor] = useState(null);
 
  const currentUserRole = channel.state.members[client.userID]?.role;

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await client.queryUsers({ id: { $ne: client.userID } });
      const memberIDs = Object.keys(channel.state.members);
      setCurrentMembers(Object.values(channel.state.members));
      const nonMembers = allUsers.users.filter((u) => !memberIDs.includes(u.id));
      setOtherUsers(nonMembers);
    };

    fetchUsers();
  }, [client, channel]);

  const updateChannel = async (event) => {
    event.preventDefault();

    if (currentUserRole !== 'owner') {
      return alert('Only owners can edit the channel.');
    }

    const nameChanged = channelName !== (channel.data.name || channel.data.id);

    try {
      if (nameChanged) {
        await channel.update({ name: channelName }, { text: `Channel name changed to ${channelName}` });
      }

      if (selectedUsers.length) {
        await channel.addMembers(
          selectedUsers.map((userId) => ({
            user_id: userId,
            role: 'member'
          }))
        );
      
        for (const userId of selectedUsers) {
            const addedUser = otherUsers.find((u) => u.id === userId);
            await channel.sendMessage({
              text: `${client.user.name || client.user.id} added ${addedUser?.fullName || userId} to the channel.`,
                custom_type: 'system_notice',
                type: 'regular',   
            });
        }
      }
      

      setChannelName('');
      setSelectedUsers([]);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update channel: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };
  const removeMember = async (userId) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
      return alert('Only admins or owners can remove members.');
    }
  
    try {
      const removedUser = currentMembers.find((m) => m.user.id === userId)?.user;
  
      await channel.sendMessage({
        text: `${client.user.name || client.user.id} removed ${removedUser?.fullName || userId} from the channel.`,
          custom_type: 'system_notice',
          type: 'regular',   
      });
  
      await channel.removeMembers([userId]);
      window.location.reload();
    } catch (err) {
      alert('Failed to remove member: ' + (err.message || 'Unknown error'));
    }
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
              <div key={user.id} className="member-row">
                <div className="member-info">
                  <div className="avatar">
                    {user.image ? (
                      <img src={user.image} alt={user.fullName || user.id} />
                    ) : (
                      <span className="avatar-letter">{(user.fullName || user.id)?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="member-name">{user.fullName || user.id}</span>
                </div>

                {user.id !== client.userID && (currentUserRole === 'admin' || currentUserRole === 'owner') && (
                  <div className="menu-wrapper">
                    <button onClick={() => setMenuOpenFor(menuOpenFor === user.id ? null : user.id)}>
                      ⋮
                    </button>
                    {menuOpenFor === user.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => removeMember(user.id)}>Remove</button>
                      </div>
                    )}
                  </div>
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
