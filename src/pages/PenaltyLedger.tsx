import React, { useMemo } from "react";
import { usePenalties } from "../hooks/usePenalties";

export default function PenaltyLedger() {
  const { data: serverPenalties = [] } = usePenalties();

  const penalties = useMemo(() => {
    return serverPenalties.map((p: any) => ({
      id: p.id,
      empName: p.employee?.name || p.employee_id,
      type: p.penalty_rule?.name || 'Manual Penalty',
      amount: p.amount,
      date: p.created_at ? p.created_at.split('T')[0] : '',
      status: p.status,
    }));
  }, [serverPenalties]);

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Ledger</div>
          <div className="pg-sub">Track applied penalties, reversals and totals.</div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {penalties.map((row: any) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.empName}</td>
                <td>{row.type}</td>
                <td className="mono">PKR {row.amount.toLocaleString()}</td>
                <td className="mono">{row.date}</td>
                <td><span className={`pill ${row.status === 'approved' ? 'pill-green' : row.status === 'rejected' ? 'pill-red' : 'pill-amber'}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
