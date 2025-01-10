// Obtener alertas de stock bajo
export const getAlertasStockBajo = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/alertas`);
    if (!response.ok) throw new Error("Error al obtener alertas de stock bajo.");
    const { alertas } = await response.json();
    return alertas;
};

// Generar alertas de stock bajo
export const generarAlertasStockBajo = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/alertas/generar`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Error al generar alertas de stock bajo.");
    return await response.json();
};

