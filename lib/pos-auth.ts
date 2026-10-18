import { StaffMember } from '@/types';

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Tanvir (Cashier 1)',
    role: 'CASHIER',
    pin: '1234',
  },
  {
    id: 'staff-2',
    name: 'Aminul (Cashier 2)',
    role: 'CASHIER',
    pin: '2468',
  },
  {
    id: 'staff-3',
    name: 'Executive Manager',
    role: 'MANAGER',
    pin: '9999',
  },
  {
    id: 'staff-4',
    name: 'Floor Staff 1',
    role: 'SERVER',
    pin: '1111',
  },
];

const STORAGE_KEY_SESSION = 'trp_pos_staff_session';
const STORAGE_KEY_STAFF_LIST = 'trp_pos_staff_list_v1';

export function getStaffMembers(): StaffMember[] {
  if (typeof window === 'undefined') return DEFAULT_STAFF_MEMBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_LIST);
    if (!raw) return DEFAULT_STAFF_MEMBERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAFF_MEMBERS;
  } catch {
    return DEFAULT_STAFF_MEMBERS;
  }
}

export function saveStaffMembers(staffList: StaffMember[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(staffList));
}

export function authenticateWithPin(pin: string, staffId?: string): StaffMember | null {
  const staffList = getStaffMembers();
  if (staffId) {
    const staff = staffList.find((s) => s.id === staffId);
    if (staff && staff.pin === pin) return staff;
    return null;
  }
  // If no specific staff is pre-selected, match any staff with this PIN
  const matched = staffList.find((s) => s.pin === pin);
  return matched || null;
}

export function getActiveStaff(): StaffMember | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSION) || localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveStaff(staff: StaffMember, persistent = true) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(staff);
  sessionStorage.setItem(STORAGE_KEY_SESSION, serialized);
  if (persistent) {
    localStorage.setItem(STORAGE_KEY_SESSION, serialized);
  }
}

export function clearActiveStaff() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_SESSION);
}
