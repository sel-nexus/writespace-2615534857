/** Guard local routes against missing sessions and inappropriate roles. */
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

/** Redirect guests and non-admins before rendering protected content. */
export function ProtectedRoute({ session, role, children }) {
  if (!session) return <Navigate to="/login" replace />;
  if (role && session.role !== role) return <Navigate to="/blogs" replace />;
  return children;
}
ProtectedRoute.propTypes = {
  session: PropTypes.shape({ role: PropTypes.string }),
  role: PropTypes.string,
  children: PropTypes.node.isRequired,
};
