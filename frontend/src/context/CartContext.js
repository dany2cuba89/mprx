import React, { createContext, useContext, useReducer } from "react";

const CartContext = createContext();

const initialState = {
  carrito: [],
  total: 0,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      const existingItemIndex = state.carrito.findIndex(
        (item) => item.id === action.payload.id
      );

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si el producto ya está en el carrito
        const updatedCarrito = [...state.carrito];
        updatedCarrito[existingItemIndex].cantidad += action.payload.cantidad;
        updatedCarrito[existingItemIndex].importe =
          updatedCarrito[existingItemIndex].cantidad *
          updatedCarrito[existingItemIndex].precio;

        return {
          ...state,
          carrito: updatedCarrito,
          total: updatedCarrito.reduce((sum, item) => sum + item.importe, 0),
        };
      }

      // Agregar nuevo producto al carrito
      return {
        ...state,
        carrito: [...state.carrito, action.payload],
        total: state.total + action.payload.importe,
      };

    case "REMOVE_FROM_CART":
      const filteredCarrito = state.carrito.filter(
        (item) => item.id !== action.payload.id
      );

      return {
        ...state,
        carrito: filteredCarrito,
        total: filteredCarrito.reduce((sum, item) => sum + item.importe, 0),
      };

    case "CLEAR_CART":
      return initialState;

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (producto) => {
    dispatch({ type: "ADD_TO_CART", payload: producto });
  };

  const removeFromCart = (id) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: { id } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider
      value={{ carrito: state.carrito, total: state.total, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
