import { authFetch } from "@/lib/auth";

export interface OperatorBrand {
  id: string;
  brandName: string;
  brandCode?: string;
  isDefault: boolean;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
}

interface BrandsApiResponse {
  success: boolean;
  data: OperatorBrand[];
  message?: string;
}

export async function listMyBrands(): Promise<OperatorBrand[]> {
  const response = await authFetch("/busowner/brands");
  const payload = (await response.json().catch(() => null)) as BrandsApiResponse | null;
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to load operator brands (${response.status})`);
  }
  return payload?.data || [];
}
