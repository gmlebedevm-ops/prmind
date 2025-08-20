'use client';

import { useState } from 'react';

export function useAIChat() {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
  };
}