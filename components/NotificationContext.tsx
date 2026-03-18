import React, { createContext, useState, useContext, ReactNode } from 'react';
import Notification from './Notification';

interface NotificationContextType {
  showNotification: (title: string, message: string, type: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{ title: string; message: string; type: string; id: number } | null>(null);

  const showNotification = (title: string, message: string, type: string) => {
    setNotification({ title, message, type, id: Date.now() });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
