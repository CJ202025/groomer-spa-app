// src/types/database.ts

// ── Enums ──────────────────────────────────────────────────────────────────────

export type Rol = "cliente" | "admin" | "barbero";

export type VarianteNivel = "Senior" | "Master";

export type EstadoCita =
    | "pendiente"
    | "confirmada"
    | "completada"
    | "cancelada";

export type MetodoEnvio = "Recojo" | "Delivery_Local" | "Nacional";

export type EstadoPedido = "confirmado" | "en_preparacion" | "completado";

// ── Tablas ─────────────────────────────────────────────────────────────────────

export interface User {
    id: string; // UUID, PK (sincronizado con Supabase Auth)
    nombre_completo: string;
    email: string;
    telefono: string | null;
    dni_ce: string | null;
    rol: Rol;
    groomer_credits: number;
    es_miembro_elite: boolean;
}

export interface Service {
    id: string; // UUID, PK
    sku: string;
    nombre: string;
    descripcion_corta: string;
    descripcion_larga: string;
    precio_base: number;
    duracion_minutos: number | null;
    variante_nivel: VarianteNivel;
}

export interface Product {
    id: string; // UUID, PK
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock_actual: number;
    stock_minimo: number;
    categoria: string;
    es_dropshipping: boolean;
}

export interface Appointment {
    id: string; // UUID, PK
    usuario_id: string; // FK -> users
    servicio_id: string; // FK -> services
    barbero_id: string; // FK -> users (rol: barbero)
    fecha_hora_inicio: string; // ISO 8601
    estado: EstadoCita;
}

export interface Order {
    id: string; // UUID, PK
    usuario_id: string; // FK -> users
    total: number;
    subtotal: number;
    costo_envio: number;
    metodo_envio: MetodoEnvio;
    estado_pedido: EstadoPedido;
    token_pago: string | null; // Token Culqi Sandbox - nunca datos de tarjeta
}

export interface OrderItem {
    id: string; // UUID, PK
    pedido_id: string; // FK -> orders
    producto_id: string | null; // FK -> products (nullable)
    servicio_id: string | null; // FK -> services (nullable)
    cantidad: number;
    subtotal: number;
}

// ── Tipo Database para el cliente Supabase tipado ─────────────────────────────

export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, "id"> & { id?: string };
                Update: Partial<Omit<User, "id">>;
            };
            services: {
                Row: Service;
                Insert: Omit<Service, "id"> & { id?: string };
                Update: Partial<Omit<Service, "id">>;
            };
            products: {
                Row: Product;
                Insert: Omit<Product, "id"> & { id?: string };
                Update: Partial<Omit<Product, "id">>;
            };
            appointments: {
                Row: Appointment;
                Insert: Omit<Appointment, "id"> & { id?: string };
                Update: Partial<Omit<Appointment, "id">>;
            };
            orders: {
                Row: Order;
                Insert: Omit<Order, "id"> & { id?: string };
                Update: Partial<Omit<Order, "id">>;
            };
            order_items: {
                Row: OrderItem;
                Insert: Omit<OrderItem, "id"> & { id?: string };
                Update: Partial<Omit<OrderItem, "id">>;
            };
        };
        Enums: {
            rol: Rol;
            variante_nivel: VarianteNivel;
            estado_cita: EstadoCita;
            metodo_envio: MetodoEnvio;
            estado_pedido: EstadoPedido;
        };
    };
}
