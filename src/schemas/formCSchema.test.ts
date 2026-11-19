import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_FORM_C_DATA,
  buildQrPayload,
  createEmptyFormCData,
  formCSchema,
  formatFssaiDate,
  maskEmailForFoscos,
  maskMobileForFoscos,
  mergeFormCDraft,
  sanitizeFilename,
  syncHistoryDatesWithLicense,
} from './formCSchema';

test('SAMPLE_FORM_C_DATA satisfies strict Zod schema', () => {
  const result = formCSchema.safeParse(SAMPLE_FORM_C_DATA);
  assert.equal(result.success, true);
});

test('formCSchema rejects license number that is not 14 digits', () => {
  const invalid = { ...SAMPLE_FORM_C_DATA, licenseNumber: '12345' };
  const result = formCSchema.safeParse(invalid);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some((issue) => issue.path.includes('licenseNumber'))
    );
  }
});

test('createEmptyFormCData triggers validation failures for required fields', () => {
  const empty = createEmptyFormCData();
  const result = formCSchema.safeParse(empty);
  assert.equal(result.success, false);
});

test('formatFssaiDate converts ISO date to DD-MM-YYYY', () => {
  assert.equal(formatFssaiDate('2026-08-11'), '11-08-2026');
  assert.equal(formatFssaiDate(''), '—');
});

test('maskEmailForFoscos masks middle characters like FoSCoS output', () => {
  const masked = maskEmailForFoscos('legalsuccessindia@gmail.com');
  assert.equal(masked.startsWith('le'), true);
  assert.equal(masked.endsWith('com'), true);
  assert.equal(masked.includes('@'), false);
});

test('maskMobileForFoscos masks middle digits like FoSCoS output', () => {
  assert.equal(maskMobileForFoscos('8910790375'), '89xxxxx375');
});

test('buildQrPayload formats pipe-delimited official summary', () => {
  const payload = buildQrPayload(SAMPLE_FORM_C_DATA);
  assert.match(payload, /^FSSAI FORM-C\|LIC:12826015000118\|/);
  assert.match(payload, /ISSUED:11-08-2026\|UPTO:10-08-2027/);
});

test('sanitizeFilename produces safe deterministic PDF filename', () => {
  const filename = sanitizeFilename('M/S AAROGYA', '12826015000118');
  assert.equal(filename, 'FSSAI_Form_C_12826015000118_M_S_AAROGYA.pdf');
});

test('mergeFormCDraft deep-merges partial nested person fields and preserves cleared strings', () => {
  const partial = {
    ...SAMPLE_FORM_C_DATA,
    fboName: 'CUSTOM FOODS',
    personInCharge: {
      name: 'RITA DEVI',
      qualification: 'B.SC',
      mobileNo: '9876543210',
      emailId: 'rita@example.com',
      address: 'Kolkata',
      state: 'West Bengal',
      district: 'Kolkata',
      pinCode: '700001',
      photoIdCard: 'Aadhaar',
      photoIdNo: '123456789012',
    },
  };
  const merged = mergeFormCDraft(partial);
  assert.equal(merged.fboName, 'CUSTOM FOODS');
  assert.equal(merged.personInCharge.name, 'RITA DEVI');
  assert.equal(merged.personInCharge.contactNo, SAMPLE_FORM_C_DATA.personInCharge.contactNo);
  assert.equal(merged.personInCharge.photoIdExpiryDate, 'N/A');

  const cleared = mergeFormCDraft(createEmptyFormCData());
  assert.equal(cleared.fboName, '');
  assert.equal(cleared.personResponsible.name, '');
});

test('syncHistoryDatesWithLicense keeps first history row synced with Section 01 dates', () => {
  const synced = syncHistoryDatesWithLicense(
    SAMPLE_FORM_C_DATA.licenseHistory,
    '2026-08-11',
    '2027-08-10',
    '2026-09-15',
    '2028-09-14'
  );
  assert.equal(synced[0].issuedOn, '2026-09-15');
  assert.equal(synced[0].feePaidOn, '2026-09-15');
  assert.equal(synced[0].feePaidUpto, '2028-09-14');

  const multiRow = [
    { ...SAMPLE_FORM_C_DATA.licenseHistory[0], issuedOn: '2024-01-01', feePaidUpto: '2025-01-01' },
    { ...SAMPLE_FORM_C_DATA.licenseHistory[0], id: 'hist-2' },
  ];
  const preserved = syncHistoryDatesWithLicense(
    multiRow,
    '2026-08-11',
    '2027-08-10',
    '2026-09-15',
    '2028-09-14'
  );
  assert.equal(preserved[0].issuedOn, '2024-01-01');
  assert.equal(preserved[0].feePaidUpto, '2025-01-01');
});

test('formCSchema accepts custom food product categories', () => {
  const custom = {
    ...SAMPLE_FORM_C_DATA,
    products: [{ id: 'p-custom', foodCategory: '99 - Custom Nutraceutical Powder' }],
  };
  assert.equal(formCSchema.safeParse(custom).success, true);
});
