import React from "react";
import { useAuth } from "../context/AuthContext";
import { useEmployee } from "../hooks/useEmployees";
import { useEmployeeSelfMetrics } from "../hooks/useDashboard";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  HeartPulse,
  Landmark,
  Loader2,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";

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
  "employee_id",
  "name",
  "father_name",
  "cnic",
  "date_of_birth",
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
  "department_code",
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
  "allowance_type_id",
  "amount",
];

const emergencyFields = [
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

const readableFieldMap: Record<string, { label: string; sourceKey: string }> = {
  department_id: { label: "Department", sourceKey: "department_name" },
  designation_id: { label: "Designation", sourceKey: "designation_title" },
  employment_type_id: { label: "Employment Type", sourceKey: "employment_type_name" },
  job_status_id: { label: "Job Status", sourceKey: "job_status_name" },
  work_mode_id: { label: "Work Mode", sourceKey: "work_mode_name" },
  work_location_id: { label: "Work Location", sourceKey: "work_location_name" },
  shift_id: { label: "Shift", sourceKey: "shift_name" },
  allowance_type_id: { label: "Allowance Type", sourceKey: "field_name" },
};

function isDateField(field: string) {
  return (
    field.endsWith("_at") ||
    field.endsWith("_date") ||
    field === "date_of_birth" ||
    field === "date_of_joining" ||
    field === "date_of_exit" ||
    field === "effective_from"
  );
}

function formatDateOnly(value: any) {
  if (!value) return "null";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split("T")[0] || String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatValue(value: any, field?: string) {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field && isDateField(field)) return formatDateOnly(value);
  return String(value);
}

function formatAllowanceAmount(allowance: any) {
  const amount = Number(allowance?.amount ?? 0);
  if (allowance?.is_percentage) {
    return `${Number.isFinite(amount) ? amount.toLocaleString("en-PK") : allowance?.amount}%`;
  }
  return `${Number.isFinite(amount) ? amount.toLocaleString("en-PK") : allowance?.amount} PKR`;
}

function labelFromKey(key: string) {
  if (readableFieldMap[key]) return readableFieldMap[key].label;
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueTone(value: any) {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return "value";
}

function isQuietField(field: string) {
  return (
    field === "id" ||
    field.endsWith("_id") ||
    field === "created_by" ||
    field.endsWith("_at") ||
    field.endsWith("_date") ||
    field === "date_of_joining" ||
    field === "date_of_exit" ||
    field === "effective_from"
  );
}

function FieldGrid({
  source,
  fields,
  accent = "var(--p)",
}: {
  source: any;
  fields: string[];
  accent?: string;
}) {
  const visibleFields = fields.filter((field) => {
    const readable = readableFieldMap[field];
    const raw = readable ? source?.[readable.sourceKey] : source?.[field];
    return raw !== null && raw !== undefined && raw !== "";
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}
    >
      {visibleFields.map((field) => {
        const readable = readableFieldMap[field];
        const raw = readable ? source?.[readable.sourceKey] : source?.[field];
        const tone = valueTone(raw);
        const value = formatValue(raw, field);
        const quiet = isQuietField(field) && !readable;
        return (
          <div
            key={field}
            style={{
              minHeight: quiet ? 58 : 72,
              padding: quiet ? "9px 10px" : "12px 13px",
              borderRadius: 8,
              background:
                tone === "empty"
                  ? "rgba(148,163,184,.08)"
                  : quiet
                    ? "rgba(248,250,252,.72)"
                    : "linear-gradient(180deg, rgba(255,255,255,.92), rgba(248,250,252,.72))",
              border: quiet
                ? "1px dashed rgba(148,163,184,.32)"
                : "1px solid var(--br2)",
              boxShadow: quiet ? "none" : "0 10px 24px rgba(15,23,42,.045)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: quiet ? "rgba(71,85,105,.62)" : accent,
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
                    : quiet
                      ? "inline"
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
                        : quiet
                          ? "rgba(51,65,85,.72)"
                          : "var(--t1)",
                fontSize: quiet ? 11 : 13,
                fontFamily: quiet ? "'IBM Plex Mono', monospace" : "inherit",
                fontWeight: tone === "value" ? (quiet ? 600 : 750) : 800,
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

const sectionMeta: Record<
  string,
  {
    label: string;
    accent: string;
    tint: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  }
> = {
  employee: {
    label: "Employee",
    accent: "var(--p)",
    tint: "rgba(37,99,235,.1)",
    Icon: UserRound,
  },
  job: {
    label: "Job",
    accent: "var(--teal)",
    tint: "rgba(13,148,136,.1)",
    Icon: BriefcaseBusiness,
  },
  salaryInfo: {
    label: "Salary Info",
    accent: "var(--green)",
    tint: "rgba(15,118,110,.1)",
    Icon: BadgeDollarSign,
  },
  allowances: {
    label: "Allowances",
    accent: "#b45309",
    tint: "rgba(245,158,11,.14)",
    Icon: WalletCards,
  },
  emergencyContacts: {
    label: "Emergency Contacts",
    accent: "#db2777",
    tint: "rgba(236,72,153,.12)",
    Icon: Phone,
  },
  bankInfo: {
    label: "Bank Info",
    accent: "#7c3aed",
    tint: "rgba(124,58,237,.11)",
    Icon: Landmark,
  },
  medicalInfo: {
    label: "Medical Info",
    accent: "#0891b2",
    tint: "rgba(8,145,178,.11)",
    Icon: HeartPulse,
  },
};

function DataSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const meta = sectionMeta[title] || sectionMeta.employee;
  const Icon = meta.Icon;

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
            `linear-gradient(90deg, ${meta.tint}, rgba(255,255,255,.64))`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 12,
            fontWeight: 850,
            color: meta.accent,
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "inline-grid",
              placeItems: "center",
              background: meta.tint,
              color: meta.accent,
            }}
          >
            <Icon size={15} strokeWidth={2.4} />
          </span>
          {meta.label}
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
          "linear-gradient(135deg, rgba(37,99,235,.12), rgba(13,148,136,.1) 48%, rgba(236,72,153,.12))",
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
                fontFamily: "inherit",
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

function ContactCards({ source }: { source: any }) {
  const contacts = [
    {
      label: "Primary",
      name: source?.e_contact_1_full_name || source?.primary_contact || "Primary contact",
      relation: source?.e_contact_1_relation,
      phone: source?.e_contact_1_phone || source?.contact_1,
      code: source?.e_contact_1_phone_country_code,
      email: source?.e_contact_1_email,
      accent: "var(--p)",
      tint: "rgba(37,99,235,.09)",
    },
    {
      label: "Secondary",
      name: source?.e_contact_2_full_name || "Secondary contact",
      relation: source?.e_contact_2_relation,
      phone: source?.e_contact_2_phone || source?.contact_2,
      code: source?.e_contact_2_phone_country_code,
      email: source?.e_contact_2_email,
      accent: "var(--teal)",
      tint: "rgba(13,148,136,.09)",
    },
  ].filter((contact) => contact.phone || contact.name !== "Secondary contact" || contact.email);

  if (!contacts.length) {
    return (
      <div className="mono" style={{ color: "var(--t3)", fontSize: 12 }}>
        Not provided
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: 12 }}>
      {contacts.map((contact) => (
        <div
          key={contact.label}
          style={{
            padding: 13,
            borderRadius: 10,
            background: contact.tint,
            border: "1px solid var(--br2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="pill pill-blue" style={{ color: contact.accent }}>{contact.label}</span>
            {contact.relation && <span style={{ fontSize: 11, color: "var(--t3)" }}>{contact.relation}</span>}
          </div>
          <div style={{ fontWeight: 850, color: "var(--t1)", marginBottom: 4 }}>{formatValue(contact.name)}</div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 850, color: contact.accent }}>
            {[contact.code, contact.phone].filter(Boolean).join(" ")}
          </div>
          {contact.email && <div className="mono" style={{ marginTop: 5, fontSize: 11, color: "var(--t3)" }}>{contact.email}</div>}
        </div>
      ))}
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
        <FieldGrid source={emp} fields={rootFields} accent={sectionMeta.employee.accent} />
      </DataSection>

      <DataSection title="job">
        <FieldGrid source={emp} fields={jobFields} accent={sectionMeta.job.accent} />
      </DataSection>

      <DataSection title="salaryInfo">
        <FieldGrid source={emp.salaryInfo} fields={salaryFields} accent={sectionMeta.salaryInfo.accent} />
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
                  background:
                    "linear-gradient(135deg, rgba(255,251,235,.8), rgba(255,255,255,.86))",
                  border: "1px solid rgba(245,158,11,.24)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "rgba(245,158,11,.13)",
                    fontSize: 12,
                    fontWeight: 850,
                    color: "#b45309",
                    marginBottom: 10,
                  }}
                >
                  {formatValue(allowance?.field_name)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 900, color: "var(--t1)" }}>
                    {formatAllowanceAmount(allowance)}
                  </span>
                  {allowance?.is_current && <span className="pill pill-green">Current</span>}
                </div>
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
        <ContactCards source={emp.emergencyContacts} />
        <FieldGrid
          source={emp.emergencyContacts}
          fields={emergencyFields}
          accent={sectionMeta.emergencyContacts.accent}
        />
      </DataSection>

      <DataSection title="bankInfo">
        {emp.bankInfo?.is_verified && (
          <div style={{ marginBottom: 10 }}>
            <span className="pill pill-green">Verified</span>
          </div>
        )}
        <FieldGrid source={emp.bankInfo} fields={bankFields} accent={sectionMeta.bankInfo.accent} />
      </DataSection>

      <DataSection title="medicalInfo">
        <FieldGrid
          source={emp.medicalInfo}
          fields={medicalFields}
          accent={sectionMeta.medicalInfo.accent}
        />
      </DataSection>
    </div>
  );
}
