import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider } from "../context/CartContext";
import Caja from "../pages/Caja";

describe("Pruebas de la Caja Registradora", () => {
  test("Renderiza la página de la caja correctamente", () => {
    render(
      <CartProvider>
        <Caja />
      </CartProvider>
    );

    expect(screen.getByText(/caja registradora/i)).toBeInTheDocument();
    expect(screen.getByText(/total a pagar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar venta/i })).toBeInTheDocument();
  });

  test("Agrega productos al carrito y actualiza el total", () => {
    render(
      <CartProvider>
        <Caja />
      </CartProvider>
    );

    const inputCodigoQR = screen.getByPlaceholderText(/escanea el código qr/i);
    const inputCantidad = screen.getByPlaceholderText(/cantidad/i);
    const buttonAgregar = screen.getByRole("button", { name: /agregar al carrito/i });

    // Simular agregar un producto
    fireEvent.change(inputCodigoQR, { target: { value: "123456" } });
    fireEvent.change(inputCantidad, { target: { value: "2" } });
    fireEvent.click(buttonAgregar);

    // Verificar que el producto se haya agregado al carrito
    expect(screen.getByText(/producto agregado/i)).toBeInTheDocument();
    expect(screen.getByText(/total a pagar/i)).toBeInTheDocument();
  });

  test("Muestra un mensaje de error si el stock es insuficiente", () => {
    render(
      <CartProvider>
        <Caja />
      </CartProvider>
    );

    const inputCodigoQR = screen.getByPlaceholderText(/escanea el código qr/i);
    const inputCantidad = screen.getByPlaceholderText(/cantidad/i);
    const buttonAgregar = screen.getByRole("button", { name: /agregar al carrito/i });

    // Simular agregar un producto con cantidad mayor al stock disponible
    fireEvent.change(inputCodigoQR, { target: { value: "789012" } });
    fireEvent.change(inputCantidad, { target: { value: "9999" } });
    fireEvent.click(buttonAgregar);

    // Verificar que el mensaje de error se muestra
    expect(screen.getByText(/stock insuficiente/i)).toBeInTheDocument();
  });

  test("Vacía el carrito después de confirmar la venta", () => {
    render(
      <CartProvider>
        <Caja />
      </CartProvider>
    );

    const buttonConfirmar = screen.getByRole("button", { name: /confirmar venta/i });

    // Confirmar la venta
    fireEvent.click(buttonConfirmar);

    // Verificar que el carrito se vacía
    expect(screen.getByText(/carrito vacío/i)).toBeInTheDocument();
  });
});
