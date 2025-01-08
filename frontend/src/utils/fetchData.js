export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(errorDetails.message || "Error en la solicitud");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || "Error de conexión con el servidor");
  }
};
