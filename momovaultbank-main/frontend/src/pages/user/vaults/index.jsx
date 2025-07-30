// src/pages/Vaults.js
import  { useEffect, useState } from 'react';
import axios from 'axios';

export default function Vaults() {
  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await axios.get('/api/user/' + localStorage.getItem('userId'));
        setDeposits(res.data.data.lockedDeposits || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVault();
  }, []);

  const calculateProgress = (start, end) => {
    const now = new Date();
    const total = new Date(end) - new Date(start);
    const elapsed = now - new Date(start);
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  return (
    <div className="container">
      <h2>Your Vaults</h2>
      {deposits.length === 0 && <p>No deposits yet.</p>}
      {deposits.map((vault, index) => (
        <div key={index} style={{ marginBottom: 20, border: '1px solid #ccc', padding: 10 }}>
          <p><strong>Amount:</strong> E{vault.amount}</p>
          <p><strong>Status:</strong> {vault.status}</p>
          <p><strong>Locked For:</strong> {vault.lockPeriodInDays} days</p>
          <p><strong>Start:</strong> {new Date(vault.startDate).toLocaleDateString()}</p>
          <p><strong>End:</strong> {new Date(vault.endDate).toLocaleDateString()}</p>
          <div style={{ height: 10, background: '#eee', borderRadius: 4 }}>
            <div
              style={{
                height: '100%',
                width: calculateProgress(vault.startDate, vault.endDate) + '%',
                backgroundColor: '#4caf50',
                borderRadius: 4
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
