import test from "node:test";
import assert from "node:assert/strict";

import { validateKycDraftFile } from "../../src/features/operator-dashboard/kyc-document-client-validation.ts";

function file(name: string, type: string, contents: string): File {
  return new File([contents], name, { type });
}

test("KYC document client validation", async (t) => {
  await t.test("accepts a bounded PDF with matching signature and EOF marker", async () => {
    const document = file(
      "registration.pdf",
      "application/pdf",
      "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n"
    );
    assert.equal(await validateKycDraftFile(document), null);
  });

  await t.test("rejects a renamed payload whose bytes do not match the declared type", async () => {
    const disguised = file(
      "registration.pdf",
      "application/pdf",
      "not really a pdf\n%%EOF\n"
    );
    assert.match(await validateKycDraftFile(disguised) || "", /does not match/);
  });

  await t.test("rejects unsafe names and incomplete files", async () => {
    const unsafe = file(
      "../registration.pdf",
      "application/pdf",
      "%PDF-1.4\n%%EOF\n"
    );
    assert.match(await validateKycDraftFile(unsafe) || "", /unsafe filename/);

    const incomplete = file(
      "registration.pdf",
      "application/pdf",
      "%PDF-1.4\n1 0 obj"
    );
    assert.match(await validateKycDraftFile(incomplete) || "", /incomplete or malformed/);
  });
});
