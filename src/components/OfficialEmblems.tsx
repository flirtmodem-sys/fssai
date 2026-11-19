import React from 'react';

export const FSSAI_LOGO_SRC =
  '/assets/aistudio/fssai-mark-certification_f870d72e.png';
export const GOVT_EMBLEM_SRC =
  '/assets/aistudio/Government_of_India_Emblem_and_Ministry_Text_064da4b2.png';

export const FssaiOfficialLogoImg: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => (
  <div
    style={{
      width: '142px',
      height: '91px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    <img
      src={FSSAI_LOGO_SRC}
      alt="FSSAI Logo"
      style={{
        width: '214px',
        height: '214px',
        maxWidth: 'none',
        flexShrink: 0,
        display: 'block',
      }}
    />
  </div>
);

export const GovtEmblemImg: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => (
  <img
    src={GOVT_EMBLEM_SRC}
    alt="Government Emblem"
    style={{
      width: '116px',
      height: '92px',
      objectFit: 'contain',
      display: 'block',
      ...style,
    }}
  />
);

export const OFFICER_SIGNATURE_SRC = '/assets/aistudio/4_0983a056.png';

export const DesignatedOfficerBlock: React.FC<{
  dateTime: string;
  userId: string;
  mobileMasked: string;
  fontSize?: string;
  titleFontSize?: string;
  minWidth?: string;
  labelWidth?: string;
}> = ({
  dateTime,
  userId,
  mobileMasked,
  fontSize = '11px',
  titleFontSize = '12px',
  minWidth = '276px',
  labelWidth = '138px',
}) => (
  <div
    style={{
      position: 'relative',
      minWidth,
      fontSize,
      color: '#000000',
      lineHeight: 1.4,
    }}
  >
    {/* Overlapping Green Verified Signature Checkmark matching FoSCoS PDF */}
    <img
      src={OFFICER_SIGNATURE_SRC}
      alt="Designated Officer Digital Signature"
      style={{
        position: 'absolute',
        left: '114px',
        top: '16px',
        width: '72px',
        height: '75px',
        objectFit: 'contain',
        pointerEvents: 'none',
        opacity: 0.94,
      }}
    />

    <div style={{ fontWeight: 700, fontSize: titleFontSize, marginBottom: '6px' }}>
      Designated Officer
    </div>
    <table style={{ borderCollapse: 'collapse', width: '100%', position: 'relative', zIndex: 1 }}>
      <tbody>
        <tr>
          <td
            style={{
              padding: '2px 10px 3px 0',
              verticalAlign: 'top',
              width: labelWidth,
              whiteSpace: 'nowrap',
            }}
          >
            Date :
          </td>
          <td
            style={{
              padding: '2px 0 3px 0',
              verticalAlign: 'top',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {dateTime || '—'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '2px 10px 3px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
            User Id :
          </td>
          <td
            style={{
              padding: '2px 0 3px 0',
              verticalAlign: 'top',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {userId || '—'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '2px 10px 3px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
            Verified through Mobile :
          </td>
          <td
            style={{
              padding: '2px 0 3px 0',
              verticalAlign: 'top',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {mobileMasked || '—'}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
