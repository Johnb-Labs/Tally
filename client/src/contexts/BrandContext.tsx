import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BrandingSettings, Division } from "@shared/schema";

interface BrandContextType {
  branding: BrandingSettings | null;
  currentDivision: Division | null;
  setCurrentDivision: (division: Division | null) => void;
  getEffectiveColors: () => {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  getEffectiveLogo: () => string | null;
  getEffectiveOrganizationName: () => string;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
}

const DEFAULT_COLORS = {
  primaryColor: "#1976D2",
  secondaryColor: "#424242",
  accentColor: "#FF9800",
};

const DEFAULT_ORG_NAME = "Tally by JBLabs";

export function BrandProvider({ children }: BrandProviderProps) {
  const [currentDivision, setCurrentDivision] = useState<Division | null>(null);

  const { data: branding, isLoading } = useQuery({
    queryKey: ["/api/branding"],
    retry: false,
  });

  const getEffectiveColors = () => {
    // Division colors take precedence over global branding
    if (currentDivision?.primaryColor) {
      return {
        primaryColor: currentDivision.primaryColor,
        secondaryColor: currentDivision.secondaryColor || DEFAULT_COLORS.secondaryColor,
        accentColor: branding?.accentColor || DEFAULT_COLORS.accentColor,
      };
    }

    // Fall back to global branding colors
    if (branding?.primaryColor) {
      return {
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor || DEFAULT_COLORS.secondaryColor,
        accentColor: branding.accentColor || DEFAULT_COLORS.accentColor,
      };
    }

    // Default colors
    return DEFAULT_COLORS;
  };

  const getEffectiveLogo = () => {
    return currentDivision?.logoUrl || branding?.logoUrl || null;
  };

  const getEffectiveOrganizationName = () => {
    if (currentDivision?.name) {
      return currentDivision.name;
    }
    if (branding?.organizationName) {
      return branding.organizationName;
    }
    return DEFAULT_ORG_NAME;
  };

  // Apply CSS variables for theming
  useEffect(() => {
    const colors = getEffectiveColors();
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    };

    try {
      root.style.setProperty('--primary', `hsl(${hexToHsl(colors.primaryColor)})`);
      root.style.setProperty('--secondary', `hsl(${hexToHsl(colors.secondaryColor)})`);
      root.style.setProperty('--accent', `hsl(${hexToHsl(colors.accentColor)})`);
    } catch (error) {
      console.warn('Error applying brand colors:', error);
    }
  }, [branding, currentDivision]);

  return (
    <BrandContext.Provider
      value={{
        branding,
        currentDivision,
        setCurrentDivision,
        getEffectiveColors,
        getEffectiveLogo,
        getEffectiveOrganizationName,
        isLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
