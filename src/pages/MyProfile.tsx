import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmployee } from '../hooks/useEmployees';
import { apiClient } from '../services/apiClient';
import { Save, Camera, Loader2 } from 'lucide-react';
import { useToastContext } from '../context/ToastContext';

export default function MyProfile() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  // If employeeId is not yet available, show a loading state
  if (!employeeId) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spinner" size={24} /></div>;
  }
  const { data: emp, isLoading, isError } = useEmployee(employeeId);
  const { showToast } = useToastContext();
  
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState('');
  const [ice1, setIce1] = useState('');
  const [ice2, setIce2] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');

  // Sync state when data loads
  useEffect(() => {
    console.log('MyProfile employeeId:', employeeId);
  }, [employeeId]);
  useEffect(() => {
    console.log('MyProfile emp data:', emp);
  }, [emp]);
  useEffect(() => {
    if (emp) {
      setContact((emp.accountInfo?.phone) || emp.contact1 || emp.phone || '');
      setIce1((emp.emergencyContacts?.e_contact_1_phone) || emp.emergency1 || '');
      setIce2((emp.emergencyContacts?.e_contact_2_phone) || emp.emergency2 || '');
      setBankName((emp.bankInfo?.bank_name) || emp.bankName || '');
      setBankAcc((emp.bankInfo?.account_number) || emp.bankAccount || '');
    }
  }, [emp]);

  const handleSave = async () => {
    if (!employeeId) return;
    try {
      await apiClient.patch(`/employees/${employeeId}`, {
        accountInfo: { phone: contact },
        emergencyContacts: { e_contact_1_phone: ice1, e_contact_2_phone: ice2 },
        bankInfo: { bank_name: bankName, account_number: bankAcc }
      });
      showToast('Profile updated');
      setEditing(false);
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
  };

  const InfoItem = ({ label, value, editable, editValue, onEdit }: { label: string; value: string; editable?: boolean; editValue?: string; onEdit?: (v: string) => void }) => (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      {editing && editable ? (
        <input className="input" value={editValue} onChange={e => onEdit?.(e.target.value)} style={{ fontSize: 13 }} />
      ) : (
        <div style={{ fontSize: 13 }}>{value}</div>
      )}
    </div>
  );

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spinner" size={24} /></div>;
  if (isError || !emp) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Error loading profile.</div>;

  const displayAvatar = (emp.accountInfo?.email?.split('@')[0]?.slice(0,2)?.toUpperCase()) || emp.avatar || emp.name?.slice(0,2)?.toUpperCase() || '?';
  const displayName = emp.name || emp.personalInfo?.name || '—';
  const displayDept = emp.department_name || emp.jobInfo?.department_name || emp.department || '—';
  const displayDesig = emp.designation_name || emp.jobInfo?.designation_name || emp.designation || '—';

  return (
    <div>
      <div className="pg-head">
        <div><div className="pg-greet">My Profile</div><div className="pg-sub">View and update your information</div></div>
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Save size={13} /> Save Changes</button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      {/* Avatar header */}
      <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <div className="avatar avatar-lg" style={{ background: 'var(--p)' }}>{displayAvatar}</div>
          {editing && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
              <Camera size={10} />
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{displayName}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>{emp.employee_id || emp.id} · {displayDept} · {displayDesig}</div>
        </div>
      </div>

      {/* Personal Info (read-only) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 12 }}>Personal Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoItem label="Full Name" value={displayName} />
          <InfoItem label="Father Name" value={emp.personalInfo?.father_name || emp.fatherName || '—'} />
          <InfoItem label="Date of Birth" value={emp.personalInfo?.date_of_birth || emp.dob || '—'} />
          <InfoItem label="CNIC" value={emp.personalInfo?.cnic || emp.cnic || '—'} />
          <InfoItem label="Gender" value={emp.personalInfo?.gender || emp.gender || '—'} />
          <InfoItem label="Blood Group" value={emp.medicalInfo?.blood_group || emp.bloodGroup || '—'} />
        </div>
      </div>

      {/* Contact (editable) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 12 }}>Contact Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoItem label="Phone" value={contact || '—'} editable editValue={contact} onEdit={setContact} />
          <InfoItem label="Emergency Contact 1" value={ice1 || '—'} editable editValue={ice1} onEdit={setIce1} />
          <InfoItem label="Emergency Contact 2" value={ice2 || 'N/A'} editable editValue={ice2} onEdit={setIce2} />
        </div>
      </div>

      {/* Bank (editable with note) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 12 }}>Bank Details</div>
        {editing && <div style={{ fontSize: 11, color: 'var(--amber)', marginBottom: 8, background: 'var(--amberl)', padding: '6px 10px', borderRadius: 'var(--rxs)' }}>⚠ Bank detail changes require HR approval</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoItem label="Bank Name" value={bankName || 'Not provided'} editable editValue={bankName} onEdit={setBankName} />
          <InfoItem label="Account Number" value={bankAcc || 'Not provided'} editable editValue={bankAcc} onEdit={setBankAcc} />
          <InfoItem label="Payment Mode" value={emp.paymentMode || '—'} />
        </div>
      </div>

      {/* Job Info (read-only) */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 12 }}>Job Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <InfoItem label="Department" value={displayDept} />
          <InfoItem label="Designation" value={displayDesig} />
          <InfoItem label="Work Mode" value={emp.work_mode_name || emp.workMode || '—'} />
          <InfoItem label="Shift" value={emp.shift_name || emp.shift || '—'} />
          <InfoItem label="Date of Joining" value={emp.jobInfo?.date_of_joining || emp.dateOfJoining || '—'} />
          <InfoItem label="Reporting Manager" value={emp.manager_emp_id || emp.reportingManager || '—'} />
        </div>
      </div>
    </div>
  );
}











