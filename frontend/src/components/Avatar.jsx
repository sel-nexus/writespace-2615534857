/** Render the role-specific local identity marker. */
import PropTypes from 'prop-types';

/** Return the avatar associated with a role. */
export function getAvatar(role) {
  return (
    <span aria-hidden="true" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-white ${role === 'admin' ? 'bg-violet-600' : 'bg-indigo-500'}`}>
      {role === 'admin' ? '👑' : '📖'}
    </span>
  );
}

/** Show an avatar for the supplied role. */
export function Avatar({ role }) { return getAvatar(role); }
Avatar.propTypes = { role: PropTypes.oneOf(['admin', 'user']).isRequired };
