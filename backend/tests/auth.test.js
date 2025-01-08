const request = require("supertest");
const app = require("../index"); // Importar la app principal
const { supabase } = require("../database");

// Variables globales para las pruebas
let token;

// Configuración antes de todas las pruebas
beforeAll(async () => {
    // Elimina usuarios de prueba previamente existentes
    await supabase.from("usuarios").delete().eq("username", "testuser");
});

// Limpieza después de todas las pruebas
afterAll(async () => {
    // Elimina los usuarios de prueba creados durante las pruebas
    await supabase.from("usuarios").delete().eq("username", "testuser");
});

describe("Pruebas de Autenticación", () => {
    it("Debería registrar un usuario exitosamente", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                username: "testuser",
                password: "password123",
                role: "dueño",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("username", "testuser");
    });

    it("Debería fallar al registrar un usuario duplicado", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                username: "testuser",
                password: "password123",
                role: "dueño",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", expect.stringContaining("duplicate"));
    });

    it("Debería iniciar sesión exitosamente con credenciales correctas", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                username: "testuser",
                password: "password123",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        token = response.body.token; // Guardar el token para pruebas posteriores
    });

    it("Debería fallar al iniciar sesión con credenciales incorrectas", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                username: "testuser",
                password: "wrongpassword",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Credenciales incorrectas");
    });

    it("Debería acceder a una ruta protegida con el token correcto", async () => {
        const response = await request(app)
            .get("/reportes")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message");
    });

    it("Debería fallar al acceder a una ruta protegida sin token", async () => {
        const response = await request(app).get("/reportes");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error", "Acceso no autorizado. Token no proporcionado.");
    });

    it("Debería fallar al acceder a una ruta protegida con un token inválido", async () => {
        const response = await request(app)
            .get("/reportes")
            .set("Authorization", "Bearer invalidtoken");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error", "Token inválido o expirado.");
    });
});
