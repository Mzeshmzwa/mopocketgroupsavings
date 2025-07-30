import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/user/home';
import AdminDashboard from '../pages/admin';
import CreateSavingsGroup from '../pages/savings-groups/create';
import GroupDetails from '../pages/savings-groups/details';
import JoinGroup from '../pages/savings-groups/join';
import ContributeToGroup from '../pages/savings-groups/contribute';

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<HomePage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Savings Groups Routes */}
        <Route path="/admin/savings-groups/create" element={<CreateSavingsGroup />} />
        <Route path="/savings-groups/:groupId" element={<GroupDetails />} />
        <Route path="/savings-groups/:groupId/join" element={<JoinGroup />} />
        <Route path="/savings-groups/:groupId/contribute" element={<ContributeToGroup />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;