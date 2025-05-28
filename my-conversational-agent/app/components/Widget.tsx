'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';

const config = (typeof window !== 'undefined' && (window as any).voiceWidgetConfig) || {};

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('Microphone permission denied', error);
    return false;
  }
}

const WaveIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="transition-all">
    <path
      d="M2 8C2 8 4 4 6 8C8 12 10 4 12 8C14 12 16 4 18 8C20 12 22 8 22 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={isActive ? 'wave-active' : 'wave-inactive'}
    />
    <path
      d="M1 8C1 8 3 6 5 8C7 10 9 6 11 8C13 10 15 6 17 8C19 10 21 8 23 8"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
      className={isActive ? 'wave-active-2' : 'wave-inactive-2'}
    />
  </svg>
);

export default function VoiceWidget() {
  const platform = config.platform || 'web';
  const get_battery_level = config.get_battery_level || (async () => 100);
  const change_brightness = config.change_brightness || (async () => {});
  const flash_screen = config.flash_screen || (async () => {});

  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setIsConnecting(false);
    },
    onMessage: (message) => console.log('Message:', message),
    onError: (err) => {
      console.error('Error:', err);
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert('Microphone permission is required');
      setIsConnecting(false);
      return;
    }

    await conversation.startSession({
      agentId: 'agent_01jvg9443reddrc38gye4jhfvr',
      dynamicVariables: { platform },
      clientTools: {
        get_battery_level,
        change_brightness,
        flash_screen,
      },
    });
  }, [conversation, platform, get_battery_level, change_brightness, flash_screen]);

  const stopConversation = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const isActive = conversation.status === 'connected';

  const handleClick = () => {
    if (conversation.status === 'disconnected') {
      startConversation();
    } else {
      stopConversation();
    }
  };

  const statusText =
    isConnecting || conversation.status === 'connecting'
      ? 'CONNECTING...'
      : 'VOICE CHAT';

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-button {
        0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      .wave-active {
        animation: wave-animation 1.5s ease-in-out infinite;
        stroke: #1a1a1a !important;
      }
      .wave-active-2 {
        animation: wave-animation-2 1.8s ease-in-out infinite;
        stroke: #1a1a1a !important;
        opacity: 0.6 !important;
      }
      .wave-inactive {
        stroke: white;
      }
      .wave-inactive-2 {
        stroke: white;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      id="voice-widget"
      className={`fixed bottom-6 right-6 z-[10000] min-w-[280px] p-3 pr-6 rounded-full flex items-center gap-4 shadow-md border transition-all cursor-pointer
        ${isActive ? 'bg-red-500 border-red-300 shadow-red-300 text-white' : 'bg-white border-gray-200'}
      `}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all
          ${isActive ? 'bg-white animate-pulse' : 'bg-black'}
        `}
      >
        <WaveIcon isActive={isActive} />
      </div>
      <span className={`text-sm font-bold uppercase ${isActive ? 'text-white' : 'text-black'}`}>
        {statusText}
      </span>
      <div className="flex items-center gap-2 bg-black/5 px-2 py-1 rounded-md">
        <span role="img" aria-label="flag">🇺🇸</span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
