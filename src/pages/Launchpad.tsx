import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, LayoutGrid, Megaphone, ShieldCheck, Users, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type ModuleCard = {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: string[];
  disabled?: boolean;
};

const modules: ModuleCard[] = [
  {
    title: "HR Dashboard",
    description: "Branch-wise people analytics and lock controls",
    to: "/hr/branch-dashboard",
    icon: LayoutGrid,
    roles: ["super_admin", "hr"],
  },
  {
    title: "Attendance",
    description: "Live attendance feed and status management",
    to: "/attendance",
    icon: CalendarCheck,
    roles: ["super_admin", "hr"],
  },
  {
    title: "Employees",
    description: "Employee records, onboarding and contracts",
    to: "/employees",
    icon: Users,
    roles: ["super_admin", "hr"],
  },
  {
    title: "Payroll",
    description: "Payroll module placeholder and payslip readiness notes",
    to: "/payroll",
    icon: Wallet,
    roles: ["super_admin", "head_hr", "hr_manager"],
    disabled: true,
  },
  {
    title: "Announcements",
    description: "Broadcast updates to branch and departments",
    to: "/announcements",
    icon: Megaphone,
    roles: ["super_admin", "head_hr", "branch_hr", "department_hr", "hr_manager", "hr_executive", "employee"],
  },
  {
    title: "Penalty Workflow",
    description: "Branch to HO approvals and decisions",
    to: "/penalty-workflow",
    icon: ShieldCheck,
    roles: ["super_admin", "head_hr", "hr_manager"],
  },
];

const hrRoles = new Set(["hr", "head_hr", "branch_hr", "department_hr", "hr_manager", "hr_executive"]);

function roleMatches(module: ModuleCard, role: string) {
  if (module.roles.includes(role)) return true;
  return module.roles.includes("hr") && hrRoles.has(role);
}

export default function Launchpad() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const visibleModules = modules.filter((module) => roleMatches(module, activeRole));

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Launchpad</div>
          <div className="pg-sub">Open modules by role with quick context.</div>
        </div>
        <span className="live-badge">
          <span className="live-dot" />
          Active Session
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {visibleModules.map((module) => (
          <button
            key={module.title}
            className="card"
            onClick={() => {
              if (!module.disabled) navigate(module.to);
            }}
            style={{ textAlign: "left", cursor: module.disabled ? "not-allowed" : "pointer", opacity: module.disabled ? 0.62 : 1 }}
            disabled={module.disabled}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="ct-ico blue">
                <module.icon size={16} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)" }}>{module.title}</div>
            </div>
            <p style={{ color: "var(--t3)", fontSize: 12 }}>{module.description}</p>
            {module.disabled && <span className="pill pill-steel">Coming Soon</span>}
          </button>
        ))}
      </div>

      {activeRole !== "employee" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="ct" style={{ marginBottom: 8 }}>
            <div className="ct-ico teal">
              <ShieldCheck size={16} />
            </div>
            Quick Controls
          </div>
          <p style={{ color: "var(--t3)", fontSize: 12, marginBottom: 12 }}>
            Jump directly to branch lock controls for attendance sheets.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/hr/branch-dashboard")}>
            Open Branch Lock Center
          </button>
        </div>
      )}
    </div>
  );
}
