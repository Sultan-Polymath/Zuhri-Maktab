// This maktab names classes after their teacher ("Ustaad"/"Ustadh" for men,
// "Ustadah"/"Ustadha" for women) and runs boys' and girls' classes
// separately — used to group the Classes page and infer student gender.
export function isGirlsClass(name: string): boolean {
  return /ustadah|ustadha|\bgirls?\b/i.test(name);
}
