import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #A93A30 0%, #143556 100%)",
          borderRadius: 16,
          color: "white",
          fontSize: 30,
          fontWeight: 700,
          fontFamily: "Arial"
        }}
      >
        TC
      </div>
    ),
    size
  );
}
