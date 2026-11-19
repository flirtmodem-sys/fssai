import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeBlockProps {
  payload: string;
  size?: number;
  caption?: string;
  bordered?: boolean;
}

export const QrCodeBlock: React.FC<QrCodeBlockProps> = ({
  payload,
  size = 84,
  caption,
  bordered = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload || 'FSSAI-FORM-C', {
      width: size * 3,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (active) {
          setDataUrl('');
        }
      });

    return () => {
      active = false;
    };
  }, [payload, size]);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: bordered ? '1px solid #cbd5e1' : 'none',
        backgroundColor: '#ffffff',
        padding: bordered ? '4px' : '0',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={caption ? `${caption} QR Code` : 'FSSAI License Verification QR Code'}
          width={size}
          height={size}
          style={{ display: 'block', width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: '#64748b',
          }}
        >
          QR
        </div>
      )}
      {caption && (
        <span
          style={{
            marginTop: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#000000',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
};
