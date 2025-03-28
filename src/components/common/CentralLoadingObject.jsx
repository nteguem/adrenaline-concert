import React from "react";

function CentralLoadingObject({ text }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "center",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {text}
    </div>
  );
}

export default CentralLoadingObject;
