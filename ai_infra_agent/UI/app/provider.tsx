"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}

import { createContext, useContext, useState } from "react";

interface AvatarContextType {
  profileImage: string | null;
  setProfileImage: (value: string | null) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  return (
    <AvatarContext.Provider value={{ profileImage, setProfileImage }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within AvatarProvider");
  }
  return context;
}
