import { useEffect, useState } from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SaveButton,
  Toolbar,
  useRecordContext,
  useNotify,
  useRefresh,
  required,
} from "react-admin";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField as MuiTextField,
  Typography,
} from "@mui/material";
import { superAdminHttpJson } from "@/admin/superAdminHttp";
import {
  buildFeatureDrafts,
  PLAN_FEATURE_LABELS,
  type FeatureDraftRow,
  type PlanFeatureRow,
} from "@/admin/superAdminPlanConstants";

type PlanRecord = {
  id: number;
  type: string;
  name: string;
  description?: string | null;
  features?: PlanFeatureRow[];
};

function PlanFeaturesEditor() {
  const record = useRecordContext<PlanRecord>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [keys, setKeys] = useState<string[]>([]);
  const [rows, setRows] = useState<FeatureDraftRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { keys: featureKeys } = await superAdminHttpJson<{ keys: string[] }>("/admin/plans/keys");
        if (cancelled) return;
        setKeys(featureKeys);
        setRows(buildFeatureDrafts(record.features, featureKeys));
      } catch (e) {
        if (!cancelled) {
          notify(e instanceof Error ? e.message : "Failed to load feature keys", { type: "error" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [record?.id, record?.features, notify]);

  if (!record) return null;

  const saveFeatures = async () => {
    const payload: PlanFeatureRow[] = [];
    for (const row of rows) {
      let limit: number | null = null;
      if (row.limitStr.trim() !== "") {
        const n = Number(row.limitStr);
        if (Number.isNaN(n) || n < 0) {
          notify(`Invalid limit for ${PLAN_FEATURE_LABELS[row.featureKey] ?? row.featureKey}`, { type: "error" });
          return;
        }
        limit = n;
      }
      payload.push({ featureKey: row.featureKey, enabled: row.enabled, limit });
    }

    setSaving(true);
    try {
      await superAdminHttpJson(`/admin/plans/${record.id}/features`, {
        method: "PUT",
        body: JSON.stringify({ features: payload }),
      });
      notify("Plan features updated", { type: "success" });
      refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed to save features", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 3, width: "100%" }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Feature matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enable capabilities and numeric limits per plan. Save separately from plan details above.
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell align="center">Enabled</TableCell>
              <TableCell>Limit (empty = unlimited)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.featureKey}>
                <TableCell>{PLAN_FEATURE_LABELS[row.featureKey] ?? row.featureKey}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={row.enabled}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, enabled: e.target.checked } : r))
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <MuiTextField
                    size="small"
                    value={row.limitStr}
                    disabled={!row.enabled}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, limitStr: e.target.value } : r))
                      )
                    }
                    placeholder="—"
                    fullWidth
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {keys.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading feature keys…
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={saveFeatures} disabled={saving || keys.length === 0}>
          {saving ? "Saving…" : "Save features"}
        </Button>
      </Box>
    </Box>
  );
}

const PlanEditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export function SuperAdminPlanEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm toolbar={<PlanEditToolbar />}>
        <TextInput source="type" disabled fullWidth helperText="Plan type is fixed" />
        <TextInput source="name" validate={[required()]} fullWidth />
        <TextInput source="description" fullWidth multiline minRows={2} />
        <NumberInput source="priceMonthly" min={0} />
        <NumberInput source="priceYearly" min={0} />
        <BooleanInput source="isActive" />
        <PlanFeaturesEditor />
      </SimpleForm>
    </Edit>
  );
}
