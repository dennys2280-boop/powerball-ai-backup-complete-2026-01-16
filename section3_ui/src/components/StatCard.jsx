export default function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
            {helper ? (
                <div className="mt-2 text-xs text-slate-500">{helper}</div>
            ) : null}
        </div>
    );
}
