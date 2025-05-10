export const metadata = {
  title: "Full Kitting Management",
  description: "Manage TMT planning records and sync them to Google Sheets",
};

export default function FullKittingLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* You can add a header component here if needed */}
      {children}
    </div>
  );
}
