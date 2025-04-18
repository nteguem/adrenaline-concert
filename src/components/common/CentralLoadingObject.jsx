import React from "react";

function CentralLoadingObject({ text }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "center",
        flexDirection: "column",
        justifyContent: "space-between",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

export default CentralLoadingObject;
