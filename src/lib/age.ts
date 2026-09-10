export function calculateAge(dob: Date | null, on: Date = new Date()): number | null {
  if (!dob) return null;
  let age = on.getFullYear() - dob.getFullYear();
  const monthDiff = on.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
