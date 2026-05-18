import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../api/client";
import endpoints from "../api/api";
import { planSupportsTeamCollaboration } from "@/lib/organizationTeam";

interface Organization {
  id: number;
  name: string;
  slug: string;
  role: string;
  /** Active subscription plan type for this workspace (from GET /organizations). */
  planType: string | null;
}

interface ApiOrganizationRow {
  id: number;
  name: string;
  slug: string;
  members?: { role: string }[];
  subscriptions?: { plan?: { type?: string } }[];
}

function normalizeOrganizations(rows: ApiOrganizationRow[]): Organization[] {
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    role: o.members?.[0]?.role ?? "",
    planType: o.subscriptions?.[0]?.plan?.type ?? null,
  }));
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  /** Current workspace is School or Enterprise (team/collaboration APIs enabled). */
  currentOrgHasTeamCollaboration: boolean;
  /** User is OWNER/ADMIN member of at least one School/Enterprise org (may create extra orgs). */
  userHasAnyTeamOrg: boolean;
  switchOrganization: (orgId: number) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const persistOrg = useCallback((org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("organizationId", org.id.toString());
  }, []);

  const fetchOrganizations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(endpoints.organizations);
      const normalized = normalizeOrganizations(res.data as ApiOrganizationRow[]);
      setOrganizations(normalized);

      const savedOrgId = localStorage.getItem("organizationId");
      if (savedOrgId) {
        const found = normalized.find((o) => o.id === Number(savedOrgId));
        if (found) persistOrg(found);
        else if (normalized.length > 0) persistOrg(normalized[0]);
      } else if (normalized.length > 0) {
        persistOrg(normalized[0]);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, persistOrg]);

  const switchOrganization = useCallback(
    (orgId: number) => {
      const found = organizations.find((o) => o.id === orgId);
      if (found) persistOrg(found);
    },
    [organizations, persistOrg]
  );

  const currentOrgHasTeamCollaboration = useMemo(
    () => planSupportsTeamCollaboration(currentOrg?.planType),
    [currentOrg?.planType]
  );

  const userHasAnyTeamOrg = useMemo(
    () => organizations.some((o) => planSupportsTeamCollaboration(o.planType)),
    [organizations]
  );

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
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        isLoading,
        currentOrgHasTeamCollaboration,
        userHasAnyTeamOrg,
        switchOrganization,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within an OrganizationProvider");
  return context;
};
