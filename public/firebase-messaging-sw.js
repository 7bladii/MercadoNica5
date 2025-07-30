// public/firebase-messaging-sw.js

// Scripts para inicializar Firebase
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Tu configuración de Firebase, la misma que usas en tu app
const firebaseConfig = {
  apiKey: "AIzaSyChYTYsSLFfWsk2UVm6BsldnaGw42AwDC4",
  authDomain: "mecardonica.firebaseapp.com",
  projectId: "mecardonica",
  storageBucket: "mecardonica.firebasestorage.app",
  messagingSenderId: "980886283273",
  appId: "1:980886283273:web:17d0586151cc5c96d944d8",
  measurementId: "G-RRQL5YD0V9"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Personaliza la notificación aquí
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png", // o el ícono que prefieras
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});