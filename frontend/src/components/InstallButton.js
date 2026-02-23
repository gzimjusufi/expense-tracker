// InstallButton.jsx
import React, { useEffect, useState } from "react";

let deferredPrompt = null;

const InstallButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowButton(true); // Show the install button when eligible
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide button if app is already installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed!");
      setShowButton(false);
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log("User response to install:", choiceResult.outcome);

    // Hide the button whether accepted or dismissed
    setShowButton(false);
    deferredPrompt = null;
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        padding: "10px 15px",
        borderRadius: "8px",
        backgroundColor: "#3498db",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      Install App
    </button>
  );
};

export default InstallButton;
