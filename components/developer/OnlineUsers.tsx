import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from '../../types';

interface Props {
  user: User;
}

const OnlineUsers: React.FC<Props> = ({ user }) => {
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string, username: string }[]>([]);

  useEffect(() => {
    console.log('[OnlineUsers] User prop:', user);
    if (!user || !user.id) return;
    
    const socket: Socket = io();
    
    socket.on('connect', () => {
      console.log('[OnlineUsers] Connected to socket:', socket.id);
      socket.emit('user:login', { userId: user.id, username: user.username });
    });

    socket.on('connect_error', (err) => {
      console.error('[OnlineUsers] Connection error:', err);
    });

    socket.on('users:online', (users: { userId: string, username: string }[]) => {
      console.log('[OnlineUsers] Received online users:', users);
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black mb-6">Online Users</h2>
      <div className="space-y-4">
        {onlineUsers.length === 0 ? (
          <p className="text-slate-500">No users online.</p>
        ) : (
          onlineUsers.map(user => (
            <div key={user.userId} className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-bold">{user.username}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
