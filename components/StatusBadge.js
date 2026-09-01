import { Clock, ScanSearch, UserCheck, CheckCircle2, XCircle } from "lucide-react";

// Satu sumber kebenaran buat label/warna/ikon status — dipakai di StatusBadge,
// dropdown ganti status cepat di dashboard, dan label CSV, biar ga duplikat & selalu sinkron.
export const STATUS_META = {
  data_baru: { label: "Data Baru", classes: "bg-gray-100 text-gray-600", dot: "#94A3B8", icon: Clock },
  screening: { label: "Screening", classes: "bg-blue-100 text-blue-700", dot: "#3B82F6", icon: ScanSearch },
  onboarding: { label: "Onboarding", classes: "bg-purple-100 text-purple-700", dot: "#8B5CF6", icon: UserCheck },
  approved: { label: "Diterima", classes: "bg-green-100 text-green-700", dot: "#16A34A", icon: CheckCircle2 },
  rejected: { label: "Ditolak", classes: "bg-red-100 text-red-700", dot: "#DC2626", icon: XCircle },
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta?.icon;
  return (
    <span className={`badge gap-1 ${meta?.classes || "bg-gray-100 text-gray-600"}`}>
      {Icon && <Icon size={11} strokeWidth={2.25} />}
      {meta?.label || status}
    </span>
  );
}
