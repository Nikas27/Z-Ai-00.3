import React from 'react';

interface QRCodeProps {
  value: string;
}

const QRCode: React.FC<QRCodeProps> = ({ value }) => {
  // This is a static visual representation of a QR code.
  // In a real application, you would use a library to generate a scannable QR code from the `value` prop.
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="bg-white p-1 rounded-md shadow-md">
      <path fill="#000" d="M0 0h30v30H0z M70 0h30v30H70z M0 70h30v30H0z M10 10h10v10H10z M80 10h10v10H80z M10 80h10v10H10z M40 0h10v10H40z M60 0h10v10H60z M40 20h10v10H40z M60 20h10v10H60z M40 40h10v10H40z M0 40h10v10H0z M20 40h10v10H20z M70 40h10v10H70z M90 40h10v10H90z M40 60h10v10H40z M60 60h10v10H60z M40 70h10v10H40z M40 90h10v10H40z M20 70h10v10H20z M0 60h10v10H0z M70 90h10v10H70z M90 70h10v10H90z M60 50h30v10H60z M50 30h10v10H50z M60 80h10v10H60z M80 60h10v10H80z"/>
    </svg>
  );
};

export default QRCode;
