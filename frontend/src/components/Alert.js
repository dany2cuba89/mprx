import React from "react";
import classNames from "classnames";

function Alert({ message, type = "info" }) {
  return (
    <div
      className={classNames("alert", {
        "alert-success": type === "success",
        "alert-warning": type === "warning",
        "alert-error": type === "error",
        "alert-info": type === "info",
      })}
      style={styles.alert}
    >
      {message}
    </div>
  );
}

const styles = {
  alert: {
    padding: "10px 20px",
    borderRadius: "4px",
    margin: "10px 0",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default Alert;
