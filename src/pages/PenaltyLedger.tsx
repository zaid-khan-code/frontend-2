import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { usePenalties } from "../hooks/usePenalties";
import { formatPKR } from "../services/api";

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
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (employeeFilter.trim()) params.employee_id = employeeFilter.trim();
    return Object.keys(params).length ? params : undefined;
  }, [employeeFilter, statusFilter]);

  const { data: serverPenalties = [], isLoading, isError } = usePenalties(queryParams);

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

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Ledger</div>
          <div className="pg-sub">Track proposed, approved, rejected, and acknowledged penalties from the backend.</div>
        </div>
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
                <th>ID</th><th>Employee</th><th>Date</th><th>Rule</th><th>Reason</th><th>Amount</th><th>Status</th><th>ACK</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.id}</td>
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
    </div>
  );
}
