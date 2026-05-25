import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { usePenalties } from "../hooks/usePenalties";
import { formatPKR } from "../services/api";
import { usePenaltyRules } from "../hooks/useConfig";
import { useEmployees } from "../hooks/useEmployees";
import { useAuthStore } from "../store/useAuthStore";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";

function normalizePenalty(p: any) {
  const status = String(p.status || "pending").toLowerCase();
  return {
    id: p.id,
    employeeName: p.employee_name || p.employee?.name || p.employee_id || "-",
    employeeId: p.employee_id,
    rule: p.rule_name || p.penalty_rule?.name || p.penalty_type || "Manual Penalty",
    reason: p.reason || p.review_note || "No reason provided",
    amount: Number(p.amount_pkr ?? p.amount ?? p.final_amount ?? p.penalty_amount ?? 0),
    date: (p.date || p.created_at || "").split("T")[0],
    status,
    acknowledged: Boolean(p.employee_ack || p.ack || p.acknowledged),
  };
}

export default function PenaltyLedger() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    rule_id: "",
    date: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const canPropose = useAuthStore((state) => state.hasPermission("penalties:propose"));
  const { showToast } = useToastContext();
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (employeeFilter.trim()) params.employee_id = employeeFilter.trim();
    return Object.keys(params).length ? params : undefined;
  }, [employeeFilter, statusFilter]);

  const { data: serverPenalties = [], isLoading, isError, propose } = usePenalties(queryParams);
  const { data: employees = [] } = useEmployees({ limit: 500 });
  const { data: rules = [] } = usePenaltyRules();

  const penalties = useMemo(
    () => serverPenalties.map(normalizePenalty),
    [serverPenalties],
  );

  const filtered = penalties.filter((row) => {
    const haystack = `${row.employeeName} ${row.employeeId} ${row.rule} ${row.reason}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  });

  const approvedTotal = filtered
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + row.amount, 0);

  const submitPenalty = async () => {
    if (!form.employee_id || !form.rule_id || !form.date || !form.reason.trim()) {
      showToast("Please select employee, rule, date, and reason.", "error");
      return;
    }
    try {
      await propose({
        employee_id: form.employee_id,
        rule_id: form.rule_id,
        date: form.date,
        reason: form.reason.trim(),
      });
      showToast("Penalty submitted for review.");
      setModalOpen(false);
      setForm({ employee_id: "", rule_id: "", date: new Date().toISOString().slice(0, 10), reason: "" });
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || "Could not submit penalty.", "error");
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty</div>
          <div className="pg-sub">Track proposed, approved, rejected, and acknowledged penalties from the backend.</div>
        </div>
        {canPropose && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={13} /> Apply Penalty
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
        <div className="card">
          <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 800, textTransform: "uppercase" }}>Records</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{filtered.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 800, textTransform: "uppercase" }}>Approved Amount</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#c62828" }}>{formatPKR(approvedTotal)}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 800, textTransform: "uppercase" }}>Acknowledged</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{filtered.filter((row) => row.acknowledged).length}</div>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <div className="ct">Penalty Records</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              style={{ width: 150 }}
              placeholder="Employee ID"
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
            />
            <div className="input-wrap" style={{ width: 220 }}>
              <Search size={13} />
              <input className="input" placeholder="Search employee or rule..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="input select-input" style={{ width: 150 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>Loading penalties...</div>
        ) : isError ? (
          <div style={{ padding: 36, textAlign: "center", color: "#dc2626" }}>Unable to load penalties.</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>No penalties found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Date</th><th>Rule</th><th>Reason</th><th>Amount</th><th>Status</th><th>ACK</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.employeeName}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{row.employeeId}</div>
                  </td>
                  <td className="mono">{row.date || "-"}</td>
                  <td>{row.rule}</td>
                  <td>{row.reason}</td>
                  <td className="mono">{formatPKR(row.amount)}</td>
                  <td>
                    <span className={`pill ${row.status === "approved" ? "pill-green" : row.status === "rejected" ? "pill-red" : "pill-amber"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${row.acknowledged ? "pill-green" : "pill-steel"}`}>
                      {row.acknowledged ? "Acknowledged" : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Apply Penalty">
        <div style={{ display: "grid", gap: 14 }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Employee</span>
            <select className="input select-input" value={form.employee_id} onChange={(event) => setForm((prev) => ({ ...prev, employee_id: event.target.value }))}>
              <option value="">Select employee...</option>
              {employees.map((employee: any) => (
                <option key={employee.id} value={employee.id}>{employee.name} ({employee.id})</option>
              ))}
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Penalty Rule</span>
            <select className="input select-input" value={form.rule_id} onChange={(event) => setForm((prev) => ({ ...prev, rule_id: event.target.value }))}>
              <option value="">Select rule...</option>
              {rules.map((rule: any) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name} - {formatPKR(Number(rule.amount_pkr || 0))}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Incident Date</span>
            <input className="input" type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Reason</span>
            <textarea className="input" rows={3} value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submitPenalty}>Submit To Review</button>
        </div>
      </Modal>
    </div>
  );
}
