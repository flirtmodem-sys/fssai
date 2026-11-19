import React, { useState } from 'react';
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
} from 'react-hook-form';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BUSINESS_KINDS,
  FOOD_CATEGORIES,
  FormCData,
  LICENSE_TIERS,
  syncHistoryDatesWithLicense,
} from '../schemas/formCSchema';

export type StudioSectionId = 'license' | 'premises' | 'products' | 'authority';

interface FormCStudioProps {
  activeSection: StudioSectionId;
  onSectionChange: (section: StudioSectionId) => void;
  register: UseFormRegister<FormCData>;
  control: Control<FormCData>;
  errors: FieldErrors<FormCData>;
  watch: UseFormWatch<FormCData>;
  setValue: UseFormSetValue<FormCData>;
  onLoadSample: () => void;
  onClearForm: () => void;
  lastSavedText: string;
  isValid: boolean;
}

const SECTIONS: { id: StudioSectionId; short: string }[] = [
  { id: 'license', short: '01. License' },
  { id: 'premises', short: '02. Premises' },
  { id: 'products', short: '03. Annexures' },
  { id: 'authority', short: '04. Persons' },
];

export const FormCStudio: React.FC<FormCStudioProps> = ({
  activeSection,
  onSectionChange,
  register,
  control,
  errors,
  watch,
  setValue,
  onLoadSample,
  onClearForm,
  lastSavedText,
  isValid,
}) => {
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: 'products',
  });

  const {
    fields: historyFields,
    append: appendHistory,
    remove: removeHistory,
  } = useFieldArray({
    control,
    name: 'licenseHistory',
  });

  const [newConditionText, setNewConditionText] = useState('');
  const customConditions = watch('customOtherConditions') || [];

  const handleAddCondition = () => {
    const trimmed = newConditionText.trim();
    if (!trimmed) return;
    setValue('customOtherConditions', [...customConditions, trimmed], {
      shouldValidate: true,
      shouldDirty: true,
    });
    setNewConditionText('');
  };

  const handleRemoveCondition = (index: number) => {
    const updated = customConditions.filter((_, idx) => idx !== index);
    setValue('customOtherConditions', updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCopyPermanentToPremises = () => {
    setValue('premisesAddress', watch('fboPermanentAddress'), {
      shouldValidate: true,
    });
  };

  const handleCopyInChargeToResponsible = () => {
    const src = watch('personInCharge');
    setValue(
      'personResponsible',
      {
        name: src.name,
        qualification: src.qualification,
        contactNo: src.contactNo,
        mobileNo: src.mobileNo,
        emailId: src.emailId,
        address: src.address,
        state: src.state,
        district: src.district,
        pinCode: src.pinCode,
        photoIdCard: src.photoIdCard,
        photoIdNo: src.photoIdNo,
        photoIdExpiryDate: src.photoIdExpiryDate,
      },
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const issuedOnRegister = register('issuedOn');
  const feePaidUptoRegister = register('feePaidUpto');

  const handleIssuedOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevIssuedOn = watch('issuedOn');
    const prevFeePaidUpto = watch('feePaidUpto');
    const nextIssuedOn = e.target.value;
    issuedOnRegister.onChange(e);
    const currentHistory = watch('licenseHistory') || [];
    const synced = syncHistoryDatesWithLicense(
      currentHistory,
      prevIssuedOn,
      prevFeePaidUpto,
      nextIssuedOn,
      prevFeePaidUpto
    );
    if (synced !== currentHistory) {
      setValue('licenseHistory', synced, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleFeePaidUptoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prevIssuedOn = watch('issuedOn');
    const prevFeePaidUpto = watch('feePaidUpto');
    const nextFeePaidUpto = e.target.value;
    feePaidUptoRegister.onChange(e);
    const currentHistory = watch('licenseHistory') || [];
    const synced = syncHistoryDatesWithLicense(
      currentHistory,
      prevIssuedOn,
      prevFeePaidUpto,
      prevIssuedOn,
      nextFeePaidUpto
    );
    if (synced !== currentHistory) {
      setValue('licenseHistory', synced, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleSyncHistoryRowDates = (idx: number) => {
    const licIssued = watch('issuedOn');
    const licUpto = watch('feePaidUpto');
    setValue(`licenseHistory.${idx}.issuedOn`, licIssued, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`licenseHistory.${idx}.feePaidOn`, licIssued, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`licenseHistory.${idx}.feePaidUpto`, licUpto, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const errorCount = Object.keys(errors).length;

  return (
    <section
      aria-label="Form C Data Collection Studio"
      className="flex flex-col h-full bg-white border-r border-slate-200"
    >
      {/* Utility Toolbar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {isValid ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Schema Valid</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorCount} section(s) need input</span>
            </span>
          )}
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="tabular-nums text-slate-500">{lastSavedText}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={onClearForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear Draft</span>
          </button>
        </div>
      </div>

      {/* Section Stepper Tabs */}
      <div
        role="tablist"
        aria-label="Form C Sections"
        className="px-3 sm:px-4 py-2.5 border-b border-slate-200 bg-white grid grid-cols-4 gap-1"
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSectionChange(sec.id)}
              className={`px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap text-center truncate cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {sec.short}
            </button>
          );
        })}
      </div>

      {/* Scrollable Form Fields Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {activeSection === 'license' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Header, License Number &amp; Validity
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Populates the official Form C certificate header across Pages 1, 3, 4, and 5.
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Category of License
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                {LICENSE_TIERS.map((tier) => {
                  const active = watch('licenseTier') === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() =>
                        setValue('licenseTier', tier, { shouldValidate: true })
                      }
                      className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="licenseNumber"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                14-Digit License Number *
              </label>
              <input
                id="licenseNumber"
                type="text"
                maxLength={14}
                placeholder="12826015000118"
                {...register('licenseNumber')}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.licenseNumber && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.licenseNumber.message}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="governmentTitle"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Government Heading *
                </label>
                <input
                  id="governmentTitle"
                  type="text"
                  {...register('governmentTitle')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {errors.governmentTitle && (
                  <p className="mt-1 text-xs text-red-600">{errors.governmentTitle.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="departmentTitle"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Department Heading *
                </label>
                <input
                  id="departmentTitle"
                  type="text"
                  {...register('departmentTitle')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {errors.departmentTitle && (
                  <p className="mt-1 text-xs text-red-600">{errors.departmentTitle.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="kindOfBusiness"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Kind of Business *
              </label>
              <input
                id="kindOfBusiness"
                list="business-kind-presets"
                type="text"
                {...register('kindOfBusiness')}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <datalist id="business-kind-presets">
                {BUSINESS_KINDS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              {errors.kindOfBusiness && (
                <p className="mt-1 text-xs text-red-600">{errors.kindOfBusiness.message}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="place"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Place *
                </label>
                <input
                  id="place"
                  type="text"
                  {...register('place')}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {errors.place && (
                  <p className="mt-1 text-xs text-red-600">{errors.place.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="issuedOn"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Issued On *
                </label>
                <input
                  id="issuedOn"
                  type="date"
                  {...issuedOnRegister}
                  onChange={handleIssuedOnChange}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {errors.issuedOn && (
                  <p className="mt-1 text-xs text-red-600">{errors.issuedOn.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="feePaidUpto"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Fee Paid Upto *
                </label>
                <input
                  id="feePaidUpto"
                  type="date"
                  {...feePaidUptoRegister}
                  onChange={handleFeePaidUptoChange}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {errors.feePaidUpto && (
                  <p className="mt-1 text-xs text-red-600">{errors.feePaidUpto.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'premises' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                02. Licensee &amp; Authorized Premises
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Items 1 and 2 on Page 1 Form C Certificate.
              </p>
            </div>

            <div>
              <label
                htmlFor="fboName"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Name of Licensee / FBO *
              </label>
              <input
                id="fboName"
                type="text"
                placeholder="M/S AAROGYA"
                {...register('fboName')}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.fboName && (
                <p className="mt-1 text-xs text-red-600">{errors.fboName.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fboPermanentAddress"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Registered Office Address *
              </label>
              <textarea
                id="fboPermanentAddress"
                rows={3}
                {...register('fboPermanentAddress')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.fboPermanentAddress && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.fboPermanentAddress.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="premisesAddress"
                  className="block text-xs font-medium text-slate-700"
                >
                  Address of Authorized Premises *
                </label>
                <button
                  type="button"
                  onClick={handleCopyPermanentToPremises}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Copy Registered Address
                </button>
              </div>
              <textarea
                id="premisesAddress"
                rows={3}
                {...register('premisesAddress')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.premisesAddress && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.premisesAddress.message}
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'products' && (
          <div className="space-y-6">
            {/* Page 3: Product Annexure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    03. Product Annexure (Page 3)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Food Product Categories listed in Page 3 table.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendProduct({
                      id: `prod-${Date.now()}`,
                      foodCategory: FOOD_CATEGORIES[0],
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <datalist id="food-category-presets">
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              {productFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`product-category-${index}`}
                      className="text-xs font-semibold text-slate-700 tabular-nums"
                    >
                      Sl.No. {index + 1}
                    </label>
                    {productFields.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove product line ${index + 1}`}
                        onClick={() => removeProduct(index)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <input
                    id={`product-category-${index}`}
                    list="food-category-presets"
                    type="text"
                    placeholder="Select or type Food Product Category..."
                    aria-label={`Food Product Category ${index + 1}`}
                    {...register(`products.${index}.foodCategory`)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {errors.products?.[index]?.foodCategory && (
                    <p className="text-xs text-red-600">
                      {errors.products[index]?.foodCategory?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Page 4: License History Annexure */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    License History Annexure (Page 4)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fee &amp; issuance log rows shown on Page 4.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendHistory({
                      id: `hist-${Date.now()}`,
                      issuedOn: watch('issuedOn'),
                      feePaidOn: watch('issuedOn'),
                      feePaidUpto: watch('feePaidUpto'),
                      feePaid: '5000 INR',
                      type: 'Renewal',
                      issuingAuthority: 'State Licensing Authority',
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add History</span>
                </button>
              </div>

              {historyFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      History Row #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSyncHistoryRowDates(idx)}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Sync License Dates
                      </button>
                      {historyFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHistory(idx)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor={`history-issued-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Issued On
                      </label>
                      <input
                        id={`history-issued-${idx}`}
                        type="date"
                        {...register(`licenseHistory.${idx}.issuedOn`)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`history-paid-on-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Fee Paid On
                      </label>
                      <input
                        id={`history-paid-on-${idx}`}
                        type="date"
                        {...register(`licenseHistory.${idx}.feePaidOn`)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`history-paid-upto-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Fee Paid Upto
                      </label>
                      <input
                        id={`history-paid-upto-${idx}`}
                        type="date"
                        {...register(`licenseHistory.${idx}.feePaidUpto`)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor={`history-fee-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Fee Paid
                      </label>
                      <input
                        id={`history-fee-${idx}`}
                        type="text"
                        {...register(`licenseHistory.${idx}.feePaid`)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                      {errors.licenseHistory?.[idx]?.feePaid && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {errors.licenseHistory[idx]?.feePaid?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`history-type-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Type
                      </label>
                      <input
                        id={`history-type-${idx}`}
                        type="text"
                        {...register(`licenseHistory.${idx}.type`)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                      {errors.licenseHistory?.[idx]?.type && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {errors.licenseHistory[idx]?.type?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`history-authority-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Issuing Authority
                      </label>
                      <input
                        id={`history-authority-${idx}`}
                        type="text"
                        {...register(`licenseHistory.${idx}.issuingAuthority`)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      />
                      {errors.licenseHistory?.[idx]?.issuingAuthority && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {errors.licenseHistory[idx]?.issuingAuthority?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'authority' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                04. Non-Form C Persons &amp; Designated Officer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Populates Page 2 masked communications, Page 5 Non-Form C Annexure, and Page 1 Officer Stamp.
              </p>
            </div>

            {/* Designated Officer Verification */}
            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
              <div className="text-xs font-semibold text-slate-800">
                Designated Officer Verification (Pages 1 &amp; 5)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label
                    htmlFor="officerDateTime"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Date &amp; Time *
                  </label>
                  <input
                    id="officerDateTime"
                    type="text"
                    {...register('officerDateTime')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.officerDateTime && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.officerDateTime.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="officerUserId"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    User Id *
                  </label>
                  <input
                    id="officerUserId"
                    type="text"
                    {...register('officerUserId')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.officerUserId && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.officerUserId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="officerMobileMasked"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Verified Mobile *
                  </label>
                  <input
                    id="officerMobileMasked"
                    type="text"
                    {...register('officerMobileMasked')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.officerMobileMasked && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.officerMobileMasked.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Person in Charge of Operations */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-800">
                Person in Charge of Operations (Page 5)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="pic-name"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="pic-name"
                    type="text"
                    {...register('personInCharge.name')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.name && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-qualification"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Qualification *
                  </label>
                  <input
                    id="pic-qualification"
                    type="text"
                    {...register('personInCharge.qualification')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.qualification && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.qualification.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-contactNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Contact No *
                  </label>
                  <input
                    id="pic-contactNo"
                    type="text"
                    {...register('personInCharge.contactNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.contactNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.contactNo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-mobileNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Mobile No *
                  </label>
                  <input
                    id="pic-mobileNo"
                    type="text"
                    {...register('personInCharge.mobileNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.mobileNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.mobileNo.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="pic-emailId"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Email-ID *
                  </label>
                  <input
                    id="pic-emailId"
                    type="email"
                    {...register('personInCharge.emailId')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.emailId && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.emailId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-photoIdCard"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id Card *
                  </label>
                  <input
                    id="pic-photoIdCard"
                    type="text"
                    {...register('personInCharge.photoIdCard')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.photoIdCard && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.photoIdCard.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-photoIdNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id No *
                  </label>
                  <input
                    id="pic-photoIdNo"
                    type="text"
                    {...register('personInCharge.photoIdNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.photoIdNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.photoIdNo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-photoIdExpiryDate"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id Expiry Date *
                  </label>
                  <input
                    id="pic-photoIdExpiryDate"
                    type="text"
                    placeholder="N/A or DD-MM-YYYY"
                    {...register('personInCharge.photoIdExpiryDate')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.photoIdExpiryDate && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.photoIdExpiryDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-fostacNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    FoSTaC No
                  </label>
                  <input
                    id="pic-fostacNo"
                    type="text"
                    placeholder="Not Provided"
                    {...register('personInCharge.fostacNo')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pic-state"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    State *
                  </label>
                  <input
                    id="pic-state"
                    type="text"
                    {...register('personInCharge.state')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.state && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.state.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-district"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    District *
                  </label>
                  <input
                    id="pic-district"
                    type="text"
                    {...register('personInCharge.district')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.district && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.district.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="pic-pinCode"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Pin Code *
                  </label>
                  <input
                    id="pic-pinCode"
                    type="text"
                    maxLength={6}
                    {...register('personInCharge.pinCode')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.pinCode && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.pinCode.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="pic-address"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Address *
                  </label>
                  <input
                    id="pic-address"
                    type="text"
                    {...register('personInCharge.address')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personInCharge?.address && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personInCharge.address.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Person Responsible (Form IX) */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Person Responsible (Form IX) (Page 5)
                </span>
                <button
                  type="button"
                  onClick={handleCopyInChargeToResponsible}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Same as Person in Charge
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="resp-name"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="resp-name"
                    type="text"
                    {...register('personResponsible.name')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.name && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-qualification"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Qualification *
                  </label>
                  <input
                    id="resp-qualification"
                    type="text"
                    {...register('personResponsible.qualification')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.qualification && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.qualification.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-contactNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Contact No *
                  </label>
                  <input
                    id="resp-contactNo"
                    type="text"
                    {...register('personResponsible.contactNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.contactNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.contactNo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-mobileNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Mobile No *
                  </label>
                  <input
                    id="resp-mobileNo"
                    type="text"
                    {...register('personResponsible.mobileNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.mobileNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.mobileNo.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="resp-emailId"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Email-ID *
                  </label>
                  <input
                    id="resp-emailId"
                    type="email"
                    {...register('personResponsible.emailId')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.emailId && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.emailId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-photoIdCard"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id Card *
                  </label>
                  <input
                    id="resp-photoIdCard"
                    type="text"
                    {...register('personResponsible.photoIdCard')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.photoIdCard && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.photoIdCard.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-photoIdNo"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id No *
                  </label>
                  <input
                    id="resp-photoIdNo"
                    type="text"
                    {...register('personResponsible.photoIdNo')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.photoIdNo && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.photoIdNo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-photoIdExpiryDate"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Photo Id Expiry Date *
                  </label>
                  <input
                    id="resp-photoIdExpiryDate"
                    type="text"
                    placeholder="N/A or DD-MM-YYYY"
                    {...register('personResponsible.photoIdExpiryDate')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.photoIdExpiryDate && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.photoIdExpiryDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-pinCode"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Pin Code *
                  </label>
                  <input
                    id="resp-pinCode"
                    type="text"
                    maxLength={6}
                    {...register('personResponsible.pinCode')}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.pinCode && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.pinCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-state"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    State *
                  </label>
                  <input
                    id="resp-state"
                    type="text"
                    {...register('personResponsible.state')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.state && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.state.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="resp-district"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    District *
                  </label>
                  <input
                    id="resp-district"
                    type="text"
                    {...register('personResponsible.district')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.district && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.district.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="resp-address"
                    className="block text-[11px] font-medium text-slate-600 mb-1"
                  >
                    Address *
                  </label>
                  <input
                    id="resp-address"
                    type="text"
                    {...register('personResponsible.address')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                  {errors.personResponsible?.address && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.personResponsible.address.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Extra Other Conditions for Page 7 */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <label
                htmlFor="newCustomCondition"
                className="block text-xs font-semibold text-slate-800"
              >
                Additional Other Conditions (Page 7)
              </label>
              <div className="flex gap-2">
                <input
                  id="newCustomCondition"
                  type="text"
                  value={newConditionText}
                  onChange={(e) => setNewConditionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCondition();
                    }
                  }}
                  placeholder="Optional extra clause after item 7..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Add Clause
                </button>
              </div>
              {customConditions.length > 0 && (
                <ul className="space-y-1.5">
                  {customConditions.map((cond, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2 border border-slate-200 rounded bg-slate-50 text-xs text-slate-700"
                    >
                      <span>
                        <strong>{idx + 8}.</strong> {cond}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label={`Delete condition ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
