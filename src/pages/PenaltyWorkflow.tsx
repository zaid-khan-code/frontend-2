import React, { useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { usePenalties } from "../hooks/usePenalties";
import { useToastContext } from "../context/ToastContext";

export default function PenaltyWorkflow() {
  const { data: serverPenalties = [], approve, reject, acknowledge } = usePenalties();
  const { showToast } = useToastContext();

  const cases = useMemo(() => {
    return serverPenalties.map((p: any) => ({
      id: p.id,
      empName: p.employee?.name || p.employee_id,
      branch: p.employee?.branch || 'Head Office',
      amount: p.amount,
      type: p.penalty_rule?.name || 'Manual Penalty',
      workflowStatus: p.status, // "pending", "approved", "rejected", "acknowledged"
    }));
  }, [serverPenalties]);

  const handleApprove = async (id: string) => {
    try {
      const penalty = cases.find((c: any) => c.id === id);
      await approve({ id, amount: penalty?.amount ?? 0 });
      showToast('Penalty approved');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject({ id, notes: 'Rejected via workflow' });
      showToast('Penalty rejected');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const handleAck = async (id: string) => {
    try {
      await acknowledge(id);
      showToast('Penalty acknowledged');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to acknowledge', 'error');
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Approval Workflow</div>
          <div className="pg-sub">Branch review → HO approval → Employee acknowledgment workflow.</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Branch</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.empName}</td>
                <td>{row.branch}</td>
                <td className="mono">PKR {row.amount.toLocaleString()}</td>
                <td>{row.type}</td>
                <td>
                  <span className={`pill ${row.workflowStatus === "approved" ? "pill-green" : row.workflowStatus === "rejected" ? "pill-red" : row.workflowStatus === "employee_acknowledged" ? "pill-blue" : "pill-amber"}`}>
                    {row.workflowStatus.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: 'wrap' }}>
                    {row.workflowStatus === "pending" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => handleApprove(row.id)}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(row.id)}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {row.workflowStatus === "approved" && (
                      <button className="btn btn-sm btn-info" onClick={() => handleAck(row.id)}>
                        Mark Acknowledged
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
