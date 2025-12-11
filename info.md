# 📚 Guía Completa de Integración de Componentes - Sistema de Evaluación INSITU

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Backend - Integración de Endpoints](#backend-integración-de-endpoints)
4. [Frontend - Integración de Componentes](#frontend-integración-de-componentes)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Estilos y Temas](#estilos-y-temas)
8. [Buenas Prácticas](#buenas-prácticas)
9. [Ejemplos Completos](#ejemplos-completos)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### **Backend**
- **Framework:** Node.js + Express.js
- **Base de Datos:** MySQL 5.7+
- **Autenticación:** JWT (JSON Web Tokens)
- **Validación:** Joi
- **Documentación:** Swagger/OpenAPI
- **ORM:** mysql2 con consultas directas

#### **Frontend**
- **Framework:** Next.js 15.1.0 (App Router)
- **UI Library:** React 18.2.0
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Gestión de Estado:** React Context + Hooks
- **Peticiones HTTP:** Axios
- **Formularios:** React Hook Form + Zod

---

## 📁 Estructura de Carpetas

### Backend
```
backend/
├── src/
│   ├── api/v1/
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── routes/           # Definición de rutas
│   │   │   ├── auth/         # Rutas de autenticación
│   │   │   ├── evaluacion/   # Rutas de evaluación
│   │   │   ├── vista/        # Rutas de vistas
│   │   │   ├── reportes/     # Rutas de reportes
│   │   │   ├── descargas/    # Rutas de descarga
│   │   │   └── index.js      # Agregador de rutas
│   │   ├── middlewares/      # Middleware personalizado
│   │   ├── models/           # Modelos de datos
│   │   ├── services/         # Lógica de servicios
│   │   ├── validations/      # Esquemas de validación
│   │   └── utils/            # Utilidades
│   ├── config/               # Configuración
│   ├── app.js                # Configuración Express
│   ├── server.js             # Punto de entrada
│   └── db.js                 # Conexión DB
├── migrations/               # Scripts SQL
└── package.json
```

### Frontend
```
frontend/
├── app/                      # App Router (Next.js)
│   ├── admin/               # Módulo administrador
│   ├── docente/             # Módulo docente
│   ├── estudiante/          # Módulo estudiante
│   ├── login/               # Módulo login
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Página principal
│   └── globals.css          # Estilos globales
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── ConnectionStatus.tsx # Estado de conexión
│   ├── Pagination.tsx       # Paginación
│   └── ProtectedRoute.tsx   # Rutas protegidas
├── lib/
│   ├── api.ts               # Cliente API
│   ├── types.ts             # Tipos TypeScript
│   └── utils.ts             # Utilidades
├── services/
│   ├── api.client.ts        # Cliente Axios
│   ├── api.interceptor.ts   # Interceptores
│   └── evaluacionITP/       # Servicios específicos
├── config/
│   └── api.config.ts        # Configuración API
└── package.json
```

---

## 🔌 Backend - Integración de Endpoints

### Paso 1: Crear el Controlador

**Ubicación:** `backend/src/api/v1/controllers/`

```javascript
// controllers/miModulo/miControlador.controller.js
const { getPool } = require('../../../db');

/**
 * @desc    Obtener todos los registros
 * @route   GET /api/v1/mi-ruta
 * @access  Private
 */
const obtenerTodos = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM mi_tabla');
    
    res.status(200).json({
      success: true,
      message: 'Registros obtenidos exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un registro por ID
 * @route   GET /api/v1/mi-ruta/:id
 * @access  Private
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM mi_tabla WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Registro obtenido exitosamente',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo registro
 * @route   POST /api/v1/mi-ruta
 * @access  Private
 */
const crear = async (req, res, next) => {
  try {
    const { campo1, campo2 } = req.body;
    const pool = getPool();
    
    const [result] = await pool.query(
      'INSERT INTO mi_tabla (campo1, campo2) VALUES (?, ?)',
      [campo1, campo2]
    );
    
    res.status(201).json({
      success: true,
      message: 'Registro creado exitosamente',
      data: {
        id: result.insertId,
        campo1,
        campo2
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un registro
 * @route   PUT /api/v1/mi-ruta/:id
 * @access  Private
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { campo1, campo2 } = req.body;
    const pool = getPool();
    
    const [result] = await pool.query(
      'UPDATE mi_tabla SET campo1 = ?, campo2 = ? WHERE id = ?',
      [campo1, campo2, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: { id, campo1, campo2 }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un registro
 * @route   DELETE /api/v1/mi-ruta/:id
 * @access  Private
 */
const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [result] = await pool.query(
      'DELETE FROM mi_tabla WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
```

### Paso 2: Crear Validaciones (Opcional pero Recomendado)

**Ubicación:** `backend/src/api/v1/validations/`

```javascript
// validations/miModulo.validation.js
const Joi = require('joi');

const crearSchema = Joi.object({
  campo1: Joi.string().required().min(3).max(100),
  campo2: Joi.string().required(),
  campo3: Joi.number().optional()
});

const actualizarSchema = Joi.object({
  campo1: Joi.string().optional().min(3).max(100),
  campo2: Joi.string().optional(),
  campo3: Joi.number().optional()
});

const validarCrear = (req, res, next) => {
  const { error } = crearSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};

const validarActualizar = (req, res, next) => {
  const { error } = actualizarSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};

module.exports = {
  validarCrear,
  validarActualizar
};
```

### Paso 3: Crear las Rutas

**Ubicación:** `backend/src/api/v1/routes/`

```javascript
// routes/miModulo/miRuta.routes.js
const express = require('express');
const router = express.Router();
const {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
} = require('../../controllers/miModulo/miControlador.controller');
const { validarCrear, validarActualizar } = require('../../validations/miModulo.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/roles.middleware');

/**
 * @swagger
 * /api/v1/mi-ruta:
 *   get:
 *     summary: Obtener todos los registros
 *     tags: [MiModulo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros
 */
router.get('/', authenticate, obtenerTodos);

/**
 * @swagger
 * /api/v1/mi-ruta/{id}:
 *   get:
 *     summary: Obtener un registro por ID
 *     tags: [MiModulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', authenticate, obtenerPorId);

/**
 * @swagger
 * /api/v1/mi-ruta:
 *   post:
 *     summary: Crear un nuevo registro
 *     tags: [MiModulo]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, authorize(['admin']), validarCrear, crear);

router.put('/:id', authenticate, authorize(['admin']), validarActualizar, actualizar);

router.delete('/:id', authenticate, authorize(['admin']), eliminar);

module.exports = router;
```

### Paso 4: Registrar en el Index de Rutas

**Ubicación:** `backend/src/api/v1/routes/index.js`

```javascript
// Importar la nueva ruta
const miRutaRoutes = require('./miModulo/miRuta.routes');

// ... otras importaciones ...

// Registrar la ruta
router.use('/mi-ruta', miRutaRoutes);
```

### Paso 5: Crear Middleware de Autenticación (Si no existe)

**Ubicación:** `backend/src/api/v1/middlewares/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../../config/jwt_config');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

module.exports = { authenticate };
```

### Estructura de Respuesta Estándar

**Todas las respuestas deben seguir este formato:**

```javascript
// Éxito
{
  success: true,
  message: "Mensaje descriptivo",
  data: { /* datos */ }
}

// Error
{
  success: false,
  message: "Mensaje de error",
  errors: [] // opcional
}
```

---

## 🎨 Frontend - Integración de Componentes

### Paso 1: Crear el Servicio API

**Ubicación:** `frontend/services/`

```typescript
// services/miModulo/miModulo.service.ts
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';

export interface MiModelo {
  id: number;
  campo1: string;
  campo2: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrearMiModelo {
  campo1: string;
  campo2: string;
}

export const miModuloService = {
  /**
   * Obtener todos los registros
   */
  obtenerTodos: async (): Promise<ApiResponse<MiModelo[]>> => {
    const response = await apiClient.get<ApiResponse<MiModelo[]>>('/mi-ruta');
    return response.data;
  },

  /**
   * Obtener un registro por ID
   */
  obtenerPorId: async (id: number): Promise<ApiResponse<MiModelo>> => {
    const response = await apiClient.get<ApiResponse<MiModelo>>(`/mi-ruta/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo registro
   */
  crear: async (data: CrearMiModelo): Promise<ApiResponse<MiModelo>> => {
    const response = await apiClient.post<ApiResponse<MiModelo>>('/mi-ruta', data);
    return response.data;
  },

  /**
   * Actualizar un registro
   */
  actualizar: async (id: number, data: Partial<CrearMiModelo>): Promise<ApiResponse<MiModelo>> => {
    const response = await apiClient.put<ApiResponse<MiModelo>>(`/mi-ruta/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un registro
   */
  eliminar: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/mi-ruta/${id}`);
    return response.data;
  }
};
```

### Paso 2: Crear el Componente de Lista

**Ubicación:** `frontend/app/[rol]/mi-modulo/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { miModuloService, MiModelo } from '@/services/miModulo/miModulo.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

export default function MiModuloPage() {
  const [datos, setDatos] = useState<MiModelo[]>([]);
  const [cargando, setCargando] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const response = await miModuloService.obtenerTodos();
      if (response.success) {
        setDatos(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const eliminarRegistro = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      const response = await miModuloService.eliminar(id);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Registro eliminado correctamente',
        });
        cargarDatos();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el registro',
        variant: 'destructive',
      });
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mi Módulo</CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Campo 1</TableHead>
                <TableHead>Campo 2</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.campo1}</TableCell>
                  <TableCell>{item.campo2}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarRegistro(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Paso 3: Crear Formulario con React Hook Form + Zod

**Ubicación:** `frontend/app/[rol]/mi-modulo/components/FormularioMiModulo.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { miModuloService, CrearMiModelo } from '@/services/miModulo/miModulo.service';

const formSchema = z.object({
  campo1: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  campo2: z.string().min(1, 'Campo requerido'),
});

interface FormularioProps {
  onSuccess?: () => void;
  datosIniciales?: CrearMiModelo;
  idRegistro?: number;
}

export function FormularioMiModulo({ onSuccess, datosIniciales, idRegistro }: FormularioProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: datosIniciales || {
      campo1: '',
      campo2: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let response;
      
      if (idRegistro) {
        // Actualizar
        response = await miModuloService.actualizar(idRegistro, values);
      } else {
        // Crear
        response = await miModuloService.crear(values);
      }

      if (response.success) {
        toast({
          title: 'Éxito',
          description: idRegistro ? 'Registro actualizado' : 'Registro creado',
        });
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="campo1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campo 1</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese campo 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="campo2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campo 2</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese campo 2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### Paso 4: Crear Layout del Módulo (Si es necesario)

**Ubicación:** `frontend/app/[rol]/mi-modulo/layout.tsx`

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Módulo | Sistema INSITU',
  description: 'Gestión de mi módulo',
};

export default function MiModuloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mi-modulo-layout">
      {children}
    </div>
  );
}
```

### Paso 5: Crear Componente UI Personalizado (Si es necesario)

**Ubicación:** `frontend/components/ui/`

```typescript
// components/ui/data-table.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
```

---

## 🗄️ Base de Datos

### Conexión a la Base de Datos

El sistema utiliza **mysql2** con pools de conexiones para manejar múltiples bases de datos:

#### Configuración

**Archivo:** `backend/src/config/db_config.js`

```javascript
module.exports = {
  // Base de datos local
  dbConfig: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  
  // Base de datos remota
  dbRemoteConfig: {
    host: process.env.DB_REMOTE_HOST,
    port: process.env.DB_REMOTE_PORT,
    user: process.env.DB_REMOTE_USER,
    password: process.env.DB_REMOTE_PASSWORD,
    database: process.env.DB_REMOTE_NAME
  }
};
```

#### Uso en Controladores

```javascript
const { getPool } = require('../../../db');

// Obtener pool por defecto (local)
const pool = getPool();

// Consulta simple
const [rows] = await pool.query('SELECT * FROM tabla');

// Consulta con parámetros (prevención de SQL injection)
const [rows] = await pool.query(
  'SELECT * FROM tabla WHERE id = ? AND estado = ?',
  [id, estado]
);

// Transacciones
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  await connection.query('INSERT INTO tabla1 VALUES (?, ?)', [val1, val2]);
  await connection.query('UPDATE tabla2 SET campo = ? WHERE id = ?', [val, id]);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### Migraciones

**Ubicación:** `backend/migrations/`

```sql
-- Ejemplo: 2025-01-10-crear-tabla-ejemplo.sql

CREATE TABLE IF NOT EXISTS ejemplo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices
CREATE INDEX idx_nombre ON ejemplo(nombre);
CREATE INDEX idx_activo ON ejemplo(activo);
```

---

## 🔐 Autenticación y Autorización

### Sistema JWT

El sistema utiliza **JSON Web Tokens (JWT)** para autenticación.

#### Configuración JWT

**Archivo:** `backend/src/config/jwt_config.js`

```javascript
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};
```

#### Middleware de Autenticación

```javascript
// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../../config/jwt_config');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

module.exports = { authenticate };
```

#### Middleware de Autorización por Roles

```javascript
// middlewares/roles.middleware.js

const authorize = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    next();
  };
};

module.exports = { authorize };
```

#### Uso en Rutas

```javascript
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/roles.middleware');

// Solo usuarios autenticados
router.get('/datos', authenticate, obtenerDatos);

// Solo administradores
router.post('/crear', authenticate, authorize(['admin']), crear);

// Administradores y docentes
router.get('/reporte', authenticate, authorize(['admin', 'docente']), obtenerReporte);
```

### Frontend: Manejo de Tokens

**Servicio de Autenticación:** `frontend/services/evaluacionITP/auth/auth.service.ts`

```typescript
import { apiClient } from '@/lib/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.success) {
      // Guardar tokens
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};
```

### Interceptor Axios

**Archivo:** `frontend/services/api.interceptor.ts`

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

// Interceptor de Request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

---

## 🎨 Estilos y Temas

### Configuración de Tailwind CSS

**Archivo:** `frontend/tailwind.config.ts`

El sistema utiliza **shadcn/ui** con Tailwind CSS. Los colores y temas se definen usando variables CSS:

```typescript
extend: {
  colors: {
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    // ... más colores
  }
}
```

### Variables CSS

**Archivo:** `frontend/app/globals.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... más variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... más variables */
  }
}
```

### Componentes UI

Todos los componentes UI están en `frontend/components/ui/` y siguen el patrón **shadcn/ui**.

#### Uso de Componentes

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Variantes de Button
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Utilidades CSS

**Archivo:** `frontend/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Uso:

```typescript
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className
)}>
```

---

## ✅ Buenas Prácticas

### Backend

1. **Manejo de Errores Consistente**
   ```javascript
   try {
     // lógica
   } catch (error) {
     next(error); // Pasar al middleware de error
   }
   ```

2. **Validación de Datos**
   - Usar Joi para validar datos de entrada
   - Validar en el middleware antes del controlador

3. **Consultas SQL Seguras**
   ```javascript
   // ✅ CORRECTO - Usa parámetros
   await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
   
   // ❌ INCORRECTO - Vulnerable a SQL injection
   await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
   ```

4. **Estructura de Respuestas**
   ```javascript
   res.status(200).json({
     success: true,
     message: 'Operación exitosa',
     data: resultado
   });
   ```

5. **Documentación con Swagger**
   - Documentar todos los endpoints
   - Incluir ejemplos de request/response

### Frontend

1. **Componentes de Cliente vs Servidor**
   ```typescript
   // Cliente (interactivo)
   'use client';
   
   // Servidor (por defecto en Next.js 13+)
   export default function ServerComponent() {}
   ```

2. **Manejo de Estados**
   ```typescript
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [data, setData] = useState<Data[]>([]);
   ```

3. **Tipos TypeScript**
   ```typescript
   // Definir interfaces para todos los datos
   interface Usuario {
     id: number;
     nombre: string;
     email: string;
   }
   ```

4. **Manejo de Errores**
   ```typescript
   try {
     const response = await service.obtener();
     setData(response.data);
   } catch (error) {
     toast({
       title: 'Error',
       description: error.message,
       variant: 'destructive',
     });
   }
   ```

5. **Accesibilidad**
   - Usar etiquetas semánticas
   - Incluir `aria-labels`
   - Asegurar navegación por teclado

### Seguridad

1. **Variables de Entorno**
   - Nunca commitear `.env`
   - Usar variables para información sensible
   - Validar variables al inicio

2. **Autenticación**
   - Siempre verificar tokens
   - Usar HTTPS en producción
   - Implementar refresh tokens

3. **Autorización**
   - Verificar permisos en cada endpoint
   - No confiar en el frontend

4. **CORS**
   - Configurar orígenes permitidos
   - No usar `*` en producción

---

## 📝 Ejemplos Completos

### Ejemplo 1: CRUD Completo de "Categorías"

#### Backend

**Controller:** `backend/src/api/v1/controllers/categorias/categorias.controller.js`

```javascript
const { getPool } = require('../../../db');

const obtenerTodas = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        activo,
        created_at,
        updated_at
      FROM categorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `);
    
    res.status(200).json({
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM categorias WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const pool = getPool();
    
    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        id: result.insertId,
        nombre,
        descripcion
      }
    });
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    const pool = getPool();
    
    const [result] = await pool.query(
      'UPDATE categorias SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, activo, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    // Soft delete
    const [result] = await pool.query(
      'UPDATE categorias SET activo = 0 WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
```

**Routes:** `backend/src/api/v1/routes/categorias/categorias.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
} = require('../../controllers/categorias/categorias.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/roles.middleware');

router.get('/', authenticate, obtenerTodas);
router.get('/:id', authenticate, obtenerPorId);
router.post('/', authenticate, authorize(['admin']), crear);
router.put('/:id', authenticate, authorize(['admin']), actualizar);
router.delete('/:id', authenticate, authorize(['admin']), eliminar);

module.exports = router;
```

**Registrar en index.js:**

```javascript
const categoriasRoutes = require('./categorias/categorias.routes');
router.use('/categorias', categoriasRoutes);
```

#### Frontend

**Service:** `frontend/services/categorias/categorias.service.ts`

```typescript
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearCategoria {
  nombre: string;
  descripcion: string;
}

export const categoriasService = {
  obtenerTodas: async (): Promise<ApiResponse<Categoria[]>> => {
    const response = await apiClient.get<ApiResponse<Categoria[]>>('/categorias');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<ApiResponse<Categoria>> => {
    const response = await apiClient.get<ApiResponse<Categoria>>(`/categorias/${id}`);
    return response.data;
  },

  crear: async (data: CrearCategoria): Promise<ApiResponse<Categoria>> => {
    const response = await apiClient.post<ApiResponse<Categoria>>('/categorias', data);
    return response.data;
  },

  actualizar: async (id: number, data: Partial<Categoria>): Promise<ApiResponse<Categoria>> => {
    const response = await apiClient.put<ApiResponse<Categoria>>(`/categorias/${id}`, data);
    return response.data;
  },

  eliminar: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/categorias/${id}`);
    return response.data;
  }
};
```

**Page:** `frontend/app/admin/categorias/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { categoriasService, Categoria } from '@/services/categorias/categorias.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormularioCategoria } from './components/FormularioCategoria';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const response = await categoriasService.obtenerTodas();
      if (response.success) {
        setCategorias(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const eliminarCategoria = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

    try {
      const response = await categoriasService.eliminar(id);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Categoría eliminada correctamente',
        });
        cargarCategorias();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive',
      });
    }
  };

  const abrirEditar = (categoria: Categoria) => {
    setCategoriaEditar(categoria);
    setDialogAbierto(true);
  };

  const cerrarDialog = () => {
    setDialogAbierto(false);
    setCategoriaEditar(null);
  };

  const handleSuccess = () => {
    cargarCategorias();
    cerrarDialog();
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Categorías</CardTitle>
          <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
            <DialogTrigger asChild>
              <Button onClick={() => setCategoriaEditar(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>
              <FormularioCategoria
                onSuccess={handleSuccess}
                datosIniciales={categoriaEditar || undefined}
                idCategoria={categoriaEditar?.id}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell>{categoria.id}</TableCell>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell>{categoria.descripcion}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      categoria.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEditar(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarCategoria(categoria.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Form Component:** `frontend/app/admin/categorias/components/FormularioCategoria.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { categoriasService, Categoria } from '@/services/categorias/categorias.service';

const formSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
});

interface FormularioProps {
  onSuccess?: () => void;
  datosIniciales?: Categoria;
  idCategoria?: number;
}

export function FormularioCategoria({ onSuccess, datosIniciales, idCategoria }: FormularioProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: datosIniciales?.nombre || '',
      descripcion: datosIniciales?.descripcion || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let response;
      
      if (idCategoria) {
        response = await categoriasService.actualizar(idCategoria, values);
      } else {
        response = await categoriasService.crear(values);
      }

      if (response.success) {
        toast({
          title: 'Éxito',
          description: response.message,
        });
        form.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la categoría" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción de la categoría" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 🚀 Comandos Útiles

### Backend

```bash
# Desarrollo
cd backend
npm run dev

# Producción
npm start

# Docker
npm run docker:build
npm run docker:run
```

### Frontend

```bash
# Desarrollo
cd frontend
npm run dev

# Build
npm run build

# Producción
npm start

# Docker
npm run docker:build
npm run docker:run
```

---

## 📦 Dependencias Principales

### Backend
- **express** - Framework web
- **mysql2** - Cliente MySQL
- **jsonwebtoken** - Autenticación JWT
- **bcrypt** - Hash de contraseñas
- **joi** - Validación de datos
- **cors** - Control CORS
- **helmet** - Seguridad HTTP
- **morgan** - Logger HTTP
- **dotenv** - Variables de entorno
- **swagger-ui-express** - Documentación API

### Frontend
- **next** - Framework React
- **react** - Biblioteca UI
- **typescript** - Tipado estático
- **tailwindcss** - Estilos utility-first
- **axios** - Cliente HTTP
- **react-hook-form** - Manejo de formularios
- **zod** - Validación de esquemas
- **@radix-ui/** - Componentes primitivos
- **lucide-react** - Iconos
- **chart.js** - Gráficos

---

## 🔗 URLs Importantes

### Desarrollo
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

### Producción
- **Frontend:** http://62.146.231.110:3000
- **Backend API:** http://62.146.231.110:3000/api/v1

---

## 📞 Contacto y Soporte

Para soporte técnico o consultas:
- **Repositorio:** https://github.com/esteban2oo1/FormularioU
- **Branch:** mcl

---

**Última actualización:** Diciembre 2, 2025