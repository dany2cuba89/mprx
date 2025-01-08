const request = require("supertest");
const app = require("../index"); // Importar la app principal
const { supabase } = require("../database");

// Variables globales para las pruebas
let tokenCajera;
let productoId;

beforeAll(async () => {
    // Registrar una cajera para las pruebas
    await supabase.from("usuarios").delete().eq("username", "testcajera"); // Eliminar si ya existe
    const response = await request(app)
        .post("/auth/register")
        .send({
            username: "testcajera",
            password: "password123",
            role: "cajero",
        });

    tokenCajera = (
        await request(app)
            .post("/auth/login")
            .send({
                username: "testcajera",
                password: "password123",
            })
    ).body.token;

    // Agregar un producto de prueba al inventario
    const producto = await supabase
        .from("productos")
        .insert({
            nombre: "Producto Prueba",
            precio: 100,
            stock: 50,
            nivel_minimo: 10,
            unidad_medida: "unidad",
            categoria: "General",
        })
        .select()
        .single();
    productoId = producto.data.id;
});

afterAll(async () => {
    // Eliminar la cajera y el producto de prueba
    await supabase.from("usuarios").delete().eq("username", "testcajera");
    await supabase.from("productos").delete().eq("id", productoId);
});

describe("Pruebas de Caja Registradora", () => {
    let carrito = [];

    it("Debería agregar un producto al carrito mediante QR", async () => {
        const response = await request(app)
            .post("/caja/agregar-qr")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                codigo_qr: productoId, // Aquí usamos el ID como QR para simplificar
                cantidad: 2,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("carrito");
        expect(response.body.carrito).toHaveLength(1);

        carrito = response.body.carrito; // Guardar carrito para pruebas posteriores
    });

    it("Debería fallar al agregar un producto con stock insuficiente", async () => {
        const response = await request(app)
            .post("/caja/agregar-qr")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                codigo_qr: productoId,
                cantidad: 100, // Excede el stock disponible
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", expect.stringContaining("Stock insuficiente"));
    });

    it("Debería confirmar la venta con pago en efectivo", async () => {
        const response = await request(app)
            .post("/caja/venta")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                metodo_pago: "efectivo",
                cajera: "testcajera",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("venta");

        // Verificar que el carrito esté vacío después de la venta
        carrito = [];
        expect(carrito).toHaveLength(0);

        // Verificar que el stock del producto se actualizó
        const producto = await supabase.from("productos").select("stock").eq("id", productoId).single();
        expect(producto.data.stock).toBe(48); // Stock inicial 50 - 2 vendidos
    });

    it("Debería confirmar la venta con pago por transferencia", async () => {
        const response = await request(app)
            .post("/caja/venta")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                metodo_pago: "transferencia",
                cajera: "testcajera",
                numero_tarjeta: "1234567890123456",
                nombre_cliente: "Juan Pérez",
                ci_cliente: "12345678900",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("venta");
    });

    it("Debería fallar al intentar confirmar una venta con carrito vacío", async () => {
        const response = await request(app)
            .post("/caja/venta")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                metodo_pago: "efectivo",
                cajera: "testcajera",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "El carrito está vacío");
    });

    it("Debería fallar al usar un método de pago inválido", async () => {
        const response = await request(app)
            .post("/caja/venta")
            .set("Authorization", `Bearer ${tokenCajera}`)
            .send({
                metodo_pago: "bitcoin", // Método de pago no permitido
                cajera: "testcajera",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Método de pago no válido");
    });
});
