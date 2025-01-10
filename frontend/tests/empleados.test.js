import { render, screen, fireEvent } from "@testing-library/react";
import Empleados from "../pages/Empleados";
import { AuthProvider } from "../context/AuthContext";

describe("Pruebas de Gestión de Empleados", () => {
  test("Renderiza la página de empleados correctamente", () => {
    render(
      <AuthProvider>
        <Empleados />
      </AuthProvider>
    );

    expect(screen.getByText(/gestión de empleados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar empleado/i })).toBeInTheDocument();
  });

  test("Permite agregar un empleado", () => {
    render(
      <AuthProvider>
        <Empleados />
      </AuthProvider>
    );

    const buttonAgregar = screen.getByRole("button", { name: /agregar empleado/i });
    fireEvent.click(buttonAgregar);

    const inputNombre = screen.getByPlaceholderText(/nombre del empleado/i);
    const inputPuesto = screen.getByPlaceholderText(/puesto/i);
    const inputSalario = screen.getByPlaceholderText(/salario/i);
    const buttonGuardar = screen.getByRole("button", { name: /guardar/i });

    fireEvent.change(inputNombre, { target: { value: "Juan Pérez" } });
    fireEvent.change(inputPuesto, { target: { value: "Cajero" } });
    fireEvent.change(inputSalario, { target: { value: "2500" } });
    fireEvent.click(buttonGuardar);

    expect(screen.getByText(/empleado agregado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
  });

  test("Permite editar un empleado", () => {
    render(
      <AuthProvider>
        <Empleados />
      </AuthProvider>
    );

    const buttonEditar = screen.getAllByRole("button", { name: /editar/i })[0];
    fireEvent.click(buttonEditar);

    const inputPuesto = screen.getByPlaceholderText(/puesto/i);
    fireEvent.change(inputPuesto, { target: { value: "Supervisor" } });

    const buttonGuardar = screen.getByRole("button", { name: /guardar/i });
    fireEvent.click(buttonGuardar);

    expect(screen.getByText(/empleado actualizado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/supervisor/i)).toBeInTheDocument();
  });

  test("Permite eliminar un empleado", () => {
    render(
      <AuthProvider>
        <Empleados />
      </AuthProvider>
    );

    const buttonEliminar = screen.getAllByRole("button", { name: /eliminar/i })[0];
    fireEvent.click(buttonEliminar);

    expect(screen.getByText(/empleado eliminado exitosamente/i)).toBeInTheDocument();
  });
});
