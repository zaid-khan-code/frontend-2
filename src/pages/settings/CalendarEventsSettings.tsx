import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import Modal from "../../components/common/Modal";
import { useToastContext } from "../../context/ToastContext";
import { CalendarEvent, CalendarEventPayload, useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent } from "../../hooks/useCalendarEvents";

const initialForm: CalendarEventPayload = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  type: "holiday",
  visibility: "all",
};

function toInputDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarEventsSettings() {
  const { data: events = [], isLoading } = useCalendarEvents({ all: true, sort: "date", order: "desc" });
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const { showToast } = useToastContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<CalendarEventPayload>(initialForm);

  const openCreate = () => {
    setEditingEvent(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      date: toInputDate(event.date),
      type: event.type,
      visibility: event.visibility || "all",
    });
    setModalOpen(true);
  };

  const saveEvent = async () => {
    const payload = {
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      visibility: form.visibility,
    };
    if (!payload.title || !payload.date || !payload.type || !payload.visibility) {
      showToast("Please fill title, date, type, and visibility.", "error");
      return;
    }
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, payload });
        showToast("Calendar event updated.");
      } else {
        await createEvent.mutateAsync(payload);
        showToast("Calendar event created.");
      }
      setModalOpen(false);
      setEditingEvent(null);
      setForm(initialForm);
    } catch {
      showToast("Could not save calendar event.", "error");
    }
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Calendar Events Configuration</div>
          <div className="pg-sub">Create and update backend calendar events shown on the calendar viewer.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={13} /> Add Event
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>No calendar events yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Type</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={{ fontWeight: 700 }}>{event.title}</td>
                  <td className="mono">{toInputDate(event.date)}</td>
                  <td><span className="pill pill-blue">{event.type}</span></td>
                  <td>{event.visibility || "all"}</td>
                  <td>
                    <button className="ico-btn" aria-label={`Edit ${event.title}`} onClick={() => openEdit(event)}>
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Calendar Event" : "Add Calendar Event"}>
        <div style={{ display: "grid", gap: 14 }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Title</span>
            <input className="input" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Date</span>
              <input className="input" type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Event Category</span>
              <select className="input select-input" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                <option value="holiday">Holiday</option>
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="training">Training</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Visibility</span>
              <select className="input select-input" value={form.visibility} onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value as any }))}>
                <option value="all">All</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </label>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEvent}>Save Event</button>
        </div>
      </Modal>
    </div>
  );
}
