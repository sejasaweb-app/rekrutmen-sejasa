const LABELS = {
  data_baru: "Data Baru",
  screening: "Screening",
  onboarding: "Onboarding",
  approved: "Diterima",
  rejected: "Ditolak",
};

const COLORS = {
  data_baru: "bg-gray-100 text-gray-600",
  screening: "bg-blue-100 text-blue-700",
  onboarding: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {LABELS[status] || status}
    </span>
  );
}