import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import Login from "../pages/Login";

describe("Pruebas de autenticación", () => {
  test("Renderiza el formulario de inicio de sesión", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test("Muestra error si los campos están vacíos", async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const button = screen.getByRole("button", { name: /iniciar sesión/i });
    fireEvent.click(button);

    expect(screen.getByText(/todos los campos son obligatorios/i)).toBeInTheDocument();
  });
});
