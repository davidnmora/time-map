"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type HoveredElementContextType = {
  hoveredRegionId: string | null;
  setHoveredRegionId: (id: string | null) => void;
};

const HoveredElementContext = createContext<
  HoveredElementContextType | undefined
>(undefined);

export const HoveredElementProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  return (
    <HoveredElementContext.Provider value={{ hoveredRegionId, setHoveredRegionId }}>
      {children}
    </HoveredElementContext.Provider>
  );
};

export const useHoveredElement = () => {
  const context = useContext(HoveredElementContext);
  if (context === undefined) {
    throw new Error(
      "useHoveredElement must be used within a HoveredElementProvider"
    );
  }
  return context;
};

