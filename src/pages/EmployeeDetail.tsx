import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";
import { useAttendanceReport } from "../hooks/useAttendance";
import { useEmployee } from "../hooks/useEmployees";
import { useLeaveBalances, useLeaves } from "../hooks/useLeaves";
import { usePenalties } from "../hooks/usePenalties";
import { useRbac } from "../hooks/useRbac";
import { formatPKR, getStatusColor } from "../services/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function text(value: any) {
  const resolved = firstValue(value);
  return resolved === undefined ? "Not provided" : String(resolved);
}

function numberValue(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: any) {
  if (!value) return "Not provided";
  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10) || "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(value: any) {
  return text(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getWindowMonths(offset: 0 | 6) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  });
}

function getInitials(name: string, fallback: string) {
  return (name || fallback || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeEmployee(raw: any) {
  return {
    id: text(firstValue(raw?.employee_id, raw?.id)),
    name: text(firstValue(raw?.personalInfo?.name, raw?.name, raw?.employee_name)),
    fatherName: text(firstValue(raw?.personalInfo?.father_name, raw?.father_name)),
    cnic: text(firstValue(raw?.personalInfo?.cnic, raw?.cnic)),
    dob: firstValue(raw?.personalInfo?.date_of_birth, raw?.date_of_birth),
    gender: text(firstValue(raw?.personalInfo?.gender, raw?.medicalInfo?.gender, raw?.gender)),
    department: text(firstValue(raw?.jobInfo?.department_name, raw?.department_name, raw?.department)),
    designation: text(firstValue(raw?.jobInfo?.designation_name, raw?.designation_title, raw?.designation_name, raw?.designation)),
    employmentType: text(firstValue(raw?.jobInfo?.employment_type_name, raw?.employment_type_name)),
    jobStatus: text(firstValue(raw?.jobInfo?.job_status_name, raw?.job_status_name, raw?.status)),
    workMode: text(firstValue(raw?.jobInfo?.work_mode_name, raw?.work_mode_name)),
    workLocation: text(firstValue(raw?.jobInfo?.work_location_name, raw?.work_location_name)),
    shift: text(firstValue(raw?.jobInfo?.shift_name, raw?.shift_name)),
    dateOfJoining: firstValue(raw?.jobInfo?.date_of_joining, raw?.date_of_joining),
    dateOfExit: firstValue(raw?.jobInfo?.date_of_exit, raw?.date_of_exit),
    email: text(firstValue(raw?.accountInfo?.email, raw?.email, raw?.user?.email)),
    phone: text(firstValue(raw?.accountInfo?.phone, raw?.phone, raw?.emergencyContacts?.contact_1)),
    emergency1: text(raw?.emergencyContacts?.e_contact_1_full_name),
    emergency2: text(raw?.emergencyContacts?.e_contact_2_full_name),
    permanentAddress: text(raw?.emergencyContacts?.perment_address),
    postalAddress: text(raw?.emergencyContacts?.postal_address),
    bankName: text(raw?.bankInfo?.bank_name),
    bankAccount: text(raw?.bankInfo?.account_number),
    bankVerified: Boolean(raw?.bankInfo?.is_verified),
    bloodGroup: text(raw?.medicalInfo?.blood_group),
    allergies: text(raw?.medicalInfo?.allergy_notes),
    chronicConditions: text(raw?.medicalInfo?.chronic_condition_notes),
    medications: text(raw?.medicalInfo?.emergency_medication),
    salary: numberValue(raw?.salaryInfo?.base_salary),
    currency: text(raw?.salaryInfo?.currency || "PKR"),
  };
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 15px",
          borderBottom: "1px solid var(--br2)",
          background: "linear-gradient(90deg, rgba(37,99,235,.08), rgba(255,255,255,.8))",
          fontSize: 12,
          fontWeight: 900,
          color: "var(--t1)",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 9, background: "rgba(37,99,235,.1)", color: "var(--p)" }}>
          {icon}
        </span>
        {title}
      </div>
      <div style={{ padding: 15 }}>{children}</div>
    </div>
  );
}

function FieldGrid({ items }: { items: Array<[string, any]> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ padding: "11px 12px", border: "1px solid var(--br2)", borderRadius: 10, background: "rgba(248,250,252,.72)" }}>
          <div style={{ fontSize: 10, fontWeight: 850, textTransform: "uppercase", color: "var(--t3)", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 750, color: "var(--t1)", overflowWrap: "anywhere" }}>{text(value)}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 26, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
      {children}
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { can } = useRbac();
  const [tab, setTab] = useState("profile");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [windowOffset, setWindowOffset] = useState<0 | 6>(0);
  const [resendModalOpen, setResendModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { data: rawEmployee, isLoading, resendCredentials, isResendingCredentials } = useEmployee(id);
  const employee = useMemo(() => (rawEmployee ? normalizeEmployee(rawEmployee) : null), [rawEmployee]);
  const employeeId = employee?.id || id || "";

  const months = useMemo(() => getWindowMonths(windowOffset), [windowOffset]);
  const latestMonth = months[months.length - 1];
  const { data: reportRows = [], isLoading: attendanceLoading } = useAttendanceReport(
    employeeId && latestMonth
      ? { employee_id: employeeId, year: latestMonth.year, month: latestMonth.month }
      : undefined,
  );
  const { data: leaveRows = [], isLoading: leavesLoading } = useLeaves(employeeId ? { employee_id: employeeId } : undefined);
  const { data: leaveBalances = [], isLoading: balancesLoading } = useLeaveBalances(employeeId ? { employee_id: employeeId, year: new Date().getFullYear() } : undefined);
  const { data: penaltyRows = [], isLoading: penaltiesLoading, isError: penaltiesError } = usePenalties(employeeId ? { employee_id: employeeId } : undefined);

  const attendanceChart = months.map((month) => {
    const row = reportRows.find((item: any) => {
      const rowDate = item.month || item.date || item.attendance_month;
      return rowDate ? String(rowDate).startsWith(month.key) : true;
    }) || reportRows[0] || {};
    return {
      month: month.label,
      present: numberValue(row.presents ?? row.present),
      absent: numberValue(row.absents ?? row.absent),
      late: numberValue(row.lates ?? row.late),
    };
  });

  const attendanceTotals = attendanceChart.reduce(
    (acc, row) => ({
      present: acc.present + row.present,
      absent: acc.absent + row.absent,
      late: acc.late + row.late,
    }),
    { present: 0, absent: 0, late: 0 },
  );

  const handleResendCredentials = async () => {
    if (!employeeId) return;
    try {
      const result = await resendCredentials(employeeId);
      setTempPassword(result?.tempPassword ?? result?.temp_password ?? result?.password ?? null);
      setResendModalOpen(true);
      showToast("Credentials resent successfully");
    } catch {
      showToast("Failed to resend credentials", "error");
    }
  };

  if (isLoading) {
    return <div style={{ padding: 50, textAlign: "center" }}>Loading employee profile...</div>;
  }

  if (!employee) {
    return (
      <div style={{ padding: 50, textAlign: "center", color: "var(--t3)" }}>
        <h2>Employee not found or access denied</h2>
        <button className="btn btn-primary" onClick={() => navigate("/employees")}>Back to Employees</button>
      </div>
    );
  }

  const tabs = ["Profile", "Attendance", "Leave", "Penalties", "Settings"];
  const initials = getInitials(employee.name, employee.id);
  const quickActions = [
    { label: "Open attendance sheet", action: () => navigate("/attendance") },
    { label: "Open leave management", action: () => navigate("/leave") },
    { label: "Open payroll", action: () => navigate("/payroll") },
    ...(can("resend_credentials") ? [{ label: "Resend credentials", action: handleResendCredentials }] : []),
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        className="card"
        style={{
          padding: 18,
          borderRadius: 16,
          overflow: "visible",
          background: "linear-gradient(135deg, rgba(37,99,235,.12), rgba(13,148,136,.09) 48%, rgba(168,85,247,.12))",
          border: "1px solid rgba(147,197,253,.55)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, var(--p), var(--teal))", color: "white", fontSize: 18, fontWeight: 950 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.1, color: "var(--t1)" }}>{employee.name}</h1>
              <span className="mono" style={{ fontSize: 12, color: "var(--t3)" }}>{employee.id}</span>
              <span className={`pill ${getStatusColor(employee.jobStatus)}`}>{employee.jobStatus}</span>
            </div>
            <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "var(--t2)", fontSize: 13 }}>
              <span>{employee.designation}</span>
              <span>in</span>
              <strong>{employee.department}</strong>
              <span style={{ color: "var(--t3)" }}>|</span>
              <MapPin size={13} />
              <span>{employee.workLocation}</span>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 20 }}>
            <button className="btn btn-secondary" onClick={() => setActionsOpen((open) => !open)}>
              Quick Actions <ChevronDown size={12} />
            </button>
            {actionsOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 220, background: "#fff", border: "1px solid var(--br)", borderRadius: 12, boxShadow: "var(--sh2)", zIndex: 2000, padding: 6 }}>
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActionsOpen(false);
                      item.action();
                    }}
                    style={{ display: "block", width: "100%", border: "none", background: "transparent", textAlign: "left", padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "var(--t2)" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ overflowX: "auto" }}>
        {tabs.map((item) => {
          const key = item.toLowerCase();
          return (
            <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {item}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <div style={{ display: "grid", gap: 12 }}>
          <InfoCard title="Personal & Contact" icon={<UserRound size={15} />}>
            <FieldGrid
              items={[
                ["Full Name", employee.name],
                ["Email", employee.email],
                ["Phone", employee.phone],
                ["Father Name", employee.fatherName],
                ["Date of Birth", formatDate(employee.dob)],
                ["CNIC", employee.cnic],
                ["Gender", employee.gender],
                ["Emergency Contact 1", employee.emergency1],
                ["Emergency Contact 2", employee.emergency2],
                ["Permanent Address", employee.permanentAddress],
                ["Postal Address", employee.postalAddress],
              ]}
            />
          </InfoCard>
          <InfoCard title="Job Information" icon={<ShieldCheck size={15} />}>
            <FieldGrid
              items={[
                ["Department", employee.department],
                ["Designation", employee.designation],
                ["Employment Type", employee.employmentType],
                ["Job Status", employee.jobStatus],
                ["Work Mode", employee.workMode],
                ["Work Location", employee.workLocation],
                ["Shift", employee.shift],
                ["Date of Joining", formatDate(employee.dateOfJoining)],
                ["Date of Exit", formatDate(employee.dateOfExit)],
              ]}
            />
          </InfoCard>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            <InfoCard title="Salary & Bank" icon={<Banknote size={15} />}>
              <FieldGrid
                items={[
                  ["Base Salary", employee.currency === "PKR" ? formatPKR(employee.salary) : `${employee.salary.toLocaleString("en-PK")} ${employee.currency}`],
                  ["Bank Name", employee.bankName],
                  ["Bank Account", employee.bankAccount],
                  ["Verification", employee.bankVerified ? "Verified" : "Not provided"],
                ]}
              />
            </InfoCard>
            <InfoCard title="Medical" icon={<HeartPulse size={15} />}>
              <FieldGrid
                items={[
                  ["Blood Group", employee.bloodGroup],
                  ["Allergies", employee.allergies],
                  ["Chronic Conditions", employee.chronicConditions],
                  ["Medication", employee.medications],
                ]}
              />
            </InfoCard>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <InfoCard title={windowOffset === 0 ? "Attendance (Last 6 Months)" : "Attendance (Previous 6 Months)"} icon={<Clock3 size={15} />}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill pill-green">Present: {attendanceTotals.present}</span>
              <span className="pill pill-red">Absent: {attendanceTotals.absent}</span>
              <span className="pill pill-amber">Late: {attendanceTotals.late}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`btn btn-sm ${windowOffset === 0 ? "btn-primary" : "btn-ghost"}`} onClick={() => setWindowOffset(0)}>Last 6 months</button>
              <button className={`btn btn-sm ${windowOffset === 6 ? "btn-primary" : "btn-ghost"}`} onClick={() => setWindowOffset(6)}>Previous 6 months</button>
            </div>
          </div>
          {attendanceLoading ? (
            <EmptyState>Loading attendance...</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7590a8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#7590a8" }} />
                <Tooltip />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </InfoCard>
      )}

      {tab === "leave" && (
        <div style={{ display: "grid", gap: 12 }}>
          <InfoCard title="Leave Balances" icon={<CalendarDays size={15} />}>
            {balancesLoading ? (
              <EmptyState>Loading leave balances...</EmptyState>
            ) : leaveBalances.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                {leaveBalances.map((balance: any, index: number) => {
                  const total = numberValue(balance.balance);
                  const used = numberValue(balance.used);
                  const remaining = numberValue(balance.remaining ?? total - used);
                  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                  return (
                    <div key={balance.leave_type_id || balance.id || index} style={{ padding: 13, border: "1px solid var(--br2)", borderRadius: 12, background: "linear-gradient(135deg, rgba(236,253,245,.82), rgba(255,255,255,.9))" }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--t1)", marginBottom: 6 }}>{text(balance.name || balance.leave_type || balance.type)}</div>
                      <div className="mono" style={{ fontSize: 18, fontWeight: 950, color: "var(--green)" }}>{remaining} remaining</div>
                      <div style={{ marginTop: 10, height: 7, borderRadius: 999, background: "rgba(15,23,42,.08)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--green)" }} />
                      </div>
                      <div style={{ marginTop: 7, fontSize: 11, color: "var(--t3)" }}>{used} used of {total}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState>No leave balances are assigned for this employee.</EmptyState>
            )}
          </InfoCard>
          <InfoCard title="Leave Requests" icon={<FileText size={15} />}>
            {leavesLoading ? (
              <EmptyState>Loading leave requests...</EmptyState>
            ) : leaveRows.length ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRows.map((leave: any, index: number) => (
                      <tr key={leave.id || index}>
                        <td>{text(leave.leave_type?.name || leave.leave_type_name || leave.leave_type || leave.type)}</td>
                        <td className="mono">{formatDate(leave.from || leave.start_date || leave.date_from)}</td>
                        <td className="mono">{formatDate(leave.to || leave.end_date || leave.date_to)}</td>
                        <td className="mono">{text(leave.days || leave.total_days || leave.duration)}</td>
                        <td>{text(leave.reason || leave.notes)}</td>
                        <td><span className={`pill ${getStatusColor(leave.status)}`}>{formatStatus(leave.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No leave requests found.</EmptyState>
            )}
          </InfoCard>
        </div>
      )}

      {tab === "penalties" && (
        <InfoCard title="Penalty Ledger" icon={<BadgeDollarSign size={15} />}>
          {penaltiesError && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 14, border: "1px dashed rgba(245,158,11,.45)", borderRadius: 12, background: "rgba(255,251,235,.7)", color: "#92400e", marginBottom: 12 }}>
              <AlertTriangle size={16} /> Penalty data is not available for your current permissions.
            </div>
          )}
          {penaltiesLoading ? (
            <EmptyState>Loading penalties...</EmptyState>
          ) : penaltyRows.length ? (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rule</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Ack</th>
                  </tr>
                </thead>
                <tbody>
                  {penaltyRows.map((penalty: any, index: number) => (
                    <tr key={penalty.id || index}>
                      <td className="mono">{formatDate(penalty.date)}</td>
                      <td>{text(penalty.rule_name || penalty.name || penalty.type)}</td>
                      <td className="mono">{formatPKR(numberValue(penalty.amount_pkr || penalty.applied_amount_pkr || penalty.amount))}</td>
                      <td>{text(penalty.reason || penalty.review_note)}</td>
                      <td><span className={`pill ${getStatusColor(penalty.status)}`}>{formatStatus(penalty.status)}</span></td>
                      <td>{penalty.employee_ack ? "Acknowledged" : "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No penalties recorded.</EmptyState>
          )}
        </InfoCard>
      )}

      {tab === "settings" && (
        <InfoCard title="Account Settings" icon={<Mail size={15} />}>
          {can("resend_credentials") ? (
            <button className="btn btn-primary" onClick={handleResendCredentials} disabled={isResendingCredentials}>
              {isResendingCredentials ? "Sending..." : "Resend Credentials"}
            </button>
          ) : (
            <p style={{ fontSize: 12, color: "var(--t3)", margin: 0 }}>You do not have permission to resend credentials.</p>
          )}
        </InfoCard>
      )}

      <Modal
        open={resendModalOpen}
        onClose={() => {
          setResendModalOpen(false);
          setTempPassword(null);
        }}
        title="Temporary Password"
      >
        <p style={{ fontSize: 13, marginBottom: 12 }}>Share this password with the employee securely. It will not be sent automatically.</p>
        <div className="mono" style={{ padding: 12, background: "var(--hover)", borderRadius: 8, fontWeight: 800 }}>
          {tempPassword || "Not provided"}
        </div>
      </Modal>
    </div>
  );
}
