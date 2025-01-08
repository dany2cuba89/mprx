import { render, screen, fireEvent } from "@testing-library/react";
import Reportes from "../pages/Reportes";
import { AuthProvider } from "../context/AuthContext";

describe("Pruebas de Generación de Reportes", () => {
  test("Renderiza la página de reportes correctamente", () => {
    render(
      <AuthProvider>
        <Reportes />
      </AuthProvider>
    );

    expect(screen.getByText(/reportes financieros/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generar reporte diario/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generar reporte mensual/i })).toBeInTheDocument();
  });

  test("Genera un reporte diario", () => {
    render(
      <AuthProvider>
        <Reportes />
      </AuthProvider>
    );

    const buttonDiario = screen.getByRole("button", { name: /generar reporte diario/i });
    fireEvent.click(buttonDiario);

    expect(screen.getByText(/reporte diario generado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresos totales/i)).toBeInTheDocument();
    expect(screen.getByText(/egresos totales/i)).toBeInTheDocument();
  });

  test("Genera un reporte mensual", () => {
    render(
      <AuthProvider>
        <Reportes />
      </AuthProvider>
    );

    const buttonMensual = screen.getByRole("button", { name: /generar reporte mensual/i });
    fireEvent.click(buttonMensual);

    expect(screen.getByText(/reporte mensual generado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/productos más vendidos/i)).toBeInTheDocument();
  });

  test("Muestra gráficos en los reportes", () => {
    render(
      <AuthProvider>
        <Reportes />
      </AuthProvider>
    );

    expect(screen.getByText(/gráfico de ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/gráfico de gastos/i)).toBeInTheDocument();
  });
});
