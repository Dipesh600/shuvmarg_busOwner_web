import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateBusinessDraftProgress,
  EMPTY_BUSINESS_VERIFICATION_DRAFT,
  formatRegisteredAddressPreview,
  getBusinessDraftFieldError,
} from "../../src/features/operator-dashboard/business-verification-draft.ts";
import { NEPAL_ADMINISTRATIVE_DIVISIONS } from "../../src/features/operator-dashboard/nepal-administrative-divisions.ts";
import {
  NEPAL_SETTLEMENT_INSTITUTION_GROUPS,
  NEPAL_SETTLEMENT_INSTITUTION_NAMES,
} from "../../src/features/operator-dashboard/nepal-settlement-institutions.ts";

test("business verification draft progress", async (t) => {
  await t.test("official Nepal address hierarchy contains all administrative levels", () => {
    const districtCount = NEPAL_ADMINISTRATIVE_DIVISIONS.reduce(
      (total, province) => total + province.districts.length,
      0
    );
    const municipalityCount = NEPAL_ADMINISTRATIVE_DIVISIONS.reduce(
      (provinceTotal, province) =>
        provinceTotal + province.districts.reduce(
          (districtTotal, district) => districtTotal + district.municipalities.length,
          0
        ),
      0
    );
    assert.equal(NEPAL_ADMINISTRATIVE_DIVISIONS.length, 7);
    assert.equal(districtCount, 77);
    assert.equal(municipalityCount, 753);
  });

  await t.test("new accounts begin at 25 percent", () => {
    const progress = calculateBusinessDraftProgress(
      EMPTY_BUSINESS_VERIFICATION_DRAFT,
      []
    );
    assert.equal(progress.percentage, 25);
    assert.equal(progress.nextStep, 0);
  });

  await t.test("settlement selector contains the current NRB class A, B and C institutions", () => {
    assert.deepEqual(
      NEPAL_SETTLEMENT_INSTITUTION_GROUPS.map((group) => group.institutions.length),
      [20, 17, 17]
    );
    assert.equal(NEPAL_SETTLEMENT_INSTITUTION_NAMES.size, 54);
  });

  await t.test("registered address preview is ordered and always ends with Nepal", () => {
    assert.equal(
      formatRegisteredAddressPreview({
        registeredTole: "New Road",
        registeredWardNumber: "4",
        registeredMunicipality: "Kathmandu Metropolitan City",
        registeredDistrict: "Kathmandu",
        registeredProvince: "Bagmati",
      }),
      "New Road, Ward 4, Kathmandu Metropolitan City, Kathmandu, Bagmati Province, Nepal"
    );
    assert.equal(
      formatRegisteredAddressPreview({
        registeredTole: "",
        registeredWardNumber: "",
        registeredMunicipality: "",
        registeredDistrict: "",
        registeredProvince: "",
      }),
      "Nepal"
    );
  });

  await t.test("completed local sections advance progress without server state", () => {
    const progress = calculateBusinessDraftProgress(
      {
        companyName: "Shuvmarg Travels",
        ownerName: "Ram Owner",
        registeredTole: "New Road",
        registeredWardNumber: "4",
        registeredMunicipality: "Kathmandu Metropolitan City",
        registeredDistrict: "Kathmandu",
        registeredProvince: "Bagmati",
        registeredPostalCode: "44600",
        registeredCountry: "Nepal",
        panNumber: "123456789",
        registrationNumber: "REG-01",
        bankName: "Nepal Bank Ltd.",
        accountHolderName: "Ram Owner",
        accountNumber: "00123456789",
        branchName: "New Road",
        swiftCode: "",
      },
      ["companyRegistration", "taxRegistration", "ownerIdentity"]
    );

    assert.equal(progress.percentage, 100);
    assert.equal(progress.nextStep, 3);
    assert.equal(progress.documentsComplete, true);
  });

  await t.test("invalid PAN, account and SWIFT values do not complete a section", () => {
    assert.match(
      getBusinessDraftFieldError("panNumber", "12345ABC9") || "",
      /9 digits/
    );
    assert.match(
      getBusinessDraftFieldError("accountNumber", "1234<script>") || "",
      /letters, numbers/
    );
    assert.match(
      getBusinessDraftFieldError("swiftCode", "INVALID") || "",
      /8 or 11/
    );
    assert.match(
      getBusinessDraftFieldError("registeredWardNumber", "0") || "",
      /between 1 and 99/
    );
    assert.match(
      getBusinessDraftFieldError("bankName", "Made Up Bank") || "",
      /NRB list/
    );
  });
});
