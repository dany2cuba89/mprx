import { supabase } from "./supabase";

// Obtener todos los empleados
export const getEmpleados = async () => {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre_completo, puesto, salario, correo, metodo_pago, sistema_pago, numero_tarjeta, fecha_contratacion, activo");
  if (error) throw new Error(error.message);
  return data;
};


export const addEmpleado = async (empleado) => {
  const { data, error } = await supabase.from("empleados").insert([empleado]);
  if (error) throw new Error(error.message);
  return data;
};

export const updateEmpleado = async (id, empleado) => {
  const { data, error } = await supabase
    .from("empleados")
    .update(empleado)
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data;
};


// Eliminar un empleado
export const deleteEmpleado = async (id) => {
  const { data, error } = await supabase
    .from("empleados")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data;
};

// Registrar un pago a un empleado
export const addPagoEmpleado = async (pago) => {
  const { empleado_id, ...resto } = pago;

  const { data, error } = await supabase
    .from("pagos_empleados")
    .insert([{ empleado_id, ...resto }]);

  if (error) throw new Error(error.message);

  return data;
};


// Consultar pagos de un empleado
export const getPagosEmpleado = async (empleadoId) => {
  const { data, error } = await supabase
    .from("pagos_empleados")
    .select("*")
    .eq("empleado_id", empleadoId);

  if (error) throw new Error(error.message);
  return data;
};

// Verificar si un nombre de empleado ya existe
export const verificarNombreEmpleado = async (nombreCompleto, idExcluir = null) => {
  const { data, error } = await supabase
    .from("empleados")
    .select("id")
    .eq("nombre_completo", nombreCompleto);

  if (error) throw new Error(error.message);

  // Excluir el id en edición
  return data.some((empleado) => empleado.id !== idExcluir);
};

// Verificar si un correo de empleado ya existe
export const verificarCorreoEmpleado = async (correo, idExcluir = null) => {
  const { data, error } = await supabase
    .from("empleados")
    .select("id")
    .eq("correo", correo);

  if (error) throw new Error(error.message);

  // Excluir el id en edición
  return data.some((empleado) => empleado.id !== idExcluir);
};
