import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useOrganization } from "./OrganizationContext";
import apiClient from "../api/client";
import endpoints from "../api/api";

interface FeatureStatus {
  enabled: boolean;
  limit: number | null;
  current: number;
}

interface FeatureContextType {
  features: Record<string, FeatureStatus>;
  isLoading: boolean;
  canUseFeature: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider = ({ children }: { children: ReactNode }) => {
  const { currentOrg } = useOrganization();
  const [features, setFeatures] = useState<Record<string, FeatureStatus>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeatures = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      // Assuming a GET /organizations/:id/features endpoint or similar
      // Or we can use the getOrgFeatures from the service layer via a controller
      // Based on our backend implementation, we have GET /subscriptions/usage but let's 
      // check featureGateService.ts. We need an endpoint for it.
      // I'll use the subscription_usage endpoint as a proxy for now or add a features one.
      const res = await apiClient.get(`${endpoints.organizations}/${currentOrg.id}/features`);
      setFeatures(res.data);
    } catch (err) {
      console.error("Failed to fetch features", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (currentOrg) {
      fetchFeatures();
    } else {
      setFeatures({});
    }
  }, [currentOrg, fetchFeatures]);

  const canUseFeature = (featureKey: string) => {
    const feat = features[featureKey];
    if (!feat) return false;
    if (!feat.enabled) return false;
    if (feat.limit === null) return true;
    return feat.current < feat.limit;
  };

  return (
    <FeatureContext.Provider value={{ 
      features, 
      isLoading, 
      canUseFeature, 
      refreshFeatures: fetchFeatures 
    }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) throw new Error("useFeatures must be used within a FeatureProvider");
  return context;
};
