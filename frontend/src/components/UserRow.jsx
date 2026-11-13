/** Present an account and its deletion control at any viewport size. */
import PropTypes from 'prop-types';
import { Avatar } from './Avatar';
import { formatPostDate } from '../utils/posts';

/** Show one local account, disabling protected accounts. */
export function UserRow({ account, currentId, onDelete, layout = 'card' }) {
  const isDefault = account.id === 'admin';
  const isCurrent = account.id === currentId;
  const reason = isDefault ? 'Default admin cannot be deleted.' : isCurrent ? 'Your active account cannot be deleted.' : '';
  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar role={account.role} />
      <div className="min-w-0">
        <p className="break-words font-semibold text-slate-900">{account.displayName}</p>
        <p className="break-all text-sm text-slate-500">@{account.username}</p>
      </div>
    </div>
  );
  const role = <span
    className={`rounded-full px-3 py-0.5 text-sm font-medium ring-1 ${account.role === 'admin' ? 'bg-violet-100 text-violet-700 ring-violet-300' : 'bg-indigo-100 text-indigo-700 ring-indigo-300'}`}
  >{account.role === 'admin' ? 'Admin' : 'user'}</span>;
  const date = <span className="text-sm text-slate-500">{formatPostDate(account.createdAt)}</span>;
  const action = (
    <span title={reason}>
      <button
        type="button"
        aria-label={`Delete ${account.username}`}
        disabled={!!reason}
        title={reason}
        onClick={() => onDelete(account)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >Delete</button>
    </span>
  );
  if (layout === 'table') {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-4">{identity}</td>
        <td className="px-5 py-4">{role}</td>
        <td className="px-5 py-4">{date}</td>
        <td className="px-5 py-4">{action}</td>
      </tr>
    );
  }
  return (
    <li className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4">
      {identity}
      <div className="flex flex-wrap items-center gap-4">
        {role}
        {date}
        {action}
      </div>
    </li>
  );
}
UserRow.propTypes = { account: PropTypes.shape({ id: PropTypes.string.isRequired, username: PropTypes.string.isRequired, displayName: PropTypes.string.isRequired, role: PropTypes.oneOf(['admin', 'user']).isRequired, createdAt: PropTypes.string }).isRequired, currentId: PropTypes.string.isRequired, onDelete: PropTypes.func.isRequired, layout: PropTypes.oneOf(['card', 'table']) };
