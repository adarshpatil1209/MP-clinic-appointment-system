/**
 * MediSlot — Mock Data
 * Shape matches the future Django/PostgreSQL response exactly so the
 * data-access layer swaps from mock reads to fetch() with no callers
 * changing. Field and status names match 00_context.md §3 verbatim.
 */

const MOCK_DOCTORS = [
  {
    id: "d1",
    name: "Dr. Anjali Deshmukh",
    specialization: "Cardiology",
    fee: 800,
    experienceYears: 12,
    bio: "Focuses on preventive heart care and long-term management of hypertension and arrhythmia.",
    slots: [
      { id: "s101", date: "2026-08-15", time: "09:00", status: "open" },
      { id: "s102", date: "2026-08-15", time: "09:30", status: "booked" },
      { id: "s103", date: "2026-08-15", time: "10:00", status: "open" },
      { id: "s104", date: "2026-08-16", time: "09:00", status: "open" },
    ],
  },
  {
    id: "d2",
    name: "Dr. Rohan Kulkarni",
    specialization: "Dermatology",
    fee: 600,
    experienceYears: 8,
    bio: "Treats acne, eczema, and skin allergies, with a focus on clear, jargon-free care plans.",
    slots: [
      { id: "s201", date: "2026-08-15", time: "11:00", status: "open" },
      { id: "s202", date: "2026-08-15", time: "11:30", status: "open" },
      { id: "s203", date: "2026-08-16", time: "16:00", status: "booked" },
    ],
  },
  {
    id: "d3",
    name: "Dr. Meera Iyer",
    specialization: "Pediatrics",
    fee: 500,
    experienceYears: 15,
    bio: "Sees infants through teens, with a special interest in childhood immunization schedules.",
    slots: [
      { id: "s301", date: "2026-08-15", time: "10:00", status: "open" },
      { id: "s302", date: "2026-08-15", time: "10:30", status: "open" },
      { id: "s303", date: "2026-08-17", time: "09:00", status: "open" },
    ],
  },
  {
    id: "d4",
    name: "Dr. Vikram Rane",
    specialization: "Orthopedics",
    fee: 900,
    experienceYears: 20,
    bio: "Specializes in sports injuries and joint pain, treating both surgical and non-surgical cases.",
    slots: [
      { id: "s401", date: "2026-08-16", time: "12:00", status: "open" },
      { id: "s402", date: "2026-08-16", time: "12:30", status: "booked" },
      { id: "s403", date: "2026-08-17", time: "10:00", status: "open" },
    ],
  },
  {
    id: "d5",
    name: "Dr. Sanika Patil",
    specialization: "Gynecology",
    fee: 700,
    experienceYears: 10,
    bio: "Provides prenatal care, family planning consultations, and routine gynecological checkups.",
    slots: [
      { id: "s501", date: "2026-08-15", time: "14:00", status: "open" },
      { id: "s502", date: "2026-08-15", time: "14:30", status: "open" },
      { id: "s503", date: "2026-08-16", time: "15:00", status: "open" },
    ],
  },
  {
    id: "d6",
    name: "Dr. Aditya Joshi",
    specialization: "ENT",
    fee: 550,
    experienceYears: 7,
    bio: "Treats sinus issues, hearing concerns, and recurring throat infections.",
    slots: [
      { id: "s601", date: "2026-08-15", time: "16:00", status: "booked" },
      { id: "s602", date: "2026-08-16", time: "09:30", status: "open" },
      { id: "s603", date: "2026-08-16", time: "10:00", status: "open" },
    ],
  },
  {
    id: "d7",
    name: "Dr. Neha Kamble",
    specialization: "Psychiatry",
    fee: 750,
    experienceYears: 9,
    bio: "Works with anxiety, depression, and sleep disorders through therapy and medication management.",
    slots: [
      { id: "s701", date: "2026-08-15", time: "13:00", status: "open" },
      { id: "s702", date: "2026-08-17", time: "11:00", status: "open" },
      { id: "s703", date: "2026-08-17", time: "11:30", status: "open" },
    ],
  },
  {
    id: "d8",
    name: "Dr. Omkar Bhosale",
    specialization: "Dentistry",
    fee: 400,
    experienceYears: 6,
    bio: "General dentistry with a focus on routine cleanings, fillings, and early cavity care.",
    slots: [
      { id: "s801", date: "2026-08-16", time: "17:00", status: "open" },
      { id: "s802", date: "2026-08-16", time: "17:30", status: "open" },
      { id: "s803", date: "2026-08-17", time: "09:30", status: "booked" },
    ],
  },
  {
    id: "d9",
    name: "Dr. Priyanka Naik",
    specialization: "General Medicine",
    fee: 450,
    experienceYears: 11,
    bio: "First point of contact for everyday illness, checkups, and referrals to specialists.",
    slots: [
      { id: "s901", date: "2026-08-15", time: "09:00", status: "open" },
      { id: "s902", date: "2026-08-15", time: "09:30", status: "open" },
      { id: "s903", date: "2026-08-16", time: "08:30", status: "open" },
    ],
  },
];

// Appointments start empty — populated by bookSlot() as patients book.
// Shape matches the future Appointment model: patient + slot + status.
const MOCK_APPOINTMENTS = [];
