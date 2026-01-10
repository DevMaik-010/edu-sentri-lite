"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatVisibilityContextType {
  isVisible: boolean;
  showChat: () => void;
  hideChat: () => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
}

const ChatVisibilityContext = createContext<
  ChatVisibilityContextType | undefined
>(undefined);

export const ChatVisibilityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const showChat = () => setIsVisible(true);
  const hideChat = () => setIsVisible(false);
  const toggleVisibility = () => setIsVisible((prev) => !prev);
  const setVisibility = (visible: boolean) => setIsVisible(visible);

  return (
    <ChatVisibilityContext.Provider
      value={{
        isVisible,
        showChat,
        hideChat,
        toggleVisibility,
        setVisibility,
      }}
    >
      {children}
    </ChatVisibilityContext.Provider>
  );
};

export const useChatVisibility = () => {
  const context = useContext(ChatVisibilityContext);
  if (context === undefined) {
    throw new Error(
      "useChatVisibility must be used within a ChatVisibilityProvider"
    );
  }
  return context;
};
