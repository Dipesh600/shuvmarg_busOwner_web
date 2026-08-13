export type VehicleCategory = "BUS" | "MINIBUS" | "HIACE";
export type SectionRole = "LOWER_CABIN" | "UPPER_DECK" | "LOWER_BERTH_LEVEL" | "UPPER_BERTH_LEVEL";
export type ElementKind = "SEAT" | "BERTH" | "AISLE" | "DOOR" | "DRIVER";
export type Comfort = "STANDARD" | "RECLINING" | "SEMI_SLEEPER";
export type CommercialClass = "STANDARD" | "PREMIUM" | "PRIORITY";
export interface LayoutElement { elementId: string; kind: ElementKind; label: string | null; position: { x: number; y: number }; size: { width: number; height: number }; attributes?: { comfort: Comfort; commercialClass: CommercialClass; accessible: boolean }; }
export interface LayoutSection { sectionId: string; name: string; role: SectionRole; order: number; widthUnits: number; heightUnits: number; elements: LayoutElement[]; }
export interface SeatLayoutV3 { schemaVersion: 3; vehicleCategory: VehicleCategory; sections: LayoutSection[]; }
export interface SeatLayoutTemplate { id: string; templateCode: string; name: string; scope: "PLATFORM" | "OPERATOR"; ownerId: string | null; sourceTemplateId?: string | null; vehicleCategory: VehicleCategory; status: "ACTIVE" | "ARCHIVED"; currentPublishedRevisionId: string | null; }
export interface SeatLayoutRevision { id: string; templateId: string; revisionNumber: number; status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "RETIRED"; totalPlaces: number; changeSummary?: string | null; layout?: SeatLayoutV3; }
export interface TemplateDetail { template: SeatLayoutTemplate; revisions: SeatLayoutRevision[]; }
export type BuilderTool = "SELECT" | "SEAT" | "BERTH" | "AISLE" | "DOOR" | "DRIVER" | "ERASE";
