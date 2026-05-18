import { useGetList, useListContext } from "react-admin";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

const ORG_SCOPED_RESOURCES = new Set([
  "users",
  "quizzes",
  "ai-jobs",
  "classrooms",
  "matches",
  "homework",
  "subscriptions",
  "payments",
  "usage-metrics",
]);

/**
 * Organization filter shown in the list toolbar (always visible on org-scoped resources).
 * React Admin provides ListContext to `List` actions / TopToolbar children.
 */
export function OrganizationToolbarFilter() {
  const { resource, filterValues, setFilters, displayedFilters } = useListContext();

  const { data, isLoading } = useGetList("organizations", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "name", order: "ASC" },
    filter: {},
  });

  if (!ORG_SCOPED_RESOURCES.has(resource)) {
    return null;
  }

  const value =
    filterValues?.organizationId != null && filterValues.organizationId !== ""
      ? String(filterValues.organizationId)
      : "";

  const handleChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value;
    const next: Record<string, unknown> = { ...(filterValues ?? {}) };
    if (v === "") {
      delete next.organizationId;
    } else {
      next.organizationId = v;
    }
    setFilters(next, displayedFilters);
  };

  return (
    <Box sx={{ minWidth: 220, mr: 1, alignSelf: "center" }}>
      <FormControl size="small" fullWidth disabled={isLoading} variant="outlined">
        <InputLabel id="super-admin-org-toolbar-label">Organization</InputLabel>
        <Select
          labelId="super-admin-org-toolbar-label"
          label="Organization"
          value={value}
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>All organizations</em>
          </MenuItem>
          {(data as { id: number; name: string }[] | undefined)?.map((o) => (
            <MenuItem key={o.id} value={String(o.id)}>
              {o.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
