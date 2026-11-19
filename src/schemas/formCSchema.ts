import { z } from 'zod';

export const LICENSE_TIERS = ['State License', 'Central License'] as const;

export const BUSINESS_KINDS = [
  'Trade/Retail - Retailer',
  'Manufacturer',
  'Relabeller / Repacker',
  'Importer',
  'Exporter',
  'Distributor / Wholesaler',
  'Transporter / Storage',
  'Food Vending / Catering',
  'E-Commerce Food Business',
] as const;

export const FOOD_CATEGORIES = [
  '01 - Dairy products and analogues',
  '02 - Fats and oils, and fat emulsions',
  '04 - Fruits and vegetables, nuts and seeds',
  '05 - Confectionery',
  '06 - Cereals and cereal products',
  '07 - Bakery wares',
  '08 - Meat and meat products',
  '10 - Eggs and egg products',
  '11 - Sweeteners, including honey',
  '12 - Salts, spices, soups, sauces, salads',
  '13 - Foodstuffs intended for particular nutritional uses',
  '14 - Beverages, excluding dairy products',
  '15 - Ready-to-eat savouries',
  '16 - Prepared Foods',
] as const;

export const foodProductSchema = z.object({
  id: z.string().min(1),
  foodCategory: z.string().min(2, 'Food category is required'),
});

export const licenseHistoryEntrySchema = z.object({
  id: z.string().min(1),
  issuedOn: z.string().min(1, 'Issued On date is required'),
  feePaidOn: z.string().min(1, 'Fee Paid On date is required'),
  feePaidUpto: z.string().min(1, 'Fee Paid Upto date is required'),
  feePaid: z.string().min(1, 'Fee amount is required'),
  type: z.string().min(1, 'Type is required'),
  issuingAuthority: z.string().min(2, 'Issuing authority is required'),
});

export const personDetailsSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  contactNo: z.string().min(5, 'Contact number is required'),
  mobileNo: z.string().min(5, 'Mobile number is required'),
  emailId: z.string().email('Valid email ID is required'),
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  photoIdCard: z.string().min(2, 'Photo ID Card type is required'),
  photoIdNo: z.string().min(2, 'Photo ID Number is required'),
  photoIdExpiryDate: z.string().min(1, 'Expiry date or N/A is required'),
  fostacNo: z.string().optional(),
});

export const formCSchema = z.object({
  governmentTitle: z.string().min(2, 'Government heading is required'),
  departmentTitle: z.string().min(2, 'Department heading is required'),
  licenseTier: z.enum(LICENSE_TIERS),
  licenseNumber: z
    .string()
    .regex(/^\d{14}$/, 'FSSAI License Number must be exactly 14 digits'),
  fboName: z.string().min(2, 'Licensee / FBO name is required'),
  fboPermanentAddress: z
    .string()
    .min(10, 'Registered office address must be at least 10 characters'),
  premisesAddress: z
    .string()
    .min(10, 'Authorized premises address must be at least 10 characters'),
  kindOfBusiness: z
    .string()
    .min(2, 'Kind of Business is required'),
  place: z.string().min(2, 'Place is required'),
  issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued On date is required'),
  feePaidUpto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fee Paid Upto date is required'),
  officerDateTime: z.string().min(5, 'Officer verification date & time is required'),
  officerUserId: z.string().min(2, 'Officer User ID is required'),
  officerMobileMasked: z.string().min(6, 'Officer masked mobile is required'),
  products: z
    .array(foodProductSchema)
    .min(1, 'At least one Food Product Category is required'),
  licenseHistory: z
    .array(licenseHistoryEntrySchema)
    .min(1, 'At least one License History entry is required'),
  personInCharge: personDetailsSchema,
  personResponsible: personDetailsSchema,
  customOtherConditions: z.array(z.string()),
});

export type FoodProductItem = z.infer<typeof foodProductSchema>;
export type LicenseHistoryEntry = z.infer<typeof licenseHistoryEntrySchema>;
export type PersonDetails = z.infer<typeof personDetailsSchema>;
export type FormCData = z.infer<typeof formCSchema>;

export const SAMPLE_FORM_C_DATA: FormCData = {
  governmentTitle: 'Government of West Bengal',
  departmentTitle: 'Department of Health and Family Welfare',
  licenseTier: 'State License',
  licenseNumber: '12826015000118',
  fboName: 'M/S AAROGYA',
  fboPermanentAddress:
    'Vill- Bajkul ; Post - Kismat Bajkul PS - Bhupatinagar Dist - East Midnapore State - West Bengal Land mark - Bajkul Post office, Purba Medinipur, West Bengal-721655',
  premisesAddress:
    'Vill- Bajkul ; Post - Kismat Bajkul PS - Bhupatinagar Dist - East Midnapore State - West Bengal Land mark - Bajkul Post office, BHAGWANPUR-I, Purba Medinipur, West Bengal-721655',
  kindOfBusiness: 'Trade/Retail - Retailer',
  place: 'Purba Medinipur',
  issuedOn: '2026-08-11',
  feePaidUpto: '2027-08-10',
  officerDateTime: '11-08-2026 13:36:00',
  officerUserId: '106923',
  officerMobileMasked: '94XXXXXX12',
  products: [
    {
      id: 'prod-1',
      foodCategory: '13 - Foodstuffs intended for particular nutritional uses',
    },
  ],
  licenseHistory: [
    {
      id: 'hist-1',
      issuedOn: '2026-08-11',
      feePaidOn: '2026-08-11',
      feePaidUpto: '2027-08-10',
      feePaid: '5000 INR',
      type: 'New',
      issuingAuthority: 'State Licensing Authority',
    },
  ],
  personInCharge: {
    name: 'MANMAY SAMANTA',
    qualification: '12TH PASS',
    contactNo: '8910790375',
    mobileNo: '8910790375',
    emailId: 'legalsuccessindia@gmail.com',
    address:
      'Vill- Bajkul ; Post - Kismat Bajkul PS - Bhupatinagar Dist - East Midnapore State - West Bengal Land mark - Bajkul Post office',
    state: 'West Bengal',
    district: 'Purba Medinipur',
    pinCode: '721655',
    photoIdCard: 'Pan Card',
    photoIdNo: 'IKYPS0888E',
    photoIdExpiryDate: 'N/A',
    fostacNo: 'Not Provided',
  },
  personResponsible: {
    name: 'MANMAY SAMANTA',
    qualification: '12TH PASS',
    contactNo: '8910790375',
    mobileNo: '8910790375',
    emailId: 'legalsuccessindia@gmail.com',
    address:
      'Vill- Bajkul ; Post - Kismat Bajkul PS - Bhupatinagar Dist - East Midnapore State - West Bengal Land mark - Bajkul Post office',
    state: 'West Bengal',
    district: 'Purba Medinipur',
    pinCode: '721655',
    photoIdCard: 'Pan Card',
    photoIdNo: 'IKYPS0888E',
    photoIdExpiryDate: 'N/A',
  },
  customOtherConditions: [],
};

export function createEmptyFormCData(): FormCData {
  return {
    governmentTitle: 'Government of West Bengal',
    departmentTitle: 'Department of Health and Family Welfare',
    licenseTier: 'State License',
    licenseNumber: '',
    fboName: '',
    fboPermanentAddress: '',
    premisesAddress: '',
    kindOfBusiness: 'Trade/Retail - Retailer',
    place: '',
    issuedOn: '2026-08-11',
    feePaidUpto: '2027-08-10',
    officerDateTime: '11-08-2026 13:36:00',
    officerUserId: '',
    officerMobileMasked: '',
    products: [
      {
        id: 'prod-empty-1',
        foodCategory: '13 - Foodstuffs intended for particular nutritional uses',
      },
    ],
    licenseHistory: [
      {
        id: 'hist-empty-1',
        issuedOn: '2026-08-11',
        feePaidOn: '2026-08-11',
        feePaidUpto: '2027-08-10',
        feePaid: '5000 INR',
        type: 'New',
        issuingAuthority: 'State Licensing Authority',
      },
    ],
    personInCharge: {
      name: '',
      qualification: '',
      contactNo: '',
      mobileNo: '',
      emailId: '',
      address: '',
      state: '',
      district: '',
      pinCode: '',
      photoIdCard: 'Pan Card',
      photoIdNo: '',
      photoIdExpiryDate: 'N/A',
      fostacNo: 'Not Provided',
    },
    personResponsible: {
      name: '',
      qualification: '',
      contactNo: '',
      mobileNo: '',
      emailId: '',
      address: '',
      state: '',
      district: '',
      pinCode: '',
      photoIdCard: 'Pan Card',
      photoIdNo: '',
      photoIdExpiryDate: 'N/A',
    },
    customOtherConditions: [],
  };
}

export function formatFssaiDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '—';
  }
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

export function maskEmailForFoscos(email: string): string {
  const clean = (email || '').trim();
  if (clean.length <= 5) return 'xxxxxxxxxxxxxxxxxxxxxxxxxx';
  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-3);
  const middleLen = Math.max(8, clean.length - 5);
  return `${prefix}${'x'.repeat(middleLen)}${suffix}`;
}

export function maskMobileForFoscos(mobile: string): string {
  const digits = (mobile || '').replace(/\s+/g, '');
  if (digits.length < 5) return 'xxxxxxxxxx';
  const prefix = digits.slice(0, 2);
  const suffix = digits.slice(-3);
  return `${prefix}${'x'.repeat(Math.max(4, digits.length - 5))}${suffix}`;
}

export function buildQrPayload(data: FormCData): string {
  return [
    `FSSAI FORM-C`,
    `LIC:${data.licenseNumber || 'PENDING'}`,
    `CAT:${data.licenseTier}`,
    `FBO:${data.fboName || 'UNSPECIFIED'}`,
    `ISSUED:${formatFssaiDate(data.issuedOn)}`,
    `UPTO:${formatFssaiDate(data.feePaidUpto)}`,
  ].join('|');
}

export function sanitizeFilename(name: string, licenseNo: string): string {
  const cleanName = (name || 'FBO')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const cleanLic = (licenseNo || 'DRAFT').replace(/\D/g, '') || 'DRAFT';
  return `FSSAI_Form_C_${cleanLic}_${cleanName || 'License'}.pdf`;
}

export function mergeFormCDraft(raw: unknown): FormCData {
  if (!raw || typeof raw !== 'object') {
    return SAMPLE_FORM_C_DATA;
  }
  const parsed = raw as Partial<FormCData>;
  if (
    !Array.isArray(parsed.products) ||
    !Array.isArray(parsed.licenseHistory) ||
    !parsed.personInCharge ||
    typeof parsed.personInCharge !== 'object'
  ) {
    return SAMPLE_FORM_C_DATA;
  }

  return {
    ...SAMPLE_FORM_C_DATA,
    ...parsed,
    products:
      parsed.products.length > 0 ? parsed.products : SAMPLE_FORM_C_DATA.products,
    licenseHistory:
      parsed.licenseHistory.length > 0
        ? parsed.licenseHistory
        : SAMPLE_FORM_C_DATA.licenseHistory,
    personInCharge: {
      ...SAMPLE_FORM_C_DATA.personInCharge,
      ...parsed.personInCharge,
    },
    personResponsible: {
      ...SAMPLE_FORM_C_DATA.personResponsible,
      ...(parsed.personResponsible && typeof parsed.personResponsible === 'object'
        ? parsed.personResponsible
        : {}),
    },
    customOtherConditions: Array.isArray(parsed.customOtherConditions)
      ? parsed.customOtherConditions
      : SAMPLE_FORM_C_DATA.customOtherConditions,
  };
}

export function syncHistoryDatesWithLicense(
  history: LicenseHistoryEntry[],
  prevIssuedOn: string,
  prevFeePaidUpto: string,
  nextIssuedOn: string,
  nextFeePaidUpto: string
): LicenseHistoryEntry[] {
  if (!Array.isArray(history) || history.length === 0) {
    return history;
  }
  return history.map((entry, idx) => {
    if (idx !== 0) return entry;
    const issuedSynced = entry.issuedOn === prevIssuedOn || history.length === 1;
    const feePaidOnSynced = entry.feePaidOn === prevIssuedOn;
    const feePaidUptoSynced =
      entry.feePaidUpto === prevFeePaidUpto || history.length === 1;
    return {
      ...entry,
      issuedOn: issuedSynced ? nextIssuedOn : entry.issuedOn,
      feePaidOn: feePaidOnSynced ? nextIssuedOn : entry.feePaidOn,
      feePaidUpto: feePaidUptoSynced ? nextFeePaidUpto : entry.feePaidUpto,
    };
  });
}

export const LICENSE_HISTORY_NOTES: string[] = [
  "To keep your License in active status, it is mandatory to pay the annual fee before due date i.e 'Fee paid upto date above'. Kindly login into FSSAI's Food Safety Compliance System ( https://foscos.fssai.gov.in ) with your user id and password for pay the annual fee any time or call us at 1800112100 for any clarification.",
  'Non-payment of annual fee before the due date shall result in suspension of the license. To revoke the suspension, payment within 180 days of the due date may be accepted, subject to applicable penalties as specified by Food Authority. Where the fee remains unpaid beyond 180 days, the license shall be deemed cancelled and a fresh application for license shall be required.',
  'Any food business activity carried out during such suspension period shall be deemed non-compliant of the provision of the FSS Act, 2006 and the regulations shall attract subsequent action including penalty under the FSS Act, 2006',
  "In the event of closure of business, the food business operator shall, within thirty days from the date of such closure, surrender the registration certificate by login into FSSAI's Food Safet Compliance System(https://foscos.fssai.gov.in) with your user id and password.",
  'Modification* (if any) denotes the change in the Authority. Issuing Authority mentioned along with Modification* is the Jurisdictional Authority with effect from the date of issuance of modified license.',
];

export const PAGE_6_CONDITIONS: string[] = [
  'Display a true copy of the license granted in Form C shall at all time at a prominent place in the premises.',
  'Give necessary access to licensing authorities or their authorized personnel to the premises.',
  'Inform authorities about any change or modifications in activities.',
  'Employ at least one technical person to supervise the production process. The person supervising the production process shall possess at least a degree in science with Chemistry/ Bio- chemistry/ Food and nutrition/ Microbiology or a degree or diploma in Food Technology/ Dairy Technology/ Dairy Microbiology/ Dairy chemistry/ Dairy engineering/ Oil technology/ Veterinary science / Hotel management & Catering technology or any degree or diploma in any other discipline related to the specific requirement of the business from a recognized university or institute or equivalent.',
  'Furnish periodic annual return 1st April to 31 st March, with in 31 st May of each year. For collection/ handling/manufacturing of milk and milk product half yearly return also to be furnished as specified.',
  'Ensure that no product other than the product indicated in the license / registration is produced in the unit.',
  "Maintain factory's sanitary and hygienic standards and workers hygiene as specified in the schedule-4 according to the category of food business.",
  'Maintain daily records of production, raw materials utilization and sales separately.',
  'Ensure that the source and standards of raw material used are of optimum quality.',
  'Food business operator shall not manufacture , store or expose for sale or permit the sale of any article of food in any premises not effectively separated to the satisfaction of the licensing authority from any privy, urine, sullage ,drain or place of storage of foul and waste matter',
  'Ensure clean-in-place system (whatever necessary) for regular cleaning of machine & equipment.',
  'Ensure testing of relevant chemical and/or microbiological contaminants in food products in accordance with these regulation as frequency as required on the basis of historical data and risk assessment to ensure production and delivery of safe food through own or NABLaccredited/ FSSAI recognized labs atleast once in six month.',
  'Ensure that as much as possible the required temperature shall be maintained throughout the supply chain from the place of procurement or sourcing till it reaches the end consumer including chilling, transportation, storage etc.',
  'The Manufacturer/ Importer/ Distributer shall buy and sell food products only from, or to , licensed / registered vendors and maintain record thereof.',
];

export const PAGE_7_OTHER_CONDITIONS = [
  {
    num: 1,
    text: 'Proprietors of hotels, restaurants and other food stalls who sell or expose for sale savouries, sweets or other article of food shall put up a notice board containing separates lists of the articles which have been cooked in ghee, edible oil, vanaspati and other fats for the information of the intending purchasers.',
  },
  {
    num: 2,
    text: 'Food business operator selling cooked or prepared food shall display a notice board containing the nature of articles being exposed for sale.',
  },
  {
    num: 3,
    text: 'Every manufacturer (including ghani operator) or wholesale dealer in butter ,ghee ,vanaspti ,edible oils, solvent extracted oil, de oiled meal, edible flour and any other fats shall maintain a register showing the quantity of manufactured, received or sold, nature of oil seed used and quantity of de oiled meal and edible flour used etc. as applicable and the destination of each consignment of the substances sent out from his factory or place of business, and shall present such register for inspection whenever required to do so by the licensing authority.',
  },
  {
    num: 4,
    text: 'No producer or manufacturer or vegetable oil ,edible oil and their products shall be eligible for license under this act ,unless he has own laboratory facility for analytical testing of samples',
  },
  {
    num: 5,
    text: "Every sale and movement of stocks of solvents- extracted oil ,'semi refined' or 'raw grade I' , edible groundnut flour or edible coconut flour ,or both by the producer shall be a sale or movement of stocks directly to a registered user and not to any other person ,and no such sale or movement shall be effected through any third party.",
  },
  {
    num: 6,
    text: 'Every quantity of solvent-extracted oil ,edible groundnut flour or edible coconut flour ,or both purchased by a registered user shall be used by him in his own factory entirely for the purpose intended and shall not be re-sold or otherwise transferred to any other person :\nProvided that nothing in this sub-clause shall apply to the sale or movement of the following:-',
    subItems: [
      'Karanjia oil',
      'Kusum oil',
      'Mahua oil',
      'Neem oil',
      'Tamarind seed oil',
      'Edible groundnut flour bearing the I.S.I certification mark',
      'Edible coconut flour bearing the I.S.I certificate mark',
    ],
  },
  {
    num: 7,
    text: 'No food business operator shall sell or distribute or offer for sale or dispatch or deliver to any person for purpose of sale any edible oil which is not packed, marked and labeled in the manner specified in the regulations unless specifically exempted from this condition vide notification in the official Gazette issued in the public interest by food safety commissioners in specific circumstances and for a specific period and for reason to be recorded in writing.',
  },
];
