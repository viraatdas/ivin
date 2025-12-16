import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAF8",
          fontFamily: "system-ui",
        }}
      >
        {/* Paper effect */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            padding: "60px 80px",
            borderRadius: "4px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            border: "1px solid #E5E5E5",
          }}
        >
          {/* Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              marginBottom: "32px",
              border: "1.5px solid black",
              borderRadius: "8px",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              fill="none"
            >
              <line x1="8" y1="10" x2="24" y2="10" stroke="black" strokeWidth="1.5" />
              <line x1="8" y1="16" x2="24" y2="16" stroke="black" strokeWidth="1.5" />
              <line x1="8" y1="22" x2="18" y2="22" stroke="black" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: "black",
              letterSpacing: "-0.02em",
              marginBottom: "16px",
            }}
          >
            journal
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 300,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Think Better.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
