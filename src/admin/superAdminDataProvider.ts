import type { DataProvider, GetListParams, GetListResult, Identifier } from "react-admin";
import { superAdminHttpJson } from "@/admin/superAdminHttp";

function orgIdParam(f: Record<string, string | boolean | undefined>): string | undefined {
  const v = f.organizationId;
  if (v === undefined || v === null || v === "") return undefined;
  return String(v);
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function sortRows<T extends Record<string, unknown>>(rows: T[], field?: string, order?: "ASC" | "DESC"): T[] {
  if (!field) return rows;
  const dir = order === "DESC" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
}

function paginateRows<T>(rows: T[], page: number, perPage: number): { data: T[]; total: number } {
  const total = rows.length;
  const start = (page - 1) * perPage;
  const data = rows.slice(start, start + perPage);
  return { data, total };
}

async function getListGeneric<T extends { id: number }>(
  fetchPath: string,
  query: Record<string, string | undefined>,
  params: GetListParams
): Promise<GetListResult<T>> {
  const rows = await superAdminHttpJson<T[]>(`${fetchPath}${buildQuery(query)}`);
  const sorted = sortRows(rows as Record<string, unknown>[], params.sort?.field, params.sort?.order) as T[];
  const { page = 1, perPage = 25 } = params.pagination || {};
  return paginateRows(sorted, page, perPage);
}

function pickById<T extends { id: number }>(rows: T[], id: Identifier): T {
  const n = Number(id);
  const row = rows.find((r) => r.id === n);
  if (!row) throw new Error("Not found");
  return row;
}

export const superAdminDataProvider: DataProvider = {
  getList: (resource, params) => {
    const f = (params.filter || {}) as Record<string, string | boolean | undefined>;

    const org = orgIdParam(f);

    switch (resource) {
      case "organizations":
        return getListGeneric("/admin/organizations", { search: f.search as string | undefined }, params);
      case "classrooms":
        return getListGeneric("/admin/classrooms", { search: f.search as string | undefined, organizationId: org }, params);
      case "matches":
        return getListGeneric(
          "/admin/matches",
          { search: f.search as string | undefined, organizationId: org, mode: "REALTIME" },
          params
        );
      case "homework":
        return getListGeneric("/admin/homework", { search: f.search as string | undefined, organizationId: org }, params);
      case "subscriptions":
        return getListGeneric("/admin/subscriptions", { organizationId: org, status: f.status as string | undefined }, params);
      case "payments":
        return getListGeneric("/admin/payments", { organizationId: org, status: f.status as string | undefined }, params);
      case "usage-metrics":
        return getListGeneric("/admin/usage-metrics", { organizationId: org, key: f.key as string | undefined }, params);
      case "users": {
        const raw = f.isAdmin;
        let isAdminParam: string | undefined;
        if (raw === true || raw === "true") isAdminParam = "true";
        else if (raw === false || raw === "false") isAdminParam = "false";
        return getListGeneric(
          "/admin/users",
          { search: f.search as string | undefined, isAdmin: isAdminParam, organizationId: org },
          params
        );
      }
      case "quizzes":
        return getListGeneric(
          "/admin/quizzes",
          {
            search: f.search as string | undefined,
            categoryId: f.categoryId != null ? String(f.categoryId) : undefined,
            organizationId: org,
          },
          params
        );
      case "reports":
        return getListGeneric("/admin/reports", { status: f.status as string | undefined, reportType: f.reportType as string | undefined }, params);
      case "promotions":
        return getListGeneric("/admin/promotions", {}, params);
      case "plans":
        return getListGeneric("/admin/plans", {}, params);
      case "ai-jobs":
        return getListGeneric(
          "/admin/ai-jobs",
          {
            status: f.status as string | undefined,
            userId: f.userId != null ? String(f.userId) : undefined,
            organizationId: org,
          },
          params
        );
      case "ai-config":
        return getListGeneric("/admin/ai-config", {}, params);
      default:
        return Promise.reject(new Error(`Unknown resource: ${resource}`));
    }
  },

  getOne: async (resource, params) => {
    const { data } = await superAdminDataProvider.getList(resource, {
      pagination: { page: 1, perPage: 500 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    } as GetListParams);
    const row = pickById(data as { id: number }[], params.id);
    return { data: row };
  },

  getMany: async (resource, params) => {
    const { data: all } = await superAdminDataProvider.getList(resource, {
      pagination: { page: 1, perPage: 500 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    } as GetListParams);
    const want = new Set(params.ids.map(Number));
    const data = (all as { id: number }[]).filter((r) => want.has(r.id));
    return { data };
  },

  getManyReference: () => Promise.reject(new Error("Not supported")),

  create: async (resource, params) => {
    if (resource === "ai-config") {
      const d = params.data as Record<string, unknown>;
      const created = await superAdminHttpJson<Record<string, unknown>>("/admin/ai-config", {
        method: "PUT",
        body: JSON.stringify({
          featureName: d.featureName,
          modelName: d.modelName ?? "gemini-2.5-flash",
          isActive: d.isActive ?? true,
        }),
      });
      return { data: created };
    }
    if (resource !== "promotions") return Promise.reject(new Error("Create not supported"));
    const d = params.data as Record<string, unknown>;
    const body = {
      title: d.title,
      subtitle: d.subtitle,
      description: d.description,
      planId: Number(d.planId),
      discountedPriceMonthly: d.discountedPriceMonthly != null ? Number(d.discountedPriceMonthly) : 0,
      discountedPriceYearly: d.discountedPriceYearly != null ? Number(d.discountedPriceYearly) : 0,
      expiresAt: d.expiresAt instanceof Date ? d.expiresAt.toISOString() : String(d.expiresAt),
      isPublished: Boolean(d.isPublished),
      bannerColor: d.bannerColor,
      badgeText: d.badgeText,
    };
    const created = await superAdminHttpJson<Record<string, unknown>>("/admin/promotions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { data: created };
  },

  update: async (resource, params) => {
    const id = Number(params.id);
    if (resource === "reports") {
      const status = (params.data as { status?: string }).status;
      const updated = await superAdminHttpJson<Record<string, unknown>>(`/admin/reports/${id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      return { data: updated };
    }
    if (resource === "plans") {
      const d = params.data as Record<string, unknown>;
      const body = {
        name: d.name,
        description: d.description,
        priceMonthly: d.priceMonthly != null ? Number(d.priceMonthly) : undefined,
        priceYearly: d.priceYearly != null ? Number(d.priceYearly) : undefined,
        isActive: d.isActive,
      };
      const updated = await superAdminHttpJson<Record<string, unknown>>(`/admin/plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return { data: updated };
    }
    if (resource === "promotions") {
      const d = { ...(params.data as Record<string, unknown>) };
      delete d.id;
      delete d.plan;
      delete d.createdAt;
      delete d.updatedAt;
      if (d.planId != null) d.planId = Number(d.planId);
      if (d.expiresAt instanceof Date) d.expiresAt = d.expiresAt.toISOString();
      else if (d.expiresAt != null) d.expiresAt = String(d.expiresAt);
      const updated = await superAdminHttpJson<Record<string, unknown>>(`/admin/promotions/${id}`, {
        method: "PUT",
        body: JSON.stringify(d),
      });
      return { data: updated };
    }
    if (resource === "users") {
      const isAdmin = Boolean((params.data as { isAdmin?: boolean }).isAdmin);
      const updated = await superAdminHttpJson<Record<string, unknown>>(`/admin/users/${id}/admin`, {
        method: "PUT",
        body: JSON.stringify({ isAdmin }),
      });
      return { data: updated };
    }
    if (resource === "ai-config") {
      const d = params.data as Record<string, unknown>;
      const updated = await superAdminHttpJson<Record<string, unknown>>("/admin/ai-config", {
        method: "PUT",
        body: JSON.stringify({
          featureName: d.featureName,
          modelName: d.modelName ?? "gemini-2.5-flash",
          isActive: d.isActive ?? true,
        }),
      });
      return { data: updated };
    }
    return Promise.reject(new Error("Update not supported"));
  },

  updateMany: () => Promise.reject(new Error("Not supported")),

  delete: async (resource, params) => {
    if (resource === "quizzes") {
      await superAdminHttpJson(`/admin/quizzes/${params.id}`, { method: "DELETE" });
      return { data: params.previousData };
    }
    if (resource === "promotions") {
      await superAdminHttpJson(`/admin/promotions/${params.id}`, { method: "DELETE" });
      return { data: params.previousData };
    }
    return Promise.reject(new Error("Delete not supported"));
  },

  deleteMany: async (resource, params) => {
    if (resource !== "quizzes" && resource !== "promotions") {
      return Promise.reject(new Error("deleteMany not supported"));
    }
    await Promise.all(params.ids.map((id) => superAdminDataProvider.delete(resource, { id, previousData: {} })));
    return { data: params.ids };
  },
};
