import type { SeatLayoutTemplate } from "./types";

export function deduplicateLayoutFamilies(layouts: SeatLayoutTemplate[]) {
  const families = new Map<string, SeatLayoutTemplate>();
  for (const template of layouts) {
    const familyId = template.sourceTemplateId || template.id;
    const current = families.get(familyId);
    if (!current || (current.scope === "PLATFORM" && template.scope === "OPERATOR")) families.set(familyId, template);
  }
  return [...families.values()];
}
