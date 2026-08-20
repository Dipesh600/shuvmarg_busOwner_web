import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";

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
    throw new ApiResponseError(response, payload, "Failed to load operator brands");
  }
  return payload?.data || [];
}
