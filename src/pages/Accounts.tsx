import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, Save, ShieldCheck, ShieldOff, Users, UserCheck, UserX } from "lucide-react";
import { useCredentialTemplate, useAccounts, useUpdateAccountStatus, useUpdateCredentialTemplate } from "../hooks/useAccounts";
import { useToastContext } from "../context/ToastContext";

const CSS = `
  .acc-page{font-family:'Segoe UI',system-ui,sans-serif;padding:24px 30px;background:#f0f2f8;min-height:100vh;}
  .acc-card{background:#fff;border-radius:12px;box-shadow:0 1px 12px rgba(30,27,75,.07);}
  .acc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
  @media(max-width:900px){.acc-stats{grid-template-columns:repeat(2,1fr);}.acc-tools{grid-template-columns:1fr!important;}}
  .acc-stat{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;}
  .acc-stat-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .acc-stat-lbl{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;}
  .acc-stat-val{font-size:20px;font-weight:800;font-family:monospace;}
  .acc-stat-sub{font-size:10px;color:#9ca3af;margin-top:1px;}
  .acc-table{width:100%;border-collapse:collapse;}
  .acc-table th{text-align:left;padding:10px 14px;font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #f1f5f9;}
  .acc-table td{padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;}
  .acc-table tbody tr:hover td{background:#f8faff;}
  .acc-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
  .acc-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;white-space:nowrap;}
  .acc-pill-active{background:#d1fae5;color:#065f46;}
  .acc-pill-inactive{background:#fee2e2;color:#991b1b;}
  .acc-pill-role{background:#ede9fe;color:#3730a3;}
  .acc-pill-super{background:#fef3c7;color:#92400e;border:1px solid #fde68a;}
  .acc-btn{height:30px;border:none;border-radius:8px;padding:0 11px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit;}
  .acc-btn:disabled{opacity:.45;cursor:not-allowed;}
  .acc-btn-act{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;}
  .acc-btn-deact{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;}
  .acc-btn-primary{height:36px;background:#4f46e5;color:#fff;}
  .acc-textarea{width:100%;min-height:180px;border:1px solid #dbe2ef;border-radius:10px;padding:12px;font:12px/1.5 'Segoe UI',system-ui,sans-serif;resize:vertical;outline:none;}
  .acc-help{font-size:11px;color:#64748b;margin-top:8px;line-height:1.5;}
`;

function initials(value: string) {
  return String(value || "?")
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(value: string) {
  return String(value || "Not provided").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: any) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function Accounts() {
  const { showToast } = useToastContext();
  const { data: accounts = [], isLoading, isError } = useAccounts();
  const updateStatus = useUpdateAccountStatus();
  const { data: templateData } = useCredentialTemplate();
  const updateTemplate = useUpdateCredentialTemplate();
  const [template, setTemplate] = useState("");

  useEffect(() => {
    setTemplate(templateData?.template || "");
  }, [templateData?.template]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((account: any) => account.is_active !== false).length;
    const inactive = accounts.filter((account: any) => account.is_active === false).length;
    const linked = accounts.filter((account: any) => Boolean(account.employee_id)).length;
    return { total, active, inactive, linked };
  }, [accounts]);

  const toggleStatus = async (account: any) => {
    try {
      await updateStatus.mutateAsync({
        accountId: account.id,
        isActive: account.is_active === false,
      });
      showToast("Account status updated");
    } catch (error: any) {
      showToast(error?.response?.data?.error?.message || "Failed to update account", "error");
    }
  };

  const saveTemplate = async () => {
    try {
      await updateTemplate.mutateAsync(template);
      showToast("WhatsApp credential message updated");
    } catch (error: any) {
      showToast(error?.response?.data?.error?.message || "Failed to update message template", "error");
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="acc-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1e1b4b" }}>Accounts</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Real system user accounts from the backend.</p>
          </div>
        </div>

        <div className="acc-stats">
          {[
            { icon: <Users size={18} />, bg: "#ede9fe", color: "#3730a3", label: "Total Accounts", value: stats.total, sub: "All system users" },
            { icon: <UserCheck size={18} />, bg: "#d1fae5", color: "#065f46", label: "Active", value: stats.active, sub: "Can sign in" },
            { icon: <UserX size={18} />, bg: "#fee2e2", color: "#991b1b", label: "Inactive", value: stats.inactive, sub: "Blocked from sign in" },
            { icon: <KeyRound size={18} />, bg: "#dbeafe", color: "#1e40af", label: "Employee Linked", value: stats.linked, sub: "Mapped to employee" },
          ].map((stat) => (
            <div className="acc-stat" key={stat.label}>
              <div className="acc-stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
              <div>
                <div className="acc-stat-lbl">{stat.label}</div>
                <div className="acc-stat-val" style={{ color: stat.color }}>{stat.value}</div>
                <div className="acc-stat-sub">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="acc-tools" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(320px,.8fr)", gap: 14 }}>
          <div className="acc-card" style={{ overflowX: "auto" }}>
            <table className="acc-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Linked Employee</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>Loading accounts...</td></tr>
                ) : isError ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#991b1b" }}>Unable to load accounts.</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>No accounts found.</td></tr>
                ) : accounts.map((account: any) => {
                  const isSuper = account.role_name === "super_admin";
                  return (
                    <tr key={account.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="acc-avatar" style={isSuper ? { background: "linear-gradient(135deg,#f97316,#eab308)" } : undefined}>
                            {initials(account.employee_name || account.email)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#1e1b4b" }}>{account.email}</div>
                            <div style={{ fontSize: 10, color: "#64748b" }}>{account.employee_name || "Account-only user"}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`acc-pill ${isSuper ? "acc-pill-super" : "acc-pill-role"}`}>{formatRole(account.role_name)}</span></td>
                      <td>{account.linked_employee || (account.employee_id ? `${account.employee_id}` : "Account only")}</td>
                      <td>
                        <span className={`acc-pill ${account.is_active === false ? "acc-pill-inactive" : "acc-pill-active"}`}>
                          {account.is_active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>{formatDate(account.created_at)}</td>
                      <td>
                        {isSuper ? (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>Protected</span>
                        ) : (
                          <button
                            className={`acc-btn ${account.is_active === false ? "acc-btn-act" : "acc-btn-deact"}`}
                            disabled={updateStatus.isPending}
                            onClick={() => toggleStatus(account)}
                          >
                            {account.is_active === false ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                            {account.is_active === false ? "Activate" : "Deactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="acc-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <KeyRound size={16} color="#4f46e5" />
              <h2 style={{ margin: 0, fontSize: 15, color: "#1e1b4b" }}>WhatsApp Credential Message</h2>
            </div>
            <textarea className="acc-textarea" value={template} onChange={(event) => setTemplate(event.target.value)} />
            <div className="acc-help">
              Use placeholders: {"{employeeName}"}, {"{employeeId}"}, {"{email}"}, {"{password}"}, {"{loginUrl}"}. The backend requires {"{email}"} and {"{password}"} so credentials are not accidentally omitted.
            </div>
            <button className="acc-btn acc-btn-primary" style={{ marginTop: 12 }} disabled={updateTemplate.isPending} onClick={saveTemplate}>
              <Save size={13} /> Save Message
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
