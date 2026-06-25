"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCollectionStore } from "@/store/collectionStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchCollections = useCollectionStore((state) => state.fetchCollections);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    }
  }, [isAuthenticated, fetchCollections]);

  return <>{children}</>;
}
