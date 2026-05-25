import React, { useMemo, useState } from "react";
import { CalendarDays, Check, Clock, Plus, RotateCcw, Users, X } from "lucide-react";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";
import { useLeaveBalances, useLeaves } from "../hooks/useLeaves";
import { useEmployees } from "../hooks/useEmployees";
import { useLeaveTypes } from "../hooks/useConfig";
import { getStatusColor } from "../services/api";

function daysBetweenInclusive(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function formatDate(value?: string) {
  if (!value) return "Not provided";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(value?: string) {
  if (!value) return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function Leave() {
  const { data: serverLeaves = [], create: createLeave, approve: approveLeave, reject: rejectLeave, earlyReturn: earlyReturnLeave } = useLeaves();
  const { data: balances = [] } = useLeaveBalances();
  const { data: employees = [] } = useEmployees();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { showToast } = useToastContext();
  const [tab, setTab] = useState("all");
  const [newModal, setNewModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [earlyModal, setEarlyModal] = useState<any | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [earlyDate, setEarlyDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [newEmp, setNewEmp] = useState("");
  const [newType, setNewType] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newReason, setNewReason] = useState("");

  const rows = useMemo(() => {
    return serverLeaves.map((leave: any) => {
      const startDate = leave.start_date || leave.from;
      const endDate = leave.end_by_force || leave.end_date || leave.to;
      return {
        id: leave.id,
        empId: leave.employee_id,
        empName: leave.employee_name || leave.employee?.name || leave.name || leave.employee_id,
        leaveType: leave.leave_type || leave.leave_type_name || leave.leave_type?.name || "Leave",
        leaveTypeId: leave.leave_type_id,
        from: startDate,
        to: endDate,
        days: daysBetweenInclusive(startDate, endDate),
        reason: leave.reason || "Not provided",
        appliedOn: leave.created_at,
        status: statusLabel(leave.status),
        approvedBy: leave.reviewed_by_name || leave.approved_by_name || leave.actioned_by_name || leave.reviewed_by || "",
      };
    });
  }, [serverLeaves]);

  const filteredRows = tab === "all" ? rows : rows.filter((row: any) => row.status.toLowerCase() === tab);
  const counts = {
    total: rows.length,
    pending: rows.filter((row: any) => row.status === "Pending").length,
    approved: rows.filter((row: any) => row.status === "Approved").length,
    rejected: rows.filter((row: any) => row.status === "Rejected").length,
    onLeaveToday: rows.filter((row: any) => {
      const today = new Date().toISOString().slice(0, 10);
      return row.status === "Approved" && String(row.from).slice(0, 10) <= today && String(row.to).slice(0, 10) >= today;
    }).length,
  };

  const newDays = daysBetweenInclusive(newFrom, newTo);

  async function submitNew() {
    if (!newEmp || !newType || !newFrom || !newTo || !newReason.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      await createLeave({
        employee_id: newEmp,
        leave_type_id: newType,
        start_date: newFrom,
        end_date: newTo,
        reason: newReason.trim(),
      });
      setNewModal(false);
      setNewEmp("");
      setNewType("");
      setNewFrom("");
      setNewTo("");
      setNewReason("");
      showToast("Leave request submitted successfully.");
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || error.response?.data?.message || "Failed to submit leave request.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmApprove(row: any) {
    setSaving(true);
    try {
      await approveLeave(row.id);
      showToast("Leave approved.");
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || "Failed to approve leave.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmReject() {
    if (!rejectModal || !rejectComment.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }
    setSaving(true);
    try {
      await rejectLeave({ id: rejectModal.id, reason: rejectComment.trim() });
      setRejectModal(null);
      setRejectComment("");
      showToast("Leave rejected.");
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || "Failed to reject leave.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmEarlyReturn() {
    if (!earlyModal || !earlyDate) return;
    setSaving(true);
    try {
      await earlyReturnLeave({ id: earlyModal.id, actual_end_date: earlyDate });
      setEarlyModal(null);
      setEarlyDate("");
      showToast("Early return recorded.");
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || "Failed to record early return.", "error");
    } finally {
      setSaving(false);
    }
  }

  const statCards = [
    { label: "Total Requests", value: counts.total, icon: CalendarDays, color: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
    { label: "Pending", value: counts.pending, icon: Clock, color: "linear-gradient(135deg,#f97316,#fbbf24)" },
    { label: "Approved", value: counts.approved, icon: Check, color: "linear-gradient(135deg,#10b981,#34d399)" },
    { label: "Rejected", value: counts.rejected, icon: X, color: "linear-gradient(135deg,#ec4899,#f43f5e)" },
    { label: "On Leave Today", value: counts.onLeaveToday, icon: Users, color: "linear-gradient(135deg,#14b8a6,#06b6d4)" },
  ];

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Leave Management</div>
          <div className="pg-sub">Review live leave requests, balances, approvals, and early returns.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setNewModal(true)}>
          <Plus size={13} /> New Leave Request
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 18 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card" style={{ background: card.color, color: "#fff" }}>
              <Icon size={18} />
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>{card.value}</div>
              <div style={{ fontSize: 12, opacity: 0.86 }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="tabs">
        {["all", "pending", "approved", "rejected", "balances"].map((item) => (
          <button key={item} className={`tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {tab === "balances" ? (
        <div className="card">
          <div className="ch">
            <div className="ct">Leave Balance Overview</div>
          </div>
          {balances.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--t3)" }}>No leave balances found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Year</th>
                  <th>Balance</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance: any, index: number) => (
                  <tr key={`${balance.employee_id}-${balance.leave_type_id}-${index}`}>
                    <td>
                      <strong>{balance.name || balance.employee_name || balance.employee_id}</strong>
                      <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{balance.employee_id}</div>
                    </td>
                    <td>{balance.department_name || "Not provided"}</td>
                    <td>{balance.leave_type_name || balance.name || "Leave"}</td>
                    <td className="mono">{balance.year || new Date().getFullYear()}</td>
                    <td className="mono">{Number(balance.balance ?? 0).toLocaleString("en-PK")}</td>
                    <td className="mono">{Number(balance.used ?? 0).toLocaleString("en-PK")}</td>
                    <td className="mono">{Number(balance.remaining ?? Number(balance.balance ?? 0) - Number(balance.used ?? 0)).toLocaleString("en-PK")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          {filteredRows.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--t3)" }}>
              <CalendarDays size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>No leave requests found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Approved By</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row: any) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 700 }}>
                      {row.empName}
                      <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{row.empId}</div>
                    </td>
                    <td>{row.leaveType}</td>
                    <td className="mono">{formatDate(row.from)}</td>
                    <td className="mono">{formatDate(row.to)}</td>
                    <td className="mono">{row.days}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.reason}</td>
                    <td>{row.approvedBy || "Not provided"}</td>
                    <td className="mono">{formatDate(row.appliedOn)}</td>
                    <td><span className={`pill ${getStatusColor(row.status)}`}>{row.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {row.status === "Pending" && (
                          <>
                            <button className="ico-btn" title="Approve" onClick={() => confirmApprove(row)} disabled={saving}>
                              <Check size={13} />
                            </button>
                            <button className="ico-btn" title="Reject" onClick={() => setRejectModal(row)} disabled={saving}>
                              <X size={13} />
                            </button>
                          </>
                        )}
                        {row.status === "Approved" && (
                          <button className="btn btn-sm btn-ghost" onClick={() => setEarlyModal(row)}>
                            <RotateCcw size={12} /> Early Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Leave Request">
        <div className="form-group">
          <label className="form-label">Employee *</label>
          <select className="input select-input" value={newEmp} onChange={(event) => setNewEmp(event.target.value)}>
            <option value="">Select employee...</option>
            {employees.map((employee: any) => (
              <option key={employee.id} value={employee.id}>{employee.name} ({employee.id})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Leave Type *</label>
          <select className="input select-input" value={newType} onChange={(event) => setNewType(event.target.value)}>
            <option value="">Select leave type...</option>
            {leaveTypes.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">From Date *</label>
            <input className="input" type="date" value={newFrom} onChange={(event) => setNewFrom(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date *</label>
            <input className="input" type="date" value={newTo} onChange={(event) => setNewTo(event.target.value)} />
          </div>
        </div>
        {newFrom && newTo && <div style={{ fontSize: 12, marginBottom: 8, color: "var(--p)", fontWeight: 700 }}>Days Requested: <span className="mono">{newDays}</span></div>}
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <textarea className="input" rows={3} value={newReason} onChange={(event) => setNewReason(event.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submitNew} disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</button>
        </div>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Leave Request">
        <div style={{ fontSize: 12.5, marginBottom: 12 }}>
          <strong>{rejectModal?.empName}</strong> - {rejectModal?.leaveType} ({formatDate(rejectModal?.from)} to {formatDate(rejectModal?.to)})
        </div>
        <div className="form-group">
          <label className="form-label">Reason for Rejection *</label>
          <textarea className="input" rows={3} value={rejectComment} onChange={(event) => setRejectComment(event.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmReject} disabled={saving}>Reject</button>
        </div>
      </Modal>

      <Modal open={!!earlyModal} onClose={() => setEarlyModal(null)} title="Mark Early Return">
        <div style={{ background: "var(--inp)", padding: 12, borderRadius: "var(--rsm)", marginBottom: 12, fontSize: 12.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{earlyModal?.empName} - {earlyModal?.leaveType}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>Original: {formatDate(earlyModal?.from)} to {formatDate(earlyModal?.to)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Employee returned on</label>
          <input className="input" type="date" value={earlyDate} onChange={(event) => setEarlyDate(event.target.value)} min={String(earlyModal?.from || "").slice(0, 10)} max={String(earlyModal?.to || "").slice(0, 10)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setEarlyModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmEarlyReturn} disabled={saving || !earlyDate}>Confirm Early Return</button>
        </div>
      </Modal>
    </div>
  );
}
