import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../api/client";
import endpoints from "../api/api";

interface Organization {
  id: number;
  name: string;
  slug: string;
  role: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  switchOrganization: (orgId: number) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(endpoints.organizations);
      setOrganizations(res.data);
      
      // Auto-select org
      const savedOrgId = localStorage.getItem("organizationId");
      if (savedOrgId) {
        const found = res.data.find((o: Organization) => o.id === Number(savedOrgId));
        if (found) {
          selectOrg(found);
        } else if (res.data.length > 0) {
          selectOrg(res.data[0]);
        }
      } else if (res.data.length > 0) {
        selectOrg(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const selectOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("organizationId", org.id.toString());
  };

  const switchOrganization = (orgId: number) => {
    const found = organizations.find(o => o.id === orgId);
    if (found) {
      selectOrg(found);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
      localStorage.removeItem("organizationId");
    }
  }, [token, fetchOrganizations]);

  return (
    <OrganizationContext.Provider value={{ 
      organizations, 
      currentOrg, 
      isLoading, 
      switchOrganization, 
      refreshOrganizations: fetchOrganizations 
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within an OrganizationProvider");
  return context;
};
