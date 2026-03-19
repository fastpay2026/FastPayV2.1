import React from 'react';
import { User } from '../../types';

interface Props {
  user: User;
  onlineUsers: { userId: string, username: string }[];
}

const OnlineUsers: React.FC<Props> = ({ user, onlineUsers }) => {
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
