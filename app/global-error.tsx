"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="th">
      <body
        style={{
          alignItems: "center",
          background: "#f4f7fe",
          color: "#1f2937",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "480px", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
            ระบบขัดข้องชั่วคราว
          </h1>
          <p style={{ lineHeight: 1.6, marginBottom: "24px" }}>
            ระบบได้รับรายงานปัญหาแล้ว กรุณาลองใหม่อีกครั้ง
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#166534",
              border: 0,
              borderRadius: "8px",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600,
              minHeight: "44px",
              padding: "10px 20px",
            }}
          >
            ลองใหม่
          </button>
        </main>
      </body>
    </html>
  );
}
