"use client";

import { useMemo, useState } from "react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import { NEPAL_ADMINISTRATIVE_DIVISIONS } from "@/features/operator-dashboard/nepal-administrative-divisions";
import { AgentBrandMultiSelect, AgentSearchableSelect, AgentTextField } from "./AgentFormControls";

export interface CreateAgentFields { name: string; phone: string; outletType: string; district: string; municipality: string; placeName: string; }

const OUTLETS = [
  ["TICKET_COUNTER", "Ticket counter"], ["TRAVEL_AGENCY", "Travel agency"],
  ["MOBILE_SHOP", "Mobile shop"], ["HOTEL", "Hotel"], ["SOLO", "Solo agent"],
].map(([value, label]) => ({ value, label }));

export default function AgentCreateFields({ fields, brands, brandIds, onFieldsChange, onBrandIdsChange }: {
  fields: CreateAgentFields;
  brands: OperatorBrand[];
  brandIds: string[];
  onFieldsChange: (fields: CreateAgentFields) => void;
  onBrandIdsChange: (ids: string[]) => void;
}) {
  const [province, setProvince] = useState("");
  const selectedProvince = NEPAL_ADMINISTRATIVE_DIVISIONS.find((item) => item.name === province);
  const selectedDistrict = selectedProvince?.districts.find((item) => item.name === fields.district);
  const provinces = useMemo(() => NEPAL_ADMINISTRATIVE_DIVISIONS.map((item) => ({ value: item.name, label: item.name })), []);
  const patch = (key: keyof CreateAgentFields, value: string) => onFieldsChange({ ...fields, [key]: value });

  return <section className="grid gap-4 rounded-2xl border border-[#E4D8D1] bg-white p-5 sm:grid-cols-2">
    <AgentTextField label="Full name" value={fields.name} onChange={(value) => patch("name", value)} />
    <AgentTextField label="Mobile number" value={fields.phone} inputMode="tel" placeholder="98XXXXXXXX" onChange={(value) => patch("phone", value)} />
    <AgentSearchableSelect label="Outlet type" value={fields.outletType} options={OUTLETS} placeholder="Select outlet type" onChange={(value) => patch("outletType", value)} />
    <AgentSearchableSelect label="Province" value={province} options={provinces} placeholder="Search province" onChange={(value) => { setProvince(value); onFieldsChange({ ...fields, district: "", municipality: "" }); }} />
    <AgentSearchableSelect label="District" value={fields.district} options={(selectedProvince?.districts || []).map((item) => ({ value: item.name, label: item.name }))} placeholder={province ? "Search district" : "Select province first"} disabled={!province} onChange={(value) => onFieldsChange({ ...fields, district: value, municipality: "" })} />
    <AgentSearchableSelect label="Municipality / rural municipality" value={fields.municipality} options={(selectedDistrict?.municipalities || []).map((item) => ({ value: item.name, label: item.name }))} placeholder={fields.district ? "Search municipality" : "Select district first"} disabled={!fields.district} onChange={(value) => patch("municipality", value)} />
    <div className="sm:col-span-2"><AgentTextField label="Place or locality" value={fields.placeName} placeholder="Tole, bazaar or locality" onChange={(value) => patch("placeName", value)} /></div>
    <AgentBrandMultiSelect options={brands.filter((brand) => brand.status === "ACTIVE").map((brand) => ({ value: brand.id, label: brand.brandName }))} values={brandIds} onChange={onBrandIdsChange} />
  </section>;
}
