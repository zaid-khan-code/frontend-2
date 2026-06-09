import React, { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Clock, Plus, RotateCcw, Users, X } from "lucide-react";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";
import { useLeaveBalanceSummary, useLeaves } from "../hooks/useLeaves";
import { useEmployees } from "../hooks/useEmployees";
import { useLeaveTypes } from "../hooks/useConfig";
import { getStatusColor } from "../services/api";
import { apiClient } from "../services/apiClient";

const API_ORIGIN = String(apiClient.defaults?.baseURL || "http://localhost:3001/api").replace(/\/api\/?$/, "");

function profileImageUrl(value?: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

function employeeInitials(name?: string, employeeId?: string) {
  return String(name || employeeId || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readableApprover(...values: any[]) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed && !isUuid(trimmed)) return trimmed;
  }
  return "";
}

export default function Leave() {
  const { data: serverLeaves = [], create: createLeave, approve: approveLeave, reject: rejectLeave, earlyReturn: earlyReturnLeave } = useLeaves();
  const { data: balanceSummaries = [] } = useLeaveBalanceSummary();
  const { data: employees = [] } = useEmployees();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { showToast } = useToastContext();
  const [tab, setTab] = useState("balances");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState("");
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
        approvedBy: readableApprover(leave.reviewed_by_name, leave.approved_by_name, leave.actioned_by_name, leave.reviewed_by),
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
      showToast("Please fill all mandatory fields.", "error");
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
    const reason = rejectComment.trim();
    if (!rejectModal || !reason) {
      showToast("Rejection reason is mandatory.", "error");
      return;
    }
    if (reason.split(/\s+/).filter(Boolean).length < 2) {
      showToast("Rejection reason must be more than one word.", "error");
      return;
    }
    if (reason.length > 256) {
      showToast("Rejection reason must be 256 characters or fewer.", "error");
      return;
    }
    setSaving(true);
    try {
      await rejectLeave({ id: rejectModal.id, reason });
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
    { label: "Pending Requests", value: counts.pending, icon: Clock, color: "linear-gradient(135deg,#f97316,#fbbf24)" },
    { label: "Approved Requests", value: counts.approved, icon: Check, color: "linear-gradient(135deg,#10b981,#34d399)" },
    { label: "Rejected Requests", value: counts.rejected, icon: X, color: "linear-gradient(135deg,#ec4899,#f43f5e)" },
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
          {balanceSummaries.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--t3)" }}>No leave balances found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Overall Status</th>
                  <th aria-label="Expand balance details" />
                </tr>
              </thead>
              <tbody>
                {balanceSummaries.map((balance: any) => {
                  const isExpanded = expandedEmployeeId === balance.employee_id;
                  const allocated = Number(balance.total_allocated ?? 0);
                  const used = Number(balance.total_used ?? 0);
                  const remaining = Number(balance.total_remaining ?? allocated - used);
                  const usedPercent = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
                  const photoUrl = profileImageUrl(balance.profile_photo_url);

                  return (
                    <React.Fragment key={balance.employee_id}>
                      <tr
                        onClick={() => setExpandedEmployeeId(isExpanded ? "" : balance.employee_id)}
                        style={{ cursor: "pointer" }}
                        aria-expanded={isExpanded}
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={`${balance.employee_name || balance.employee_id} profile`}
                                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(37,99,235,.1)", color: "var(--p)", fontSize: 11, fontWeight: 900, flex: "0 0 auto" }}>
                                {employeeInitials(balance.employee_name, balance.employee_id)}
                              </div>
                            )}
                            <div>
                              <strong>{balance.employee_name || balance.employee_id}</strong>
                              <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{balance.employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{balance.department_name || "Not provided"}</td>
                        <td style={{ minWidth: 240 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6, fontSize: 11 }}>
                            <span>{used.toLocaleString("en-PK")} taken of {allocated.toLocaleString("en-PK")}</span>
                            <strong>{remaining.toLocaleString("en-PK")} remaining</strong>
                          </div>
                          <div style={{ height: 7, borderRadius: 4, overflow: "hidden", background: "var(--br2)" }}>
                            <div style={{ width: `${usedPercent}%`, height: "100%", background: "var(--p)", borderRadius: 4 }} />
                          </div>
                        </td>
                        <td style={{ width: 44, textAlign: "right" }}>
                          <ChevronDown
                            size={17}
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .15s ease" }}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} style={{ background: "rgba(248,250,252,.7)", padding: 14 }}>
                            <table>
                              <thead>
                                <tr>
                                  <th>Leave Type</th>
                                  <th>Allocated</th>
                                  <th>Taken</th>
                                  <th>Remaining</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(balance.leave_types || []).map((leaveType: any) => (
                                  <tr key={leaveType.leave_type_id}>
                                    <td>{leaveType.leave_type_name || "Leave"}</td>
                                    <td className="mono">{Number(leaveType.allocated ?? 0).toLocaleString("en-PK")}</td>
                                    <td className="mono">{Number(leaveType.used ?? 0).toLocaleString("en-PK")}</td>
                                    <td className="mono">{Number(leaveType.remaining ?? 0).toLocaleString("en-PK")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
          <label className="form-label">Rejection Reason *</label>
          <textarea className="input" rows={3} maxLength={256} value={rejectComment} onChange={(event) => setRejectComment(event.target.value)} />
          <div style={{ marginTop: 5, fontSize: 11, color: "var(--t3)" }}>
            Mandatory. Use more than one word, maximum 256 characters.
          </div>
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
