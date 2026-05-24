import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToastContext } from "../../context/ToastContext";
import {
  createConfigHook,
  useDepartments,
  useLeaveTypes,
} from "../../hooks/useConfig";
import {
  getSettingsDefinition,
  settingsDefinitions,
  SettingsDefinition,
  SettingsField,
} from "./settingsConfig";

type ConfigHookResult = {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  create: (payload: any) => Promise<any>;
  update: (payload: { id: string; updates: any }) => Promise<any>;
};

const configHooks = Object.fromEntries(
  settingsDefinitions.map((definition) => [
    definition.entity,
    createConfigHook<any>(definition.entity),
  ]),
) as Record<string, () => ConfigHookResult>;

function displayName(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value) return String(value);
  }
  return row?.id ? "Configured item" : "-";
}

function toLookup(rows: any[], nameKeys: string[]) {
  return new Map(
    rows.map((row) => [
      String(row.id),
      displayName(row, nameKeys),
    ]),
  );
}

function normalizeFormValue(field: SettingsField, value: string) {
  if (field.key === "is_active") return value !== "false";
  if (field.includeBlank && value === "") return null;
  if (field.parse === "int") return Number.parseInt(value || "0", 10);
  if (field.parse === "float") return Number.parseFloat(value || "0");
  return value;
}

function formatCell(definition: SettingsDefinition, key: string, value: any, lookups: {
  departments: Map<string, string>;
  leaveTypes: Map<string, string>;
}) {
  const column = definition.columns.find((item) => item.key === key);
  if (column?.type === "status") {
    return (
      <span className={`pill ${value !== false ? "pill-green" : "pill-red"}`}>
        {value !== false ? "Active" : "Inactive"}
      </span>
    );
  }
  if (column?.type === "money") {
    return `PKR ${Number(value || 0).toLocaleString()}`;
  }
  if (key === "department_id" || key === "parent_department_id") {
    return value ? lookups.departments.get(String(value)) || "Unknown department" : "None";
  }
  if (key === "leave_type_id") {
    return value ? lookups.leaveTypes.get(String(value)) || "Unknown leave type" : "None";
  }
  if (key === "late_after_minutes") return `${value ?? 0} min`;
  if (key === "max_percent") return `${value ?? 0}%`;
  return value || "-";
}

function fieldOptions(field: SettingsField, lookups: {
  departments: any[];
  leaveTypes: any[];
}) {
  if (field.options) return field.options;
  const sourceRows =
    field.source === "departments"
      ? lookups.departments
      : field.source === "leaveTypes"
        ? lookups.leaveTypes
        : [];
  return sourceRows.map((row) => ({
    label:
      field.source === "departments"
        ? displayName(row, ["department_name", "department_code"])
        : displayName(row, ["name"]),
    value: row.id,
  }));
}

function ConfigEntityPage({ definition }: { definition: SettingsDefinition }) {
  const { showToast } = useToastContext();
  const useEntity = configHooks[definition.entity];
  const { data = [], isLoading, isError, create, update } = useEntity();
  const { data: departments = [] } = useDepartments();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const lookupMaps = useMemo(
    () => ({
      departments: toLookup(departments, ["department_name", "department_code"]),
      leaveTypes: toLookup(leaveTypes, ["name"]),
    }),
    [departments, leaveTypes],
  );

  const openAdd = () => {
    const initial: Record<string, string> = {};
    for (const field of definition.fields) {
      if (field.key === "is_active") initial[field.key] = "true";
      else initial[field.key] = "";
    }
    setForm(initial);
    setEditIndex(null);
    setModalMode("add");
  };

  const openEdit = (index: number) => {
    const row = data[index];
    const initial: Record<string, string> = {};
    for (const field of definition.fields) {
      const value = row?.[field.key];
      if (field.key === "is_active") initial[field.key] = value === false ? "false" : "true";
      else initial[field.key] = value == null ? "" : String(value);
    }
    setForm(initial);
    setEditIndex(index);
    setModalMode("edit");
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {};
    for (const field of definition.fields) {
      if (!Object.prototype.hasOwnProperty.call(form, field.key)) continue;
      const value = form[field.key];
      if (field.required && value === "") {
        throw new Error(`${field.label} is required.`);
      }
      if (!field.required && value === "" && !field.includeBlank && field.key !== "is_active") {
        continue;
      }
      payload[field.key] = normalizeFormValue(field, value);
    }
    return payload;
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();
      if (modalMode === "edit" && editIndex !== null) {
        await update({ id: data[editIndex].id, updates: payload });
        showToast(`${definition.title} updated`);
      } else {
        await create(payload);
        showToast(`${definition.title} added`);
      }
      setModalMode(null);
      setEditIndex(null);
    } catch (error: any) {
      showToast(error?.message || "Unable to save setting", "error");
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async () => {
    if (deleteIndex === null) return;
    try {
      const row = data[deleteIndex];
      await update({ id: row.id, updates: { is_active: false } });
      showToast(`${definition.title} marked inactive`);
    } catch {
      showToast("Unable to update item", "error");
    } finally {
      setDeleteIndex(null);
    }
  };

  const dependencyRows = { departments, leaveTypes };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">{definition.title}</div>
          <div className="pg-sub">{definition.description}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={13} /> Add
        </button>
      </div>

      {definition.slug === "roles" && (
        <div className="card" style={{ marginBottom: 12, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
          <div style={{ fontSize: 12, color: "#1d4ed8", lineHeight: 1.5 }}>
            Roles can be created here. Permission mapping is not exposed by the backend yet, so permissions still come from seeds/migrations.
          </div>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>Loading settings...</div>
        ) : isError ? (
          <div style={{ padding: 36, textAlign: "center", color: "#dc2626" }}>Unable to load this configuration.</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--t3)" }}>No records configured yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                {definition.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id || index}>
                  {definition.columns.map((column) => (
                    <td key={column.key}>
                      {formatCell(definition, column.key, row[column.key], lookupMaps)}
                    </td>
                  ))}
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="ico-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(index)}>
                        <Pencil size={13} />
                      </button>
                      {"is_active" in row && (
                        <button className="ico-btn" style={{ width: 28, height: 28 }} onClick={() => setDeleteIndex(index)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={`${modalMode === "edit" ? "Edit" : "Add"} ${definition.title.replace(/s$/, "")}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </>
        }
      >
        {definition.fields.map((field) => {
          const options = fieldOptions(field, dependencyRows);
          return (
            <div className="form-group" key={field.key}>
              <label className="form-label">
                {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  className="input select-input"
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                >
                  {(field.includeBlank || !field.required) && <option value="">None</option>}
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className="input"
                  style={{ minHeight: 76, paddingTop: 10 }}
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                />
              ) : (
                <input
                  className="input"
                  type={field.type || "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                />
              )}
            </div>
          );
        })}
      </Modal>

      <ConfirmDialog
        open={deleteIndex !== null}
        title="Mark Inactive"
        message="This will keep the record for history but hide it from regular employee-facing flows."
        onConfirm={softDelete}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}

function makeSettingsPage(slug: string) {
  return function SettingsEntityRoute() {
    const definition = getSettingsDefinition(slug);
    if (!definition) return null;
    return <ConfigEntityPage definition={definition} />;
  };
}

export const DepartmentsPage = makeSettingsPage("departments");
export const DesignationsPage = makeSettingsPage("designations");
export const EmploymentTypesPage = makeSettingsPage("employment-types");
export const JobStatusesPage = makeSettingsPage("job-statuses");
export const WorkModesPage = makeSettingsPage("work-modes");
export const WorkLocationsPage = makeSettingsPage("work-locations");
export const ShiftsPage = makeSettingsPage("shifts");
export const LeaveTypesPage = makeSettingsPage("leave-types");
export const LeavePoliciesPage = makeSettingsPage("leave-policies");
export const LeaveCapacitySettingsPage = makeSettingsPage("leave-capacity");
export const AllowanceTypesPage = makeSettingsPage("allowance-types");
export const PenaltyRulesPage = makeSettingsPage("penalty-rules");
export const RolesPage = makeSettingsPage("roles");
