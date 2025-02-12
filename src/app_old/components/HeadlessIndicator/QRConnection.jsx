import React from "react";
import QRCode from "react-qr-code";
import styles from "./index.styl";

const QRConnection = ({ ip = "10.0.0.106", port = "8000" }) => {
  const address = `http://${ip}:${port}`;
  return (
    <>
      <h1>Scan QR Code</h1>
      <div className={styles.subheader}>
        Scan this on your phone&apos;s camera to visit the address.
      </div>
      <QRCode size={200} value={address} viewBox="0 0 200 200" />
      <div className={styles.subheader}>Or visit the address manually:</div>
      <div>{address}</div>
    </>
  );
};

export default QRConnection;
