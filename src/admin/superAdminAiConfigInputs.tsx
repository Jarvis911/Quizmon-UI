import { useEffect, useState } from "react";
import { SelectInput, type SelectInputProps } from "react-admin";
import { fetchAiConfigOptions, featureLabel } from "@/admin/superAdminAiOptions";

const requiredMissing = (value: unknown) => (value == null || value === "" ? "Required" : undefined);

function useAiOptionChoices(kind: "features" | "models") {
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAiConfigOptions()
      .then((opts) => {
        if (cancelled) return;
        const list = kind === "features" ? opts.features : opts.models;
        setChoices(list.map((id) => ({ id, name: kind === "features" ? featureLabel(id) : id })));
      })
      .catch(() => {
        if (!cancelled) setChoices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { choices, loading };
}

export function AiFeatureSelect(props: Partial<SelectInputProps>) {
  const { choices, loading } = useAiOptionChoices("features");
  return (
    <SelectInput
      source="featureName"
      label="Feature"
      choices={choices}
      isLoading={loading}
      validate={[requiredMissing]}
      fullWidth
      {...props}
    />
  );
}

export function AiModelSelect(props: Partial<SelectInputProps>) {
  const { choices, loading } = useAiOptionChoices("models");
  return (
    <SelectInput
      source="modelName"
      label="Gemini model"
      choices={choices}
      isLoading={loading}
      validate={[requiredMissing]}
      fullWidth
      defaultValue="gemini-2.5-flash"
      {...props}
    />
  );
}
