import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { usePenalties } from "../hooks/usePenalties";
import { useToastContext } from "../context/ToastContext";
import { formatPKR } from "../services/api";
import Modal from "../components/common/Modal";

function normalizePenalty(p: any) {
  return {
    id: p.id,
    empName: p.employee_name || p.employee?.name || p.employee_id || "-",
    employeeId: p.employee_id,
    amount: Number(p.amount_pkr ?? p.amount ?? p.final_amount ?? p.penalty_amount ?? 0),
    type: p.rule_name || p.penalty_rule?.name || p.type || "Manual Penalty",
    reason: p.reason || p.review_note || "No reason provided",
    date: (p.date || p.created_at || "").split("T")[0],
    workflowStatus: String(p.status || "pending").toLowerCase(),
    employeeAck: Boolean(p.employee_ack || p.ack || p.acknowledged),
  };
}

export default function PenaltyWorkflow() {
  const { data: serverPenalties = [], isLoading, isError, approve, reject } = usePenalties({ status: "pending" });
  const { showToast } = useToastContext();
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const cases = useMemo(() => serverPenalties.map(normalizePenalty), [serverPenalties]);
  const rejectTarget = cases.find((row) => row.id === rejectTargetId);

  const handleApprove = async (id: string) => {
    try {
      await approve({ id });
      showToast("Penalty approved");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to approve", "error");
    }
  };

  const openReject = (id: string) => {
    setRejectTargetId(id);
    setReviewNote("");
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    if (!reviewNote.trim()) {
      showToast("Add a review note before rejecting", "error");
      return;
    }

    try {
      setIsRejecting(true);
      await reject({ id: rejectTargetId, reviewNote: reviewNote.trim() });
      showToast("Penalty rejected");
      setRejectTargetId(null);
      setReviewNote("");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to reject", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Approval Workflow</div>
          <div className="pg-sub">
            Review HR-proposed penalties before employees acknowledge approved deductions.
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>
            Loading penalties...
          </div>
        ) : isError ? (
          <div style={{ padding: 36, textAlign: "center", color: "#dc2626" }}>
            Unable to load penalties.
          </div>
        ) : cases.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>
            No penalties are waiting for review.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Rule</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.id}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.empName}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>
                      {row.employeeId}
                    </div>
                  </td>
                  <td className="mono">{row.date || "-"}</td>
                  <td>{row.type}</td>
                  <td>{row.reason}</td>
                  <td className="mono">{formatPKR(row.amount)}</td>
                  <td>
                    <span
                      className={`pill ${
                        row.workflowStatus === "approved"
                          ? "pill-green"
                          : row.workflowStatus === "rejected"
                            ? "pill-red"
                            : "pill-amber"
                      }`}
                    >
                      {row.workflowStatus === "approved" && row.employeeAck
                        ? "ACKNOWLEDGED"
                        : row.workflowStatus.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {row.workflowStatus === "pending" && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => handleApprove(row.id)}>
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => openReject(row.id)}>
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        title="Reject Penalty"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRejectTargetId(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? "Rejecting..." : "Reject Penalty"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {rejectTarget && (
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
              Rejecting <strong>{rejectTarget.type}</strong> for{" "}
              <strong>{rejectTarget.empName}</strong>. Add a clear note so branch HR can understand the decision.
            </div>
          )}
          <div className="form-group">
            <label className="form-label">
              Review note <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              className="input"
              style={{ minHeight: 96, paddingTop: 10 }}
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Explain why this penalty is being rejected..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
