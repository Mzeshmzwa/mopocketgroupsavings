import { createContext, useState } from "react";

export const UserContext = createContext(null);

export default function UserProvider({ children }) {
  const [userVaults, setUserVaults] = useState([]); // List of user's vaults
  const [activeVault, setActiveVault] = useState(null); // Currently selected vault
  const [depositInProgress, setDepositInProgress] = useState(false); // Deposit loading status
  const [withdrawalRequest, setWithdrawalRequest] = useState(null); // Withdrawal request details

  return (
    <UserContext.Provider
      value={{
        userVaults,
        setUserVaults,
        activeVault,
        setActiveVault,
        depositInProgress,
        setDepositInProgress,
        withdrawalRequest,
        setWithdrawalRequest,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
