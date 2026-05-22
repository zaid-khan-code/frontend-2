import React, { useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getStatusColor } from "../services/api";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";
import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../context/AuthContext";

function formatDateOnly(value?: string) {
  if (!value) return "-";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimeOnly(value?: string) {
  if (!value) return "-";
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : String(value);
}

function normalizeStatus(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value === "present") return "Present";
  if (value === "late") return "Late";
  if (value === "absent") return "Absent";
  if (value === "half_day") return "Half Day";
  if (value === "on_leave") return "On Leave";
  return status || "-";
}

export default function MyAttendance() {
  const [regModal, setRegModal] = useState(false);
  const [regDate, setRegDate] = useState("");
  const [regReason, setRegReason] = useState("");
  const [regIn, setRegIn] = useState("");
  const [regOut, setRegOut] = useState("");
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const { data: attendanceRows = [], isLoading } = useAttendance({
    employee_id: user?.employeeId,
  });
  const safeAttendanceRows = Array.isArray(attendanceRows) ? attendanceRows : [];

  const rows = useMemo(() => {
    return [...safeAttendanceRows].sort((a: any, b: any) => {
      const da = new Date(a.date || a.attendance_date || a.created_at || 0).getTime();
      const db = new Date(b.date || b.attendance_date || b.created_at || 0).getTime();
      return db - da;
    });
  }, [safeAttendanceRows]);

  const present = rows.filter((a: any) =>
    ["present", "late"].includes(String(a.status || "").toLowerCase()),
  ).length;
  const absent = rows.filter(
    (a: any) => String(a.status || "").toLowerCase() === "absent",
  ).length;
  const late = rows.filter(
    (a: any) => String(a.status || "").toLowerCase() === "late",
  ).length;
  const ackPending = rows.filter(
    (a: any) =>
      (a.state === "submitted" || a.status) &&
      !(a.ack || a.acknowledged || a.is_acknowledged),
  ).length;

  const submitReg = () => {
    if (!regDate || !regReason) {
      showToast("Please fill all fields", "error");
      return;
    }
    showToast("Attendance correction workflow is coming soon.", "info");
    setRegModal(false);
    setRegDate("");
    setRegReason("");
    setRegIn("");
    setRegOut("");
  };

  const summaryCards = [
    { label: "Present Days", value: present, color: "var(--green)", Icon: CheckCircle2 },
    { label: "Absent Days", value: absent, color: "var(--red)", Icon: XCircle },
    { label: "Late Arrivals", value: late, color: "var(--amber)", Icon: Clock3 },
    { label: "Pending ACK", value: ackPending, color: "var(--p)", Icon: Calendar },
  ];

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">My Attendance</div>
          <div className="pg-sub">Your HR-marked attendance records</div>
        </div>
        <button className="btn btn-secondary" onClick={() => setRegModal(true)}>
          Request Correction
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {summaryCards.map(({ label, value, color, Icon }) => (
          <div key={label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(59,130,246,.08)",
                  color,
                }}
              >
                <Icon size={17} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 23, fontWeight: 850, color }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ch">
          <div className="ct">
            <div className="ct-ico blue">
              <Calendar size={13} />
            </div>
            Attendance Details
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
              <th>ACK</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--t3)" }}>
                  Loading attendance...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((a: any, i: number) => {
                const status = normalizeStatus(a.status);
                const acked = a.ack || a.acknowledged || a.is_acknowledged;
                return (
                  <tr
                    key={a.id || i}
                    style={status === "Late" ? { background: "var(--amberl)" } : {}}
                  >
                    <td className="mono">
                      {formatDateOnly(a.date || a.attendance_date || a.created_at)}
                    </td>
                    <td>{a.day || "-"}</td>
                    <td className="mono">{formatTimeOnly(a.checkIn || a.check_in)}</td>
                    <td className="mono">{formatTimeOnly(a.checkOut || a.check_out)}</td>
                    <td>
                      <span className={`pill ${getStatusColor(status)}`}>{status}</span>
                    </td>
                    <td>
                      <span className={`pill ${acked ? "pill-green" : "pill-amber"}`}>
                        {acked ? "Acknowledged" : "Pending"}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--t3)" }}>
                      {a.notes || a.remarks || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--t3)" }}>
                  No attendance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={regModal}
        onClose={() => setRegModal(false)}
        title="Request Attendance Correction"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRegModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submitReg}>
              Submit Request
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            className="input"
            type="date"
            value={regDate}
            onChange={(e) => setRegDate(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Correct Check-In</label>
            <input
              className="input mono"
              type="time"
              value={regIn}
              onChange={(e) => setRegIn(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Correct Check-Out</label>
            <input
              className="input mono"
              type="time"
              value={regOut}
              onChange={(e) => setRegOut(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <textarea
            className="input"
            rows={3}
            value={regReason}
            onChange={(e) => setRegReason(e.target.value)}
            placeholder="Explain why correction is needed..."
          />
        </div>
      </Modal>
    </div>
  );
}
