import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import Modal from "../../components/common/Modal";
import { useToastContext } from "../../context/ToastContext";
import { Announcement, AnnouncementPayload, useAnnouncements } from "../../hooks/useAnnouncements";
import { useDepartments, useDesignations } from "../../hooks/useConfig";

const initialForm: AnnouncementPayload = {
  title: "",
  body: "",
  audience: "all",
  target_department_id: null,
  target_designation_id: null,
  is_active: true,
};

function getDepartmentName(row: any) {
  return row.department_name || row.name || row.title || row.label || "Unnamed department";
}

function getDesignationName(row: any) {
  return row.title || row.designation_name || row.name || row.label || "Unnamed designation";
}

export default function AnnouncementsSettings() {
  const { showToast } = useToastContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementPayload>(initialForm);
  const targetDepartmentId = form.target_department_id || null;
  const { announcements, create, update, isLoading } = useAnnouncements({ all: true });
  const { data: departments = [] } = useDepartments();
  const { data: designations = [], isLoading: designationsLoading } = useDesignations(targetDepartmentId);
  const targetDesignations = targetDepartmentId ? designations : [];

  const openCreate = () => {
    setEditingAnnouncement(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience || "all",
      target_department_id: announcement.target_department_id || null,
      target_designation_id: announcement.target_designation_id || null,
      is_active: announcement.is_active,
    });
    setModalOpen(true);
  };

  const saveAnnouncement = async () => {
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      target_department_id: form.target_department_id || null,
      target_designation_id: form.target_designation_id || null,
      is_active: Boolean(form.is_active),
    };
    if (!payload.title || !payload.body) {
      showToast("Please enter announcement title and message.", "error");
      return;
    }
    try {
      if (editingAnnouncement) {
        await update.mutateAsync({ id: editingAnnouncement.id, payload });
        showToast("Announcement updated.");
      } else {
        await create.mutateAsync(payload);
        showToast("Announcement published.");
      }
      setModalOpen(false);
      setEditingAnnouncement(null);
      setForm(initialForm);
    } catch {
      showToast("Could not save announcement.", "error");
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Announcements Configuration</div>
          <div className="pg-sub">Publish announcements and target them by audience, department, or designation.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={13} /> Add Announcement
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>No announcements yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Audience</th>
                <th>Department Target</th>
                <th>Designation Target</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td style={{ fontWeight: 700 }}>{announcement.title}</td>
                  <td>{announcement.audience}</td>
                  <td>{announcement.target_department_name || announcement.target_department_id || "All departments"}</td>
                  <td>{announcement.target_designation_name || announcement.target_designation_id || "All designations"}</td>
                  <td><span className={`pill ${announcement.is_active ? "pill-green" : "pill-red"}`}>{announcement.is_active ? "Active" : "Inactive"}</span></td>
                  <td className="mono">{announcement.updated_at ? announcement.updated_at.slice(0, 10) : "Not provided"}</td>
                  <td>
                    <button className="ico-btn" aria-label={`Edit ${announcement.title}`} onClick={() => openEdit(announcement)}>
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAnnouncement ? "Edit Announcement" : "Add Announcement"}>
        <div style={{ display: "grid", gap: 14 }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Title</span>
            <input className="input" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Message</span>
            <textarea className="input" rows={4} value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Audience</span>
              <select className="input select-input" value={form.audience} onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value as any }))}>
                <option value="all">All</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Status</span>
              <select className="input select-input" value={String(form.is_active)} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.value === "true" }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Visible Department</span>
              <select
                className="input select-input"
                value={form.target_department_id || ""}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  target_department_id: event.target.value || null,
                  target_designation_id: null,
                }))}
              >
                <option value="">All departments</option>
                {departments.map((department: any) => (
                  <option key={department.id} value={department.id}>{getDepartmentName(department)}</option>
                ))}
              </select>
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Visible Designation</span>
              <select
                className="input select-input"
                value={form.target_designation_id || ""}
                disabled={!targetDepartmentId || designationsLoading}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  target_designation_id: event.target.value || null,
                }))}
              >
                <option value="">
                  {targetDepartmentId ? "All designations in department" : "Select department first"}
                </option>
                {targetDesignations.map((designation: any) => (
                  <option key={designation.id} value={designation.id}>{getDesignationName(designation)}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.5 }}>
            Leave department and designation empty for a company-wide announcement. Select a department to limit visibility, then optionally choose a designation inside that department.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveAnnouncement}>Save Announcement</button>
        </div>
      </Modal>
    </div>
  );
}
