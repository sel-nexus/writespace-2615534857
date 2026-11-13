/** Display a single dashboard statistic. */
import PropTypes from 'prop-types';

/** Render a labeled count with a restrained color accent. */
export function StatCard({ label, count, color }) {
  return (
    <div className={`rounded-xl border border-slate-200 border-t-4 bg-white p-5 ${color}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{count}</p>
    </div>
  );
}
StatCard.propTypes = { label: PropTypes.string.isRequired, count: PropTypes.number.isRequired, color: PropTypes.string.isRequired };
