import React from "react";

function Table({ headers, data, exactKeys = false }) {
	
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} style={styles.headerCell}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
  {data.length > 0 ? (
    data.map((row, rowIndex) => (
      <tr
        key={rowIndex}
        style={{
          ...styles.row,
          backgroundColor: row.seleccionado ? "#d3e2f7" : "inherit", // Color para la fila seleccionada
          cursor: "pointer", // Cambia el cursor al pasar sobre la fila
        }}
        onClick={row.onClick} // Evento onClick para seleccionar la fila
      >
        {headers.map((header, colIndex) => (
          <td key={colIndex} style={styles.cell}>
  {exactKeys ? (row[header] !== undefined && row[header] !== null ? row[header] : "N/A") : (row[header.toLowerCase()] !== undefined && row[header.toLowerCase()] !== null ? row[header.toLowerCase()] : "N/A")}

</td>


        ))}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={headers.length} style={styles.noData}>
        No hay datos disponibles
      </td>
    </tr>
  )}
</tbody>

    </table>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  headerCell: {
    backgroundColor: "#4CAF50",
    color: "white",
    fontWeight: "bold",
    padding: "10px",
    border: "1px solid #ddd",
  },
  row: {
    backgroundColor: "#f9f9f9",
  },
  cell: {
    padding: "8px",
    textAlign: "left",
    border: "1px solid #ddd",
  },
  noData: {
    textAlign: "center",
    padding: "10px",
    fontStyle: "italic",
  },
};

export default Table;
