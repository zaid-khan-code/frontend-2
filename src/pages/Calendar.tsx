import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import Modal from "../components/common/Modal";
import { useToastContext } from "../context/ToastContext";
import {
  CalendarEvent,
  CalendarEventFilters,
  CalendarEventPayload,
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from "../hooks/useCalendarEvents";
import { useAuthStore } from "../store/useAuthStore";

const eventTypeColors: Record<string, string> = {
  holiday: "#ef4444",
  event: "#6366f1",
  meeting: "#3b82f6",
  deadline: "#f59e0b",
  training: "#10b981",
  emergency: "#b91c1c",
  other: "#6b7280",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type RangeMode = "current" | "all" | "year" | "custom";

const initialForm: CalendarEventPayload = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  type: "holiday",
  visibility: "all",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(value: string) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

function getDaysInMonth(date: Date, events: CalendarEvent[]) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
      events: [] as CalendarEvent[],
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateValue = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.push({
      date: dateValue,
      isCurrentMonth: true,
      events: events.filter((event) => event.dateKey === dateKey),
    });
  }

  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
      events: [] as CalendarEvent[],
    });
  }

  return days;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>("current");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [visibility, setVisibility] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [order, setOrder] = useState<"asc" | "desc" | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<CalendarEventPayload>(initialForm);
  const { showToast } = useToastContext();
  const canWrite = useAuthStore((state) => state.hasPermission("calendar:write"));
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  const filters = useMemo<CalendarEventFilters>(() => {
    const next: CalendarEventFilters = {};
    if (rangeMode === "all") next.all = true;
    if (rangeMode === "year") next.year = year;
    if (rangeMode === "custom") {
      next.from = from;
      next.to = to;
    }
    next.type = type;
    next.visibility = visibility;
    next.search = search.trim();
    next.sort = sort;
    next.order = order;
    return next;
  }, [from, order, rangeMode, search, sort, to, type, visibility, year]);

  const { data: events = [], isLoading, isError } = useCalendarEvents(filters);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [events],
  );

  const visibleEvents = sortedEvents.slice(0, 25);
  const days = getDaysInMonth(currentDate, sortedEvents);
  const selectedDateEvents = selectedDate
    ? sortedEvents.filter((event) => event.dateKey === selectedDate)
    : [];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return next;
    });
  };

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
          <div className="pg-greet">Calendar Events</div>
          <div className="pg-sub">
            Filter, create, and update holidays or HR events from the backend calendar.
          </div>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Add Event
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr repeat(5, minmax(120px, 1fr))",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Search</span>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 10, top: 11, color: "var(--t3)" }}
              />
              <input
                className="input"
                style={{ paddingLeft: 32 }}
                placeholder="Search calendar..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Range</span>
            <select
              className="input select-input"
              value={rangeMode}
              onChange={(event) => setRangeMode(event.target.value as RangeMode)}
            >
              <option value="current">Current year</option>
              <option value="all">All years</option>
              <option value="year">Specific year</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Type</span>
            <select
              className="input select-input"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">All types</option>
              <option value="holiday">Holiday</option>
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="training">Training</option>
              <option value="emergency">Emergency</option>
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Visibility</span>
            <select
              className="input select-input"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
            >
              <option value="">Any</option>
              <option value="all">All</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Sort</span>
            <select
              className="input select-input"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="">Default</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Order</span>
            <select
              className="input select-input"
              value={order}
              onChange={(event) => setOrder(event.target.value as "asc" | "desc" | "")}
            >
              <option value="">Default</option>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        {rangeMode === "year" && (
          <div style={{ marginTop: 12, maxWidth: 180 }}>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Year</span>
              <input
                className="input"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </label>
          </div>
        )}

        {rangeMode === "custom" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(180px, 240px))",
              gap: 10,
              marginTop: 12,
            }}
          >
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">From</span>
              <input
                className="input"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="form-group" style={{ margin: 0 }}>
              <span className="form-label">To</span>
              <input
                className="input"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, .9fr) minmax(0, 1.4fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div className="card">
          <div className="ch">
            <div className="ct">
              <div className="ct-ico blue">
                <CalendarIcon size={13} />
              </div>
              Calendar Feed
            </div>
            <span className="pill pill-blue">{events.length} events</span>
          </div>
          {isLoading ? (
            <div style={{ padding: "18px 0", color: "var(--t3)", fontSize: 13 }}>
              Loading calendar events...
            </div>
          ) : isError ? (
            <div style={{ padding: "18px 0", color: "var(--red)", fontSize: 13 }}>
              Could not load calendar events.
            </div>
          ) : visibleEvents.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--inp)",
                    border: "1px solid var(--br)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: eventTypeColors[event.type],
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 13, color: "var(--t1)" }}>
                        {event.title}
                      </strong>
                      <div className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>
                        {formatDate(event.date)}
                      </div>
                    </div>
                    {canWrite && (
                      <button
                        className="btn btn-sm btn-ghost"
                        aria-label={`Edit ${event.title}`}
                        onClick={() => openEdit(event)}
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                  <div>
                    <span
                      className="pill"
                      style={{
                        background: `${eventTypeColors[event.type]}20`,
                        color: eventTypeColors[event.type],
                        textTransform: "capitalize",
                      }}
                    >
                      {event.type}
                      {event.visibility ? ` - ${event.visibility}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "18px 0", color: "var(--t3)", fontSize: 13 }}>
              No calendar events match these filters.
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <button className="btn btn-secondary" onClick={() => navigateMonth("prev")}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button className="btn btn-secondary" onClick={() => navigateMonth("next")}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 1,
              background: "var(--br)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  background: "var(--inp)",
                  padding: "12px 8px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "var(--t3)",
                }}
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                style={{
                  border: 0,
                  textAlign: "left",
                  background: "var(--card)",
                  minHeight: 100,
                  padding: 8,
                  cursor: day.events.length ? "pointer" : "default",
                }}
                onClick={() => {
                  const dateYear = day.date.getFullYear();
                  const month = String(day.date.getMonth() + 1).padStart(2, "0");
                  const date = String(day.date.getDate()).padStart(2, "0");
                  setSelectedDate(`${dateYear}-${month}-${date}`);
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: day.isCurrentMonth ? 700 : 400,
                    color: day.isCurrentMonth ? "var(--t1)" : "var(--t3)",
                    marginBottom: 5,
                  }}
                >
                  {day.date.getDate()}
                </div>
                <div style={{ display: "grid", gap: 3 }}>
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        background: eventTypeColors[event.type],
                        color: "white",
                        fontSize: 10,
                        padding: "2px 5px",
                        borderRadius: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 700 }}>
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>
            Events for {formatDate(`${selectedDate}T00:00:00`)}
          </h3>
          {selectedDateEvents.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: 14,
                    border: "1px solid var(--br)",
                    borderRadius: 8,
                    background: "var(--inp)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 750, color: "var(--t1)" }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>
                      <span style={{ textTransform: "capitalize" }}>{event.type}</span>
                      {event.visibility ? ` - ${event.visibility}` : ""}
                    </div>
                  </div>
                  {canWrite && (
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(event)}>
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--t3)", fontSize: 13 }}>
              No events scheduled for this date.
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 12 }}>Event Types</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {Object.entries(eventTypeColors).map(([eventType, color]) => (
            <div key={eventType} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: color,
                }}
              />
              <span style={{ fontSize: 12, textTransform: "capitalize" }}>{eventType}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? "Edit Calendar Event" : "Create Calendar Event"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveEvent}
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              Save Event
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="calendar-title">
            Title
          </label>
          <input
            id="calendar-title"
            className="input"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Event title"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="calendar-date">
              Date
            </label>
            <input
              id="calendar-date"
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calendar-category">
              Event category
            </label>
            <select
              id="calendar-category"
              className="input select-input"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="holiday">Holiday</option>
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="training">Training</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="calendar-visibility">
            Visibility
          </label>
          <select
            id="calendar-visibility"
            className="input select-input"
            value={form.visibility}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, visibility: event.target.value }))
            }
          >
            <option value="all">All</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
