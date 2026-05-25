import React, { useMemo, useState } from "react";
import { CalendarDays, WalletCards } from "lucide-react";
import { useLeaveBalances, useLeaves } from "../hooks/useLeaves";

function formatDate(value?: string) {
  if (!value) return "Not provided";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

export default function LeaveWalletHistory() {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances();
  const { data: leaves = [], isLoading: leavesLoading } = useLeaves();

  const normalizedBalances = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    return balances.filter((row: any) => {
      const haystack = `${row.employee_id || ""} ${row.name || ""} ${row.employee_name || ""} ${row.department_name || ""}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [balances, employeeSearch]);

  const totals = normalizedBalances.reduce(
    (acc: any, row: any) => {
      acc.balance += Number(row.balance || 0);
      acc.used += Number(row.used || 0);
      acc.remaining += Number(row.remaining ?? Number(row.balance || 0) - Number(row.used || 0));
      return acc;
    },
    { balance: 0, used: 0, remaining: 0 },
  );

  const grouped = normalizedBalances.reduce((map: Record<string, any[]>, row: any) => {
    const key = row.employee_id || "unknown";
    map[key] = map[key] || [];
    map[key].push(row);
    return map;
  }, {});

  const recentLeaves = leaves.slice(0, 20);

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Leave Wallet</div>
          <div className="pg-sub">Live leave balances and request history from backend leave records.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 18 }}>
        {[
          ["Total Balance", totals.balance],
          ["Used", totals.used],
          ["Remaining", totals.remaining],
          ["Employees", Object.keys(grouped).length],
        ].map(([label, value]) => (
          <div key={String(label)} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t3)", fontSize: 12, fontWeight: 800 }}>
              <WalletCards size={15} /> {label}
            </div>
            <div className="mono" style={{ marginTop: 8, fontSize: 26, fontWeight: 900, color: "var(--t1)" }}>{Number(value).toLocaleString("en-PK")}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <div className="ct">
            <div className="ct-ico green"><WalletCards size={13} /></div>
            Current Balances
          </div>
          <input className="input" style={{ maxWidth: 300 }} placeholder="Search employee, ID, department..." value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
        </div>
        {balancesLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--t3)" }}>Loading leave balances...</div>
        ) : normalizedBalances.length === 0 ? (
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
              {normalizedBalances.map((row: any, index: number) => (
                <tr key={`${row.employee_id}-${row.leave_type_id}-${index}`}>
                  <td>
                    <strong>{row.name || row.employee_name || row.employee_id || "Not provided"}</strong>
                    <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{row.employee_id || "Not provided"}</div>
                  </td>
                  <td>{row.department_name || "Not provided"}</td>
                  <td>{row.leave_type_name || row.name || "Leave"}</td>
                  <td className="mono">{row.year || new Date().getFullYear()}</td>
                  <td className="mono">{Number(row.balance || 0).toLocaleString("en-PK")}</td>
                  <td className="mono">{Number(row.used || 0).toLocaleString("en-PK")}</td>
                  <td className="mono">{Number(row.remaining ?? Number(row.balance || 0) - Number(row.used || 0)).toLocaleString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="ct" style={{ marginBottom: 14 }}>
          <div className="ct-ico blue"><CalendarDays size={13} /></div>
          Recent Leave Requests
        </div>
        {leavesLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--t3)" }}>Loading leave history...</div>
        ) : recentLeaves.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--t3)" }}>No leave requests found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.map((row: any) => {
                const start = row.start_date || row.from;
                const end = row.end_by_force || row.end_date || row.to;
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.employee_name || row.employee?.name || row.employee_id}</strong>
                      <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>{row.employee_id}</div>
                    </td>
                    <td>{row.leave_type || row.leave_type_name || row.leave_type?.name || "Leave"}</td>
                    <td className="mono">{formatDate(start)}</td>
                    <td className="mono">{formatDate(end)}</td>
                    <td className="mono">{daysBetween(start, end)}</td>
                    <td><span className="pill pill-steel">{row.status || "pending"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
