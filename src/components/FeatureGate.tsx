import { ReactNode } from "react";
import { useFeatures } from "@/context/FeatureContext";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLock?: boolean;
}

export default function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showLock = false 
}: FeatureGateProps) {
  const { canUseFeature } = useFeatures();
  const allowed = canUseFeature(feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLock) {
    return (
      <div className="relative pointer-events-none opacity-60">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-black/50 backdrop-blur-sm p-2 rounded-full border border-white/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
        </div>
        {children}
      </div>
    );
  }

  return null;
}
