import  { createContext, useState } from "react";

export const AdminContext = createContext(null);

export default function AdminProvider({ children }) {
  const [vaultSettings, setVaultSettings] = useState({
    interestRate: 0.05,
    earlyWithdrawalPenalty: 0.1,
    lockPeriods: [30, 60, 90], // days
  });

  const [allVaultUsers, setAllVaultUsers] = useState([]);
  const [adminActivityLog, setAdminActivityLog] = useState([]);

  return (
    <AdminContext.Provider
      value={{
        vaultSettings,
        setVaultSettings,
        allVaultUsers,
        setAllVaultUsers,
        adminActivityLog,
        setAdminActivityLog,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
