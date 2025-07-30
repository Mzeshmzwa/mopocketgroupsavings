import  { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaults, setVaults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get('/api/admin/users');
        const txRes = await axios.get('/api/admin/transactions');
        const vaultRes = await axios.get('/api/admin/vaults');
        setUsers(userRes.data);
        setTransactions(txRes.data);
        setVaults(vaultRes.data);
      } catch (err) {
        console.error('Admin fetch error:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <div>
        <h3>System Overview</h3>
        <p><strong>Total Users:</strong> {users.length}</p>
        <p><strong>Total Transactions:</strong> {transactions.length}</p>
        <p><strong>Total Vaults:</strong> {vaults.length}</p>
      </div>

      <hr />

      <div>
        <h3>Users</h3>
        {users.map((u, i) => (
          <div key={i}>
            <p><strong>{u.phoneNumber}</strong></p>
          </div>
        ))}
      </div>

      <hr />

      <div>
        <h3>Vault Records</h3>
        {vaults.map((v, i) => (
          <div key={i}>
            <p><strong>User:</strong> {v.userId}</p>
            {v.lockedDeposits.map((d, j) => (
              <div key={j} style={{ paddingLeft: 20 }}>
                <p>💰 Amount: {d.amount} | Status: {d.status}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
