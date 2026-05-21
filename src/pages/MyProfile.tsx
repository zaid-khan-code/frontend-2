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

function FieldGrid({ source, fields }: { source: any; fields: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
      }}
    >
      {fields.map((field) => (
        <div key={field}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--t3)",
              marginBottom: 4,
            }}
          >
            {field}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--t1)",
              overflowWrap: "anywhere",
            }}
          >
            {formatValue(source?.[field])}
          </div>
        </div>
      ))}
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
    <div className="card" style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "var(--t2)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
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
        </div>
      </div>

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
              <FieldGrid
                key={allowance?.id || index}
                source={allowance}
                fields={allowanceFields}
              />
            ))}
          </div>
        ) : (
          <div className="mono" style={{ fontSize: 12 }}>
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
