import React from 'react';
import {
  FormCData,
  LICENSE_HISTORY_NOTES,
  PAGE_6_CONDITIONS,
  PAGE_7_OTHER_CONDITIONS,
  PersonDetails,
  buildQrPayload,
  formatFssaiDate,
  maskEmailForFoscos,
  maskMobileForFoscos,
} from '../schemas/formCSchema';
import {
  DesignatedOfficerBlock,
  FssaiOfficialLogoImg,
  GovtEmblemImg,
} from './OfficialEmblems';
import { QrCodeBlock } from './QrCodeBlock';

interface FormCA4ReplicaProps {
  data: FormCData;
  zoomPercent: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onJumpToPage?: (pageNum: number) => void;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1122;

const pageOuterStyle: React.CSSProperties = {
  width: `${A4_WIDTH_PX}px`,
  minHeight: `${A4_HEIGHT_PX}px`,
  height: `${A4_HEIGHT_PX}px`,
  backgroundColor: '#ffffff',
  color: '#000000',
  padding: '16px',
  boxSizing: 'border-box',
  fontFamily: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const pageBorderBoxStyle: React.CSSProperties = {
  border: '1px solid #000000',
  flex: 1,
  padding: '22px 26px 14px 26px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const OfficialHeaderRow: React.FC<{
  data: FormCData;
  topLabel?: string;
}> = ({ data, topLabel }) => (
  <div>
    {topLabel && (
      <div
        style={{
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '10px',
          color: '#000000',
        }}
      >
        {topLabel}
      </div>
    )}
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ width: '150px', display: 'flex', justifyContent: 'flex-start', paddingTop: '2px' }}>
        <FssaiOfficialLogoImg style={{ width: '142px', height: '91px' }} />
      </div>

      <div
        style={{
          flex: 1,
          textAlign: 'center',
          color: '#000000',
          lineHeight: 1.32,
        }}
      >
        <div style={{ fontSize: '14.5px', fontWeight: 700 }}>Form C</div>
        <div style={{ fontSize: '14.5px', fontWeight: 700 }}>
          {data.governmentTitle || 'Government of West Bengal'}
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '1px' }}>
          {data.departmentTitle || 'Department of Health and Family Welfare'}
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '1px' }}>
          Food Safety and Standards Authority of India
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '1px' }}>
          License under FSS Act, 2006
        </div>
      </div>

      <div style={{ width: '150px', display: 'flex', justifyContent: 'flex-end' }}>
        <GovtEmblemImg style={{ width: '132px', height: '106px' }} />
      </div>
    </div>
  </div>
);

const PageNumberFooter: React.FC<{ page: number }> = ({ page }) => (
  <div
    style={{
      textAlign: 'center',
      fontSize: '12px',
      color: '#000000',
      paddingTop: '8px',
    }}
  >
    Page {page} of 7
  </div>
);

const PersonDetailsGrid: React.FC<{
  person: PersonDetails;
  includeFostac?: boolean;
}> = ({ person, includeFostac = false }) => {
  const labelStyle: React.CSSProperties = {
    padding: '3.5px 8px 4.5px 10px',
    fontSize: '10.5px',
    lineHeight: 1.35,
    verticalAlign: 'top',
    color: '#000000',
    whiteSpace: 'nowrap',
  };
  const valueStyle: React.CSSProperties = {
    padding: '3.5px 8px 4.5px 8px',
    fontSize: '10.5px',
    verticalAlign: 'top',
    color: '#000000',
    lineHeight: 1.35,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  };

  return (
    <table
      style={{
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        marginTop: '4px',
        marginBottom: '6px',
      }}
    >
      <tbody>
        <tr>
          <td style={{ ...labelStyle, width: '14%' }}>Name:</td>
          <td style={{ ...valueStyle, width: '36%' }}>{person.name || '—'}</td>
          <td style={{ ...labelStyle, width: '18%' }}>Qualification:</td>
          <td style={{ ...valueStyle, width: '32%' }}>{person.qualification || '—'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>
            Contact
            <br />
            No:
          </td>
          <td style={valueStyle}>{person.contactNo || '—'}</td>
          <td style={labelStyle}>Mobile No:</td>
          <td style={valueStyle}>{person.mobileNo || '—'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>Email-ID:</td>
          <td colSpan={3} style={valueStyle}>
            {person.emailId || '—'}
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>Address :</td>
          <td colSpan={3} style={valueStyle}>
            {person.address || '—'}
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>State:</td>
          <td style={valueStyle}>{person.state || '—'}</td>
          <td style={labelStyle}>District:</td>
          <td style={valueStyle}>{person.district || '—'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>Pin Code:</td>
          <td style={valueStyle}>{person.pinCode || '—'}</td>
          <td style={labelStyle}>Photo Id Card:</td>
          <td style={valueStyle}>{person.photoIdCard || '—'}</td>
        </tr>
        <tr>
          <td style={labelStyle}>
            Photo Id
            <br />
            No:
          </td>
          <td style={valueStyle}>{person.photoIdNo || '—'}</td>
          <td style={labelStyle}>Photo Id Expiry Date:</td>
          <td style={valueStyle}>{person.photoIdExpiryDate || 'N/A'}</td>
        </tr>
        {includeFostac && (
          <tr>
            <td style={labelStyle}>FoSTaC No:</td>
            <td colSpan={3} style={valueStyle}>
              {person.fostacNo || 'Not Provided'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export const FormCA4Replica: React.FC<FormCA4ReplicaProps> = ({
  data,
  zoomPercent,
  containerRef,
  onJumpToPage,
}) => {
  const scale = zoomPercent / 100;
  const qrPayload = buildQrPayload(data);
  const issuedOnStr = formatFssaiDate(data.issuedOn);
  const feePaidUptoStr = formatFssaiDate(data.feePaidUpto);

  const maskedEmail1 = maskEmailForFoscos(data.personInCharge.emailId);
  const maskedEmail2 = maskEmailForFoscos(data.personResponsible.emailId);
  const maskedMob1 = maskMobileForFoscos(data.personInCharge.mobileNo);
  const maskedMob2 = maskMobileForFoscos(data.personResponsible.mobileNo);

  const linkButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#1d4ed8',
    textDecoration: 'underline',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '100%',
        width: 'fit-content',
      }}
    >
      <div
        style={{
          width: `${A4_WIDTH_PX * scale}px`,
          transition: 'width 150ms ease',
        }}
      >
        <div
          ref={containerRef}
          className="fssai-pdf-root"
          style={{
            width: `${A4_WIDTH_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* ================= PAGE 1 OF 7 ================= */}
          <article id="form-c-page-1" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <OfficialHeaderRow data={data} />

                {/* License Number + QR Code Row */}
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '18px',
                  }}
                >
                  <div style={{ textAlign: 'center', paddingLeft: '64px' }}>
                    <div style={{ fontSize: '12px', color: '#000000' }}>
                      अनुज्ञप्ति संख्या / License Number:{' '}
                      <strong
                        style={{
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          marginLeft: '4px',
                        }}
                      >
                        {data.licenseNumber || '00000000000000'}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        marginTop: '4px',
                        color: '#000000',
                      }}
                    >
                      ({data.licenseTier})
                    </div>
                  </div>
                  <QrCodeBlock payload={qrPayload} size={76} />
                </div>

                {/* 4 Numbered Rows */}
                <table
                  style={{
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    marginTop: '12px',
                    fontSize: '13.8px',
                    lineHeight: 1.38,
                    color: '#000000',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: '48%', padding: '4px 14px 4px 0', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>1.</span>
                          <span>
                            Name &amp; Registered Office address of Licensee / अनुज्ञप्तिधारी के
                            पंजीकृत कार्यालय का नाम और पता:
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          width: '52%',
                          padding: '4px 0',
                          verticalAlign: 'top',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        <div>{data.fboName || '—'}</div>
                        <div style={{ marginTop: '1px' }}>{data.fboPermanentAddress || '—'}</div>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '6px 14px 4px 0', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>2.</span>
                          <span>
                            Address of Authorized Premises / प्राधिकृत परिसरो का पता:
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '6px 0 4px 0',
                          verticalAlign: 'top',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        {data.premisesAddress || '—'}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '5px 14px 4px 0', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>3.</span>
                          <span>Kind of Business / कारोबार का प्रकार:</span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '5px 0 4px 0',
                          verticalAlign: 'top',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        {data.kindOfBusiness || '—'}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '5px 14px 4px 0', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span>4.</span>
                          <span>Category of License / अनुज्ञप्ति का वर्ग:</span>
                        </div>
                      </td>
                      <td style={{ padding: '5px 0 4px 0', verticalAlign: 'top', fontWeight: 700 }}>
                        {data.licenseTier}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Statutory Bilingual Sentence */}
                <p
                  style={{
                    marginTop: '10px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    lineHeight: 1.42,
                    color: '#000000',
                  }}
                >
                  This license is granted under and is subject to the provisions of FSS Act, 2006
                  all of which must be complied with by the licensee. / यह अनुज्ञप्ति खाद्य संरक्षा
                  और मानक अधिनियम, 2006 के अधीन अनुदत्त की गई और वह अधिनियम के उपबंधो के अध्यादीन है
                  जिनका अनुज्ञप्तिधारी द्वारा अवश्य पालन किया जाना चाहिए.
                </p>

                {/* Place / Issued On / Fee Paid Upto + Designated Officer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginTop: '10px',
                  }}
                >
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      width: '49%',
                      fontSize: '13.5px',
                      lineHeight: 1.4,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ width: '48%', padding: '3px 8px 3px 0', verticalAlign: 'top' }}>
                          Place / स्थान:
                        </td>
                        <td
                          style={{
                            padding: '3px 0',
                            verticalAlign: 'top',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {data.place || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 8px 3px 0', verticalAlign: 'top' }}>
                          Issued On / दिनांक:
                        </td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' }}>
                          {issuedOnStr}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 8px 3px 0', verticalAlign: 'top' }}>
                          Fee Paid Upto: / भुगतान फीस तिथि की वैधता:
                        </td>
                        <td
                          style={{
                            padding: '3px 0',
                            verticalAlign: 'top',
                            fontVariantNumeric: 'tabular-nums',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {feePaidUptoStr} (For details, refer Annexure)
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <DesignatedOfficerBlock
                    dateTime={data.officerDateTime}
                    userId={data.officerUserId}
                    mobileMasked={data.officerMobileMasked}
                    fontSize="13px"
                    titleFontSize="14px"
                    minWidth="312px"
                    labelWidth="162px"
                  />
                </div>

                {/* Annexures + Food Safety Connect App QR Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginTop: '16px',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>
                      Annexures:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => onJumpToPage?.(3)}
                        style={linkButtonStyle}
                      >
                        1. Product Annexure
                      </button>
                      <button
                        type="button"
                        onClick={() => onJumpToPage?.(4)}
                        style={linkButtonStyle}
                      >
                        2. License History Annexure
                      </button>
                      <button
                        type="button"
                        onClick={() => onJumpToPage?.(5)}
                        style={linkButtonStyle}
                      >
                        3. Non-Form C Annexure
                      </button>
                      <button
                        type="button"
                        onClick={() => onJumpToPage?.(6)}
                        style={linkButtonStyle}
                      >
                        4. Conditions Of License
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', paddingRight: '18px' }}>
                    <div style={{ fontSize: '10px', marginBottom: '6px', color: '#000000' }}>
                      To download &lsquo;Food Safety Connect&rsquo; App, Scan the below QR
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '56px' }}>
                      <QrCodeBlock
                        payload="https://play.google.com/store/apps/details?id=com.fssai.foscos"
                        size={86}
                        caption="Android"
                      />
                      <QrCodeBlock
                        payload="https://apps.apple.com/in/app/food-safety-connect/id1496894024"
                        size={86}
                        caption="iOS"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Notes 1 & 2 */}
                <div style={{ marginTop: '18px', fontSize: '10.8px', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Note:</div>
                  <div style={{ display: 'flex', gap: '10px', fontWeight: 700, marginBottom: '8px' }}>
                    <span>1.</span>
                    <span>
                      To keep your License in active status, it is mandatory to pay the annual fee
                      before due date i.e &lsquo;Fee paid upto date above&rsquo;. Kindly login into
                      FSSAI&rsquo;s Food Safety Compliance System ({' '}
                      <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
                        https://foscos.fssai.gov.in
                      </span>{' '}
                      ) with your user id and password for pay the annual fee any time or call us at
                      1800112100 for any clarification.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontWeight: 700 }}>
                    <span>2.</span>
                    <span>
                      This License is only to commence or carry on food businesses and not for any
                      other purpose.
                    </span>
                  </div>
                </div>
              </div>

              <PageNumberFooter page={1} />
            </div>
          </article>

          {/* ================= PAGE 2 OF 7 ================= */}
          <article id="form-c-page-2" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div style={{ paddingTop: '12px', fontSize: '11.2px', lineHeight: 1.5, fontWeight: 700 }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <span>3.</span>
                  <span>
                    This is computer generated license and doesn&rsquo;t require any signature or
                    stamp by authority.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span>4.</span>
                  <span>
                    Communications from FoSCoS are being sent to {maskedEmail1} , {maskedEmail2} and{' '}
                    {maskedMob1} , {maskedMob2}.To update these details, visit FoSCoS portal.
                  </span>
                </div>
              </div>

              <PageNumberFooter page={2} />
            </div>
          </article>

          {/* ================= PAGE 3 OF 7: PRODUCT ANNEXURE ================= */}
          <article id="form-c-page-3" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <OfficialHeaderRow data={data} topLabel="Product Annexure" />

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '14px',
                    fontSize: '11.5px',
                  }}
                >
                  अनुज्ञप्ति संख्या / License Number:{' '}
                  <strong style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}>
                    {data.licenseNumber || '00000000000000'}
                  </strong>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '18px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  Kind Of Business: {data.kindOfBusiness || '—'}
                </div>

                <table
                  style={{
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '11.5px',
                    lineHeight: 1.35,
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#d9d9d9' }}>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 8px 8px 8px',
                          width: '72px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          fontWeight: 700,
                        }}
                      >
                        Sl.No.
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 10px 8px 10px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          fontWeight: 700,
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        Food Product Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((prod, idx) => (
                      <tr key={prod.id}>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 8px 8px 8px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 12px 8px 12px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {prod.foodCategory}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PageNumberFooter page={3} />
            </div>
          </article>

          {/* ================= PAGE 4 OF 7: LICENSE HISTORY ANNEXURE ================= */}
          <article id="form-c-page-4" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <OfficialHeaderRow data={data} topLabel="License History Annexure" />

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '14px',
                    fontSize: '11.5px',
                  }}
                >
                  अनुज्ञप्ति संख्या / License Number:{' '}
                  <strong style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}>
                    {data.licenseNumber || '00000000000000'}
                  </strong>
                </div>

                <table
                  style={{
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    marginTop: '10px',
                    fontSize: '10.8px',
                    lineHeight: 1.35,
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#d9d9d9' }}>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '15%',
                        }}
                      >
                        Issued On
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '15%',
                        }}
                      >
                        Fee Paid On
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '16%',
                        }}
                      >
                        Fee Paid Upto
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '14%',
                        }}
                      >
                        Fee Paid
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '12%',
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          border: '1px solid #000000',
                          padding: '5px 6px 8px 6px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          lineHeight: 1.35,
                          width: '28%',
                        }}
                      >
                        Issuing Authority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.licenseHistory.map((row) => (
                      <tr key={row.id}>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            fontVariantNumeric: 'tabular-nums',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {formatFssaiDate(row.issuedOn)}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            fontVariantNumeric: 'tabular-nums',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {formatFssaiDate(row.feePaidOn)}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            fontVariantNumeric: 'tabular-nums',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {formatFssaiDate(row.feePaidUpto)}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {row.feePaid}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {row.type}
                        </td>
                        <td
                          style={{
                            border: '1px solid #000000',
                            padding: '5px 6px 8px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.35,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {row.issuingAuthority}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '20px', fontSize: '11px', lineHeight: 1.48 }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>Note:</div>
                  {LICENSE_HISTORY_NOTES.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontWeight: 700,
                        marginBottom: '10px',
                      }}
                    >
                      <span>{idx + 1}.</span>
                      <span>
                        {note.split('https://foscos.fssai.gov.in').map((part, pIdx, arr) =>
                          pIdx < arr.length - 1 ? (
                            <React.Fragment key={pIdx}>
                              {part}
                              <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
                                https://foscos.fssai.gov.in
                              </span>
                            </React.Fragment>
                          ) : (
                            part
                          )
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <PageNumberFooter page={4} />
            </div>
          </article>

          {/* ================= PAGE 5 OF 7: NON-FORM C ANNEXURE ================= */}
          <article id="form-c-page-5" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <OfficialHeaderRow data={data} topLabel="Non-Form C Annexure" />

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    marginBottom: '8px',
                    fontSize: '11.5px',
                  }}
                >
                  अनुज्ञप्ति संख्या / License Number:{' '}
                  <strong style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}>
                    {data.licenseNumber || '00000000000000'}
                  </strong>
                </div>

                {/* Person in charge of operations */}
                <div
                  style={{
                    backgroundColor: '#d9d9d9',
                    border: '1px solid #000000',
                    padding: '4px 8px 8px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  Person in charge of operations
                </div>
                <PersonDetailsGrid person={data.personInCharge} includeFostac />

                {/* Person responsible for complying with conditions */}
                <div
                  style={{
                    backgroundColor: '#d9d9d9',
                    border: '1px solid #000000',
                    padding: '4px 8px 8px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginTop: '6px',
                    lineHeight: 1.35,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  Person responsible for complying with conditions of license(The person must be
                  same as mentioned in Form IX, as per FSS Regulations, 2011)
                </div>
                <PersonDetailsGrid person={data.personResponsible} />

                {/* Place / Issued On + Designated Officer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginTop: '24px',
                    gap: '16px',
                  }}
                >
                  <table style={{ borderCollapse: 'collapse', width: '48%', tableLayout: 'fixed', fontSize: '11px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '3px 10px 3px 0', width: '130px', verticalAlign: 'top' }}>
                          Place / स्थान:
                        </td>
                        <td
                          style={{
                            padding: '3px 0',
                            verticalAlign: 'top',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {data.place || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 10px 3px 0', verticalAlign: 'top' }}>
                          Issued On / दिनांक:
                        </td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' }}>
                          {issuedOnStr}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <DesignatedOfficerBlock
                    dateTime={data.officerDateTime}
                    userId={data.officerUserId}
                    mobileMasked={data.officerMobileMasked}
                  />
                </div>

                <div
                  style={{
                    marginTop: '26px',
                    fontSize: '10.8px',
                    fontWeight: 700,
                    lineHeight: 1.45,
                  }}
                >
                  Note: Any change in above details shall be immediately communicated to authorities.
                  You can apply for modification of license for updation of details without any cost
                  through Food Safety Compliance System (
                  <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
                    https://foscos.fssai.gov.in
                  </span>
                  )
                </div>
              </div>

              <PageNumberFooter page={5} />
            </div>
          </article>

          {/* ================= PAGE 6 OF 7: CONDITION OF LICENSE ================= */}
          <article id="form-c-page-6" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <h2
                  style={{
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: '12px 0 22px 0',
                    color: '#000000',
                  }}
                >
                  Condition of License
                </h2>

                <p style={{ fontSize: '11px', lineHeight: 1.45, marginBottom: '14px' }}>
                  All Food Business operators shall ensure that the following conditions are complied
                  with at all times during the course of its Food Business.
                </p>

                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                  Food Business Operators Shall:
                </div>

                <div style={{ fontSize: '11px', lineHeight: 1.44 }}>
                  {PAGE_6_CONDITIONS.map((text, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ minWidth: '20px' }}>{idx + 1}.</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <PageNumberFooter page={6} />
            </div>
          </article>

          {/* ================= PAGE 7 OF 7: OTHER CONDITION ================= */}
          <article id="form-c-page-7" className="fssai-a4-page" style={pageOuterStyle}>
            <div style={pageBorderBoxStyle}>
              <div>
                <h2
                  style={{
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: '12px 0 22px 0',
                    color: '#000000',
                  }}
                >
                  Other Condition
                </h2>

                <div style={{ fontSize: '11px', lineHeight: 1.45 }}>
                  {PAGE_7_OTHER_CONDITIONS.map((item) => (
                    <div
                      key={item.num}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ minWidth: '18px' }}>{item.num}.</span>
                      <div>
                        <div style={{ whiteSpace: 'pre-line' }}>{item.text}</div>
                        {item.subItems && (
                          <div style={{ marginTop: '4px', paddingLeft: '4px' }}>
                            {item.subItems.map((sub, sIdx) => (
                              <div key={sIdx} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                                <span>{sIdx + 1}.</span>
                                <span>{sub}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {data.customOtherConditions.map((customText, cIdx) => (
                    <div
                      key={`custom-${cIdx}`}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ minWidth: '18px' }}>
                        {PAGE_7_OTHER_CONDITIONS.length + cIdx + 1}.
                      </span>
                      <span>{customText}</span>
                    </div>
                  ))}
                </div>
              </div>

              <PageNumberFooter page={7} />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
