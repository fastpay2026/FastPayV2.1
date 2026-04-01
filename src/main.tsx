
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { I18nProvider } from '../i18n/i18n.tsx';
import './index.css';

// كود حماية الـ Console لـ FastPay
(function() {
    const disableConsole = () => {
        console.log = console.info = console.warn = console.error = function() {};
    };

    // التحقق من هوية المستخدم (الأدمين)
    const currentUser = localStorage.getItem('username'); 
    const ADMIN_USERNAME = 'Admin'; // اسم المستخدم الخاص بالأدمين

    if (import.meta.env.MODE === 'production' && currentUser !== ADMIN_USERNAME) {
        disableConsole();
        
        // منع فتح الـ DevTools
        window.oncontextmenu = function () { return false; }; 
        document.onkeydown = function (e: KeyboardEvent) {
            if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73)) {
                return false; 
            }
        };
    }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
