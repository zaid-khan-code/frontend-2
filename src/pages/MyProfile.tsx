import React from "react";
import { useAuth } from "../context/AuthContext";
import { useEmployee } from "../hooks/useEmployees";
import { useEmployeeSelfMetrics } from "../hooks/useDashboard";
import { Loader2 } from "lucide-react";

function getSelfProfile(payload: any) {
  if (!payload || typeof payload !== "object") return payload;
  return payload.employee || payload.profile || payload.user || payload.data || payload;
}

function getEmployeeIdFromPayload(payload: any) {
  const node = getSelfProfile(payload);
  return (
    node?.employee_id ||
    node?.employeeId ||
    node?.emp_id ||
    node?.id ||
    payload?.employee_id ||
    payload?.employeeId ||
    payload?.emp_id ||
    payload?.id
  );
}

function isEmployeeProfile(payload: any) {
  if (!payload || typeof payload !== "object") return false;
  return !!(
    payload.name ||
    payload.father_name ||
    payload.salaryInfo ||
    payload.emergencyContacts ||
    payload.bankInfo ||
    payload.medicalInfo ||
    payload.department_name ||
    payload.designation_title
  );
}

const rootFields = [
  "id",
  "employee_id",
  "name",
  "father_name",
  "cnic",
  "date_of_birth",
  "created_at",
  "updated_at",
];

const jobFields = [
  "department_id",
  "designation_id",
  "employment_type_id",
  "job_status_id",
  "work_mode_id",
  "work_location_id",
  "shift_id",
  "date_of_joining",
  "date_of_exit",
  "probation_end_date",
  "contract_end_date",
  "department_name",
  "department_code",
  "designation_title",
  "employment_type_name",
  "job_status_name",
  "work_mode_name",
  "work_location_name",
  "shift_name",
  "shift_start_time",
  "shift_end_time",
  "late_after_minutes",
];

const salaryFields = [
  "base_salary",
  "currency",
  "effective_from",
  "revision_type",
  "revision_percent",
  "revision_reason",
];

const allowanceFields = [
  "id",
  "employee_id",
  "allowance_type_id",
  "amount",
  "is_percentage",
  "is_current",
  "is_active",
  "created_by",
  "created_at",
  "updated_at",
  "field_name",
];

const emergencyFields = [
  "contact_1",
  "contact_2",
  "perment_address",
  "postal_address",
  "e_contact_1_relation",
  "e_contact_1_full_name",
  "e_contact_1_phone",
  "e_contact_1_phone_country_code",
  "e_contact_1_email",
  "e_contact_2_relation",
  "e_contact_2_full_name",
  "e_contact_2_phone",
  "e_contact_2_phone_country_code",
  "e_contact_2_email",
  "primary_contact",
];

const bankFields = [
  "bank_name",
  "branch_name",
  "branch_code",
  "iban",
  "account_title",
  "account_number",
  "account_type",
  "is_verified",
];

const medicalFields = [
  "blood_group",
  "date_of_birth",
  "gender",
  "height_cm",
  "weight_kg",
  "has_disability",
  "disability_type",
  "disability_description",
  "has_chronic_condition",
  "chronic_condition_notes",
  "has_known_allergies",
  "allergy_notes",
  "emergency_medication",
  "fitness_status",
  "last_medical_exam_date",
  "next_medical_exam_date",
];

function formatValue(value: any) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function labelFromKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueTone(value: any) {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return "value";
}

function FieldGrid({ source, fields }: { source: any; fields: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}
    >
      {fields.map((field) => {
        const raw = source?.[field];
        const tone = valueTone(raw);
        const value = formatValue(raw);
        return (
          <div
            key={field}
            style={{
              minHeight: 66,
              padding: "10px 12px",
              borderRadius: 8,
              background:
                tone === "empty"
                  ? "rgba(148,163,184,.08)"
                  : "rgba(255,255,255,.68)",
              border: "1px solid var(--br2)",
              boxShadow: "0 8px 20px rgba(15,23,42,.035)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--t3)",
                marginBottom: 7,
                textTransform: "uppercase",
              }}
            >
              {labelFromKey(field)}
            </div>
            <div
              className="mono"
              style={{
                display:
                  tone === "empty" || tone === "yes" || tone === "no"
                    ? "inline-flex"
                    : "block",
                alignItems: "center",
                minHeight: 18,
                padding:
                  tone === "empty" || tone === "yes" || tone === "no"
                    ? "3px 7px"
                    : 0,
                borderRadius: 999,
                background:
                  tone === "empty"
                    ? "rgba(100,116,139,.12)"
                    : tone === "yes"
                      ? "rgba(16,185,129,.12)"
                      : tone === "no"
                        ? "rgba(239,68,68,.1)"
                        : "transparent",
                color:
                  tone === "empty"
                    ? "var(--t3)"
                    : tone === "yes"
                      ? "var(--green)"
                      : tone === "no"
                        ? "var(--red)"
                        : "var(--t1)",
                fontSize: 12,
                fontWeight: tone === "value" ? 650 : 800,
                overflowWrap: "anywhere",
                lineHeight: 1.35,
              }}
            >
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        marginBottom: 12,
        padding: 0,
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px",
          borderBottom: "1px solid var(--br2)",
          background:
            "linear-gradient(90deg, rgba(59,130,246,.08), rgba(20,184,166,.06), rgba(236,72,153,.07))",
        }}
      >
        <div
          style={{
          fontSize: 12,
          fontWeight: 800,
            color: "var(--t1)",
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          padding: 14,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ProfileHero({ employee }: { employee: any }) {
  const initials = String(employee.name || employee.employee_id || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const meta = [
    ["Employee ID", employee.employee_id],
    ["Department", employee.department_name],
    ["Designation", employee.designation_title],
    ["Status", employee.job_status_name],
  ];

  return (
    <div
      className="card"
      style={{
        marginBottom: 12,
        padding: 18,
        borderRadius: 8,
        background:
          "linear-gradient(135deg, rgba(239,246,255,.96), rgba(240,253,250,.9) 48%, rgba(253,242,248,.88))",
        border: "1px solid rgba(147,197,253,.55)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, var(--p), var(--teal))",
            color: "white",
            fontWeight: 900,
            fontSize: 16,
            boxShadow: "0 14px 28px rgba(37,99,235,.2)",
          }}
        >
          {initials || "?"}
        </div>
        <div style={{ minWidth: 240, flex: 1 }}>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "var(--t1)",
              marginBottom: 5,
            }}
          >
            {formatValue(employee.name)}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {meta.map(([label, value]) => (
              <span
                key={label}
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 9px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.72)",
                  border: "1px solid var(--br2)",
                  color: "var(--t2)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "var(--t3)", fontWeight: 800 }}>
                  {label}
                </span>
                {formatValue(value)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyProfile() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const {
    data: selfMetrics,
    isLoading: isSelfLoading,
    isError: isSelfError,
  } = useEmployeeSelfMetrics();
  const selfProfile = getSelfProfile(selfMetrics);
  const resolvedEmployeeId = employeeId || getEmployeeIdFromPayload(selfMetrics);
  const {
    data: employeeById,
    isLoading: isEmployeeLoading,
    isError: isEmployeeError,
  } = useEmployee(resolvedEmployeeId);
  const emp = employeeById || (isEmployeeProfile(selfProfile) ? selfProfile : null);

  const isLoading =
    !emp && (isSelfLoading || (!!resolvedEmployeeId && isEmployeeLoading));
  const isError =
    !emp && (isSelfError || (!!resolvedEmployeeId && isEmployeeError));

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Loader2 className="spinner" size={24} />
      </div>
    );
  }

  if (isError || !emp) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        Error loading profile.
      </div>
    );
  }

  const allowances = Array.isArray(emp.allowances) ? emp.allowances : [];

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">My Profile</div>
          <div className="pg-sub">Employee record from the backend profile payload</div>
        </div>
      </div>

      <ProfileHero employee={emp} />

      <DataSection title="employee">
        <FieldGrid source={emp} fields={rootFields} />
      </DataSection>

      <DataSection title="job">
        <FieldGrid source={emp} fields={jobFields} />
      </DataSection>

      <DataSection title="salaryInfo">
        <FieldGrid source={emp.salaryInfo} fields={salaryFields} />
      </DataSection>

      <DataSection title="allowances">
        {allowances.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {allowances.map((allowance: any, index: number) => (
              <div
                key={allowance?.id || index}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "rgba(248,250,252,.72)",
                  border: "1px solid var(--br2)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 850,
                    color: "var(--t1)",
                    marginBottom: 10,
                  }}
                >
                  {formatValue(allowance?.field_name)}
                </div>
                <FieldGrid source={allowance} fields={allowanceFields} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="mono"
            style={{
              display: "inline-flex",
              padding: "5px 8px",
              borderRadius: 999,
              background: "rgba(100,116,139,.12)",
              color: "var(--t3)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            []
          </div>
        )}
      </DataSection>

      <DataSection title="emergencyContacts">
        <FieldGrid source={emp.emergencyContacts} fields={emergencyFields} />
      </DataSection>

      <DataSection title="bankInfo">
        <FieldGrid source={emp.bankInfo} fields={bankFields} />
      </DataSection>

      <DataSection title="medicalInfo">
        <FieldGrid source={emp.medicalInfo} fields={medicalFields} />
      </DataSection>
    </div>
  );
}
