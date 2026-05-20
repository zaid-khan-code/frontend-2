import React, { useState } from 'react';
import SettingsPage from './SettingsPage';
import { useData } from '../../context/DataContext';
import { useToastContext } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatPKR } from '../../services/api';
import { 
  useDepartments, 
  useDesignations, 
  useWorkModes, 
  useWorkLocations, 
  useEmploymentTypes, 
  useJobStatuses 
} from '../../hooks/useConfig';

export function DepartmentsPage() {
  const { data, create, update, isLoading } = useDepartments();
  if (isLoading) return <div>Loading...</div>;
  
  return <SettingsPage title="Departments" columns={['Name', 'Active']} data={data.map(d => ({ name: d.name, active: d.is_active !== false }))}
    onAdd={(row) => create({ name: row.Name || row.name })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || row.name || data[idx].name } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function DesignationsPage() {
  const { data, create, update, isLoading } = useDesignations();
  const { data: deptData } = useDepartments();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Designations" columns={['Name', 'Department', 'Active']}
    data={data.map(d => ({ name: d.name, department: d.department?.name || 'General', active: d.is_active !== false }))}
    modalFields={[{ label: 'Name' }, { label: 'Department', options: (deptData || []).map((d: any) => d.name) }]}
    onAdd={(row) => create({ name: row.Name || row.name, department_id: deptData?.find((d: any) => d.name === row.Department)?.id })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name, department_id: deptData?.find((d: any) => d.name === row.Department)?.id || data[idx].department_id } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function WorkModesPage() {
  const { data, create, update, isLoading } = useWorkModes();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Work Modes" columns={['Name', 'Active']} data={data.map(d => ({ name: d.name, active: d.is_active !== false }))}
    onAdd={(row) => create({ name: row.Name || row.name })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function WorkLocationsPage() {
  const { data, create, update, isLoading } = useWorkLocations();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Work Locations" columns={['Name', 'Active']} data={data.map(d => ({ name: d.name ?? d.location_name ?? d.work_location_name ?? d.title, active: d.is_active !== false }))}
    modalFields={[{ label: 'Name' }, { label: 'Address' }]}
    onAdd={(row) => create({ name: row.Name || row.name, address: row.Address })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name, address: row.Address || data[idx].address } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function EmploymentTypesPage() {
  const { data, create, update, isLoading } = useEmploymentTypes();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Employment Types" columns={['Name', 'Active']} data={data.map(d => ({ name: d.name, active: d.is_active !== false }))}
    onAdd={(row) => create({ name: row.Name || row.name })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function JobStatusesPage() {
  const { data, create, update, isLoading } = useJobStatuses();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Job Statuses" columns={['Name', 'Active']} data={data.map(d => ({ name: d.name, active: d.is_active !== false }))}
    onAdd={(row) => create({ name: row.Name || row.name })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function ReportingManagersPage() {
  const { reportingManagers, setReportingManagers, departments } = useData();
  return <SettingsPage title="Reporting Managers" columns={['Name', 'Active']}
    data={reportingManagers.map(d => ({ name: d, active: true }))}
    modalFields={[{ label: 'Name' }, { label: 'Department', options: departments }]}
    onAdd={(row) => setReportingManagers(prev => [...prev, row.Name || row.name])}
    onEdit={(idx, row) => setReportingManagers(prev => prev.map((d, i) => i === idx ? (row.Name || d) : d))}
    onDelete={(idx) => setReportingManagers(prev => prev.filter((_, i) => i !== idx))} />;
}
import { useShifts, useLeaveTypes, useLeavePolicies } from '../../hooks/useConfig';

export function ShiftsPage() {
  const { data, create, update, isLoading } = useShifts();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Shifts" columns={['Name', 'Start', 'End', 'Late After (min)', 'Active']}
    data={data.map(s => ({ name: s.name, start: s.start_time || s.start, end: s.end_time || s.end, late: s.late_after_minutes || s.lateAfter, active: s.is_active !== false }))}
    modalFields={[{ label: 'Name' }, { label: 'Start Time', type: 'time' }, { label: 'End Time', type: 'time' }, { label: 'Late After (minutes)', type: 'number' }]}
    onAdd={(row) => create({ name: row.Name || '', start_time: row['Start Time'] || '09:00', end_time: row['End Time'] || '18:00', late_after_minutes: parseInt(row['Late After (minutes)']) || 15 })}
    onEdit={(idx, row) => {
      const s = data[idx];
      update({ id: s.id, updates: { name: row.Name || s.name, start_time: row['Start Time'] || s.start_time, end_time: row['End Time'] || s.end_time, late_after_minutes: parseInt(row['Late After (minutes)']) || s.late_after_minutes } });
    }}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function LeaveTypesPage() {
  const { data, create, update, isLoading } = useLeaveTypes();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Leave Types" columns={['Name', 'Code', 'Active']} data={data.map(d => ({ name: d.name, code: d.code, active: d.is_active !== false }))}
    onAdd={(row) => create({ name: row.Name || '', code: row.Code || (row.Name || '').substring(0, 2).toUpperCase() })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { name: row.Name || data[idx].name, code: row.Code || data[idx].code } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function LeavePoliciesPage() {
  const { data, create, update, isLoading } = useLeavePolicies();
  const { data: leaveTypesData } = useLeaveTypes();
  if (isLoading) return <div>Loading...</div>;

  return <SettingsPage title="Leave Policies" columns={['Leave Type', 'Days', 'Year', 'Active']}
    data={data.map(p => ({ type: p.leave_type?.name || p.leaveType, days: p.days_allowed || p.days, year: p.year, active: p.is_active !== false }))}
    modalFields={[{ label: 'Leave Type', options: (leaveTypesData || []).map((l: any) => l.name) }, { label: 'Days', type: 'number' }, { label: 'Year', type: 'number' }]}
    onAdd={(row) => create({ leave_type_id: leaveTypesData?.find((l: any) => l.name === row['Leave Type'])?.id, days_allowed: parseInt(row.Days) || 0, year: parseInt(row.Year) || new Date().getFullYear() })}
    onEdit={(idx, row) => update({ id: data[idx].id, updates: { leave_type_id: leaveTypesData?.find((l: any) => l.name === row['Leave Type'])?.id || data[idx].leave_type_id, days_allowed: parseInt(row.Days) || data[idx].days_allowed, year: parseInt(row.Year) || data[idx].year } })}
    onDelete={(idx) => update({ id: data[idx].id, updates: { is_active: false } })} />;
}

export function PayrollComponentsPage() {
  const { payrollComponents, setPayrollComponents } = useData();
  return (
    <div>
      <SettingsPage title="Payroll Components" columns={['Name', 'Type', 'Taxable', 'Order', 'Active']}
        data={payrollComponents.map(c => ({ name: c.name, type: c.type, taxable: c.taxable, order: c.order, active: c.active }))}
        modalFields={[{ label: 'Name' }, { label: 'Type', options: ['Earning', 'Deduction'] }, { label: 'Display Order', type: 'number' }]}
        onAdd={(row) => setPayrollComponents(prev => [...prev, { name: row.Name || '', type: row.Type || 'Earning', taxable: false, order: prev.length + 1, active: true }])}
        onEdit={(idx, row) => setPayrollComponents(prev => prev.map((c, i) => i === idx ? { ...c, name: row.Name || c.name, type: row.Type || c.type, order: parseInt(row['Display Order']) || c.order } : c))}
        onDelete={(idx) => setPayrollComponents(prev => prev.filter((_, i) => i !== idx))} />
      <div className="card" style={{ marginTop: 12, background: 'var(--pl)', border: '1px solid var(--p2)' }}>
        <div style={{ fontSize: 12, color: 'var(--p)' }}>ℹ Adding a component here automatically adds it to all future payroll generation forms.</div>
      </div>
    </div>
  );
}
export function PenaltiesConfigPage() {
  const { penaltiesConfig, setPenaltiesConfig } = useData();
  return <SettingsPage title="Penalties Config" columns={['Name', 'Category', 'Default Fine', 'Active']}
    data={penaltiesConfig.map(p => ({ name: p.name, category: p.category, fine: `PKR ${p.defaultFine.toLocaleString()}`, active: p.active }))}
    modalFields={[{ label: 'Name' }, { label: 'Category', options: ['Attendance', 'Behaviour', 'Misconduct', 'Dress Code'] }, { label: 'Default Fine', type: 'number' }]}
    onAdd={(row) => setPenaltiesConfig(prev => [...prev, { name: row.Name || '', category: row.Category || 'Behaviour', defaultFine: parseInt(row['Default Fine']) || 0, active: true }])}
    onEdit={(idx, row) => setPenaltiesConfig(prev => prev.map((p, i) => i === idx ? { ...p, name: row.Name || p.name, category: row.Category || p.category, defaultFine: parseInt(row['Default Fine']) || p.defaultFine } : p))}
    onDelete={(idx) => setPenaltiesConfig(prev => prev.filter((_, i) => i !== idx))} />;
}

export function TaxConfigPage() {
  const { taxConfig, setTaxConfig } = useData();
  return <SettingsPage title="Tax Config" columns={['From (PKR)', 'To (PKR)', 'Rate %', 'Fixed Amt', 'Active']}
    data={taxConfig.map(t => ({ from: t.salaryFrom.toLocaleString(), to: t.salaryTo !== null ? t.salaryTo.toLocaleString() : 'Unlimited', rate: t.taxRatePercent + '%', fixed: t.fixedAmount, active: t.active }))}
    modalFields={[{ label: 'Salary From', type: 'number' }, { label: 'Salary To', type: 'number' }, { label: 'Tax Rate %', type: 'number' }, { label: 'Fixed Amount', type: 'number' }]}
    onAdd={(row) => setTaxConfig(prev => [...prev, { id: 'TC' + String(Date.now()).slice(-3), salaryFrom: parseInt(row['Salary From']) || 0, salaryTo: row['Salary To'] ? parseInt(row['Salary To']) : null, taxRatePercent: parseFloat(row['Tax Rate %']) || 0, fixedAmount: parseInt(row['Fixed Amount']) || 0, active: true }])}
    onEdit={(idx, row) => setTaxConfig(prev => prev.map((t, i) => i === idx ? { ...t, salaryFrom: parseInt(row['Salary From']) || t.salaryFrom, salaryTo: row['Salary To'] ? parseInt(row['Salary To']) : t.salaryTo, taxRatePercent: parseFloat(row['Tax Rate %']) || t.taxRatePercent, fixedAmount: parseInt(row['Fixed Amount']) || t.fixedAmount } : t))}
    onDelete={(idx) => setTaxConfig(prev => prev.filter((_, i) => i !== idx))} />;
}

export function GlobalDaysPage() {
  const { globalDays, setGlobalDays } = useData();
  const { showToast } = useToastContext();
  const [modal, setModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ title: '', date: '', type: 'holiday', affects_attendance: true, show_banner: false, banner_message: '' });

  const filtered = globalDays.filter(g => !typeFilter || g.type === typeFilter);

  const openAdd = () => { setForm({ title: '', date: '', type: 'holiday', affects_attendance: true, show_banner: false, banner_message: '' }); setEditIdx(null); setModal(true); };
  const openEdit = (idx: number) => {
    const g = globalDays[idx];
    setForm({ title: g.title, date: g.date, type: g.type, affects_attendance: g.affects_attendance, show_banner: g.show_banner, banner_message: g.banner_message });
    setEditIdx(idx); setModal(true);
  };

  const handleSave = () => {
    if (editIdx !== null) {
      setGlobalDays(prev => prev.map((g, i) => i === editIdx ? { ...g, ...form } : g));
      showToast('Event updated');
    } else {
      setGlobalDays(prev => [...prev, { id: 'GD' + String(Date.now()).slice(-3), ...form, created_by: 'superadmin', created_at: new Date().toISOString(), is_active: true }]);
      showToast('Event added');
    }
    setModal(false);
  };

  const handleDelete = () => {
    if (deleteIdx !== null) { setGlobalDays(prev => prev.filter((_, i) => i !== deleteIdx)); showToast('Event deleted'); setDeleteIdx(null); }
  };

  const toggleActive = (idx: number) => {
    setGlobalDays(prev => prev.map((g, i) => i === idx ? { ...g, is_active: !g.is_active } : g));
    showToast('Status toggled');
  };

  return (
    <div>
      <div className="pg-head">
        <div><div className="pg-greet">Global Days</div><div className="pg-sub">Manage holidays, emergency closures and company events</div></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={13} /> Add Event</button>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input select-input" style={{ width: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option><option value="holiday">Holiday</option><option value="emergency">Emergency</option><option value="company_event">Company Event</option>
          </select>
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>No events configured</div> : (
          <table>
            <thead><tr><th>Title</th><th>Date</th><th>Type</th><th>Affects Attendance</th><th>Banner</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((g, i) => {
                const realIdx = globalDays.indexOf(g);
                return (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{g.title}</td>
                    <td className="mono">{g.date}</td>
                    <td><span className={`pill ${g.type === 'emergency' ? 'pill-red' : g.type === 'holiday' ? 'pill-green' : 'pill-blue'}`}>{g.type}</span></td>
                    <td>{g.affects_attendance ? 'Yes' : 'No'}</td>
                    <td>{g.show_banner ? 'Yes' : 'No'}</td>
                    <td><button className={`pill ${g.is_active ? 'pill-green' : 'pill-red'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => toggleActive(realIdx)}>{g.is_active ? 'Active' : 'Inactive'}</button></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="ico-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(realIdx)}><Pencil size={13} /></button>
                        <button className="ico-btn" style={{ width: 28, height: 28 }} onClick={() => setDeleteIdx(realIdx)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editIdx !== null ? 'Edit Event' : 'Add Event'} footer={
        <><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
      }>
        <div className="form-group"><label className="form-label">Title</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Date</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Type</label><select className="input select-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="holiday">Holiday</option><option value="emergency">Emergency</option><option value="company_event">Company Event</option></select></div>
        <div className="form-group"><label style={{ fontSize: 12, cursor: 'pointer' }}><input type="checkbox" checked={form.affects_attendance} onChange={e => setForm(f => ({ ...f, affects_attendance: e.target.checked }))} /> Affects attendance (auto-excuse absences)</label></div>
        <div className="form-group"><label style={{ fontSize: 12, cursor: 'pointer' }}><input type="checkbox" checked={form.show_banner} onChange={e => setForm(f => ({ ...f, show_banner: e.target.checked }))} /> Show global banner</label></div>
        {form.show_banner && <div className="form-group"><label className="form-label">Banner Message</label><input className="input" value={form.banner_message} onChange={e => setForm(f => ({ ...f, banner_message: e.target.value }))} /></div>}
      </Modal>
      <ConfirmDialog open={deleteIdx !== null} title="Delete Event" message="Are you sure you want to delete this event?" onConfirm={handleDelete} onCancel={() => setDeleteIdx(null)} />
    </div>
  );
}











