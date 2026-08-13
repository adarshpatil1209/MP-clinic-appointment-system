/**
 * MediSlot — Data Access Layer
 * Every page calls only these functions, never MOCK_DOCTORS/MOCK_APPOINTMENTS
 * directly. When Django is wired up, only the bodies below change to
 * fetch() calls — callers stay the same.
 *
 * More functions (getSlotsForDoctor, bookSlot, cancelAppointment, ...)
 * get added here as the pages that need them are built.
 */

function getDoctors(filters = {}) {
  const { search, specialization } = filters;
  return MOCK_DOCTORS.filter((doc) => {
    const matchesSearch =
      !search || doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialization =
      !specialization || doc.specialization === specialization;
    return matchesSearch && matchesSpecialization;
  });
}

function getSpecializations() {
  const counts = {};
  MOCK_DOCTORS.forEach((doc) => {
    counts[doc.specialization] = (counts[doc.specialization] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}
