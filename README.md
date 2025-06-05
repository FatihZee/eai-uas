<div align="center">
  <h1>Service to Service Communication</h1>
  <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWpod2FscDljYmxyN2p2dWF1czU5aTh6dXdwOGt0Z2lrYXV3NmowZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4EoR2uvw5dVeCNZC/giphy.gif" alt="Coding Enthusiasm" height="200"/>
</div>

Proyek ini merupakan implementasi sistem komunikasi antar service (**Service-to-Service Communication**)

Terdapat 4 service utama yang saling berkomunikasi:

- **User Service** – Mengelola data pengguna
- **Menu Service** – Menyediakan informasi menu makanan/minuman
- **Order Service** – Mencatat dan mengelola pesanan
- **Review Service** – Mengelola ulasan/review terhadap menu atau layanan

---

## Struktur Folder

```
.
├── user-service/
│   ├── controllers/
│   │   └── userController.js
│   ├── models/
│   │   └── userModel.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── menu-service/
│   ├── controllers/
│   │   └── menuController.js
│   ├── models/
│   │   └── menuModel.js
│   ├── routes/
│   │   └── menuRoutes.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── order-service/
│   ├── controllers/
│   │   └── orderController.js
│   ├── models/
│   │   └── orderModel.js
│   ├── routes/
│   │   └── orderRoutes.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── review-service/
│   ├── controllers/
│   │   └── reviewController.js
│   ├── models/
│   │   └── reviewModel.js
│   ├── routes/
│   │   └── reviewRoutes.js
│   ├── config/
│   │   └── db.js
│   ├── helpers/
│   │   └── sentimentAnalyzer.js
│   ├── app.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## 🚀 Cara Menjalankan

### 🔹 **Opsi 1: Jalankan Tiap Service Secara Manual**

Masuk ke masing-masing folder service, install dependencies, dan jalankan:

```powershell
cd .\user-service\
npm install
npm run dev
```

Lakukan hal yang sama untuk:
- `menu-service`
- `order-service`
- `review-service`

---

### 🔹 **Opsi 2: Jalankan Semua Service Sekaligus (Direkomendasikan)**

Install dulu dependency utama (di root) untuk menjalankan semua service sekaligus:

```powershell
npm install
```

> ⚠️ Pastikan sebelumnya sudah install dependencies untuk masing-masing service:

```powershell
cd .\user-service\; npm install
cd ..\menu-service\; npm install
cd ..\order-service\; npm install
cd ..\review-service\; npm install
cd ..
```

Setelah itu, cukup jalankan:

```powershell
npm run dev
```

Perintah ini akan secara otomatis:
- Masuk ke tiap folder service
- Menjalankan `npm run dev` di masing-masing service
- Semua berjalan paralel menggunakan package `concurrently`

---

# 🍽 EAI Microservices SQL Setup

Sebelum menjalankan aplikasi, **pastikan kamu sudah membuat database dan tabelnya terlebih dahulu.**  
Setiap microservice menggunakan database yang berbeda dengan format nama:

```
eai_<nama_service>
```

Contoh:
- `eai_user_service`
- `eai_menu_service`
- `eai_order_service`
- `eai_review_service`

---

## 🔧 Langkah Setup

### 1. Buat Database

Masuk ke MySQL dan jalankan perintah berikut:

```sql
CREATE DATABASE eai_user_service;
CREATE DATABASE eai_menu_service;
CREATE DATABASE eai_order_service;
CREATE DATABASE eai_review_service;
```

### 2. Masuk ke Masing-Masing Database dan Buat Tabel

#### 🧑 User Service (`eai_user_service`)

```sql
USE eai_user_service;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

#### 📋 Menu Service (`eai_menu_service`)

```sql
USE eai_menu_service;

CREATE TABLE `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

#### 🧾 Order Service (`eai_order_service`)

```sql
USE eai_order_service;

CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `quantity` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

#### ⭐ Review Service (`eai_review_service`)

```sql
USE eai_review_service;

CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `order_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `sentiment` VARCHAR(50),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `menu_id` (`menu_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

### 📥 Cara Import Koleksi dan Environment Postman

Untuk mempermudah pengujian API, kamu bisa menggunakan file koleksi dan environment Postman yang telah disiapkan.

#### ✅ Import Koleksi Request: `Z-UTS-EAI.postman_collection.json`

1. **Buka aplikasi [Postman](https://www.postman.com/)**.
2. Klik tombol **"Import"** di pojok kiri atas.
3. Pilih tab **"File"**, lalu klik **"Upload Files"**.
4. Pilih file berikut:
   - `Z-UTS-EAI.postman_collection.json`
5. Klik **"Open"** untuk mengimpor.

Setelah berhasil, koleksi bernama **Z-UTS-EAI** akan muncul di sidebar kiri.

#### ✅ Import Environment: `UTS-EAI.postman_environment.json`

1. Ulangi langkah **Import**, lalu pilih file:
   - `UTS-EAI.postman_environment.json`
2. Setelah diimpor, klik icon gear ⚙️ di kanan atas (Manage Environments).
3. Pilih environment **UTS-EAI**, lalu klik **"Set Active"**.

---

### 🛡️ Catatan tentang Environment

Environment ini berisi **variabel `token`** yang digunakan untuk menyimpan JWT token hasil login. Token ini akan secara otomatis dimasukkan ke header `Authorization` saat mengakses endpoint yang membutuhkan autentikasi.  

Jadi kamu hanya perlu login satu kali, lalu token-nya bisa digunakan untuk request lain secara otomatis tanpa perlu tempel ulang manual.

---

# Penjelasan Masing-Masing Service

## 📘 User Service API Documentation

### Base URL: `/users`

---

### POST `/users/login`

**Deskripsi:**  
Login user berdasarkan email dan password.

**Request Body:**
```json
{
  "email": "fatih@example.com",
  "password": "fatih123"
}
```

**Response:**
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJmYXRpaEBleGFtcGxlLmNvbSIsIm5hbWUiOiJGYXRpaCBGaWtyeSBPa3RhdmlhbnRvIiwiaWF0IjoxNzQ0OTc4NDA3LCJleHAiOjE3NDQ5ODIwMDd9.4mEJYpyl9FnPqisKeQAO54VhhNjO6Uv0EZrSB1DEgoo",
    "user": {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "phone": "085713309551"
    }
}
```

---

### POST `/users/register`

**Deskripsi:**  
Register / daftar user baru.

**Request Body:**
```json
{
  "name": "Fatih Fikry Oktavianto",
  "email": "fatih@example.com",
  "password": "fatih123",
  "phone": "085713309551"
}
```

**Response:**
```json
{
    "id": 2,
    "name": "Fatih Fikry Oktavianto",
    "email": "fatih@example.com",
    "phone": "085713309551"
}
```

---

### GET `/users/`

**Deskripsi:**  
Mengambil seluruh data user.

**Response:**
```json
[
    {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "password": "$2b$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O",
        "phone": "085713309551",
        "created_at": "2025-04-18T11:10:51.000Z",
        "updated_at": "2025-04-18T11:10:51.000Z"
    }
]
```

---

### GET `/users/:id`

**Deskripsi:**  
Mengambil data user berdasarkan ID.

**Params:**
- `id` – ID user (integer)

**Response:**
```json
{
    "id": 2,
    "name": "Fatih Fikry Oktavianto",
    "email": "fatih@example.com",
    "password": "$2b$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O",
    "phone": "085713309551",
    "created_at": "2025-04-18T11:10:51.000Z",
    "updated_at": "2025-04-18T11:10:51.000Z"
}
```

---

### PUT `/users/:id`

**Deskripsi:**  
Mengupdate data user berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID user (integer)

**Request Body:**
```json
{
  "name": "Fatih Fikry Oktavianto",
  "email": "fatih@example.com",
  "password": "fatih123",
  "phone": "081234567890"
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

---

### DELETE `/users/:id`

**Deskripsi:**  
Menghapus user berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID user (integer)

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

### GET `/users/:id/with-orders-reviews`

**Deskripsi:**  
Mengambil data lengkap user beserta daftar order dan review yang pernah dibuat.

**Params:**
- `id` – ID user (integer)

**Response:**
```json
{
    "user": {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "phone": "085713309551"
    },
    "orders": [
        {
            "order_id": 4,
            "menu_name": "Nasi Goreng Jawa",
            "quantity": 10,
            "total_price": "250000.00",
            "reviews": [
                {
                    "review_id": 2,
                    "rating": 5,
                    "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah."
                },
                {
                    "review_id": 3,
                    "rating": 2,
                    "comment": "Biasa Aja"
                }
            ]
        }
    ]
}
```

---

### 🍔 Menu Service
Berikut dokumentasi lengkap untuk **Menu Service** berdasarkan route yang kamu kasih:

---

## 📘 Menu Service API Documentation

### Base URL: `/menus`

---

### POST `/menus/`

**Deskripsi:**  
Menambahkan menu baru ke dalam sistem.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Nasi Goreng Jawa",
  "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
  "price": 25000
}
```

**Response:**
```json
{
    "message": "Menu created successfully",
    "menuId": 3,
    "createdBy": {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "password": "$2b$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O",
        "phone": "085713309551",
        "created_at": "2025-04-18T11:10:51.000Z",
        "updated_at": "2025-04-18T11:10:51.000Z"
    }
}
```

---

### PUT `/menus/:id`

**Deskripsi:**  
Mengupdate data menu berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID menu (integer)

**Request Body:**
```json
{
  "name": "Nasi Goreng Spesial Gila",
  "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
  "price": 25000
}
```

**Response:**
```json
{
  "message": "Menu updated successfully"
}
```

---

### DELETE `/menus/:id`

**Deskripsi:**  
Menghapus menu berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID menu (integer)

**Response:**
```json
{
  "message": "Menu deleted successfully"
}
```

---

### GET `/menus/`

**Deskripsi:**  
Mengambil seluruh daftar menu.

**Response:**
```json
[
    {
        "id": 3,
        "name": "Nasi Goreng Jawa",
        "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
        "price": "25000.00",
        "user_id": 2,
        "created_at": "2025-04-18T11:14:40.000Z",
        "updated_at": "2025-04-18T11:14:40.000Z",
        "orderCount": 0
    }
]
```

---

### GET `/menus/:id`

**Deskripsi:**  
Mengambil informasi menu berdasarkan ID.

**Params:**
- `id` – ID menu (integer)

**Response:**
```json
{
    "id": 3,
    "name": "Nasi Goreng Jawa",
    "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
    "price": "25000.00",
    "user_id": 2,
    "created_at": "2025-04-18T11:14:40.000Z",
    "updated_at": "2025-04-18T11:14:40.000Z"
}
```

---

### 📦 Order Service
Berikut dokumentasi lengkap untuk **Order Service** berdasarkan route yang kamu kasih:

---

## 📘 Order Service API Documentation

### Base URL: `/orders`

---

### GET `/orders/`

**Deskripsi:**  
Mengambil seluruh data pesanan.

**Response:**
```json
[
    {
        "id": 4,
        "user_id": 2,
        "menu_id": 3,
        "quantity": 10,
        "total_price": "250000.00",
        "created_at": "2025-04-18T11:15:43.000Z"
    }
    ...
]
```

---

### GET `/orders/:id`

**Deskripsi:**  
Mengambil data pesanan berdasarkan ID pesanan.

**Params:**
- `id` – ID pesanan (integer)

**Response:**
```json
{
    "id": 4,
    "user_id": 2,
    "menu_id": 3,
    "quantity": 10,
    "total_price": "250000.00",
    "created_at": "2025-04-18T11:15:43.000Z"
}
```

---

### POST `/orders/`

**Deskripsi:**  
Membuat pesanan baru.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "menuId": 3,
  "quantity": 10
}
```

**Response:**
```json
{
    "message": "Order created successfully",
    "order": {
        "id": 4,
        "user_id": 2,
        "menu_id": 3,
        "quantity": 10,
        "total_price": 250000,
        "user": {
            "id": 2,
            "name": "Fatih Fikry Oktavianto",
            "email": "fatih@example.com",
            "phone": "085713309551",
            "created_at": "2025-04-18T11:10:51.000Z",
            "updated_at": "2025-04-18T11:10:51.000Z"
        },
        "menu": {
            "id": 3,
            "name": "Nasi Goreng Jawa",
            "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
            "price": "25000.00",
            "user_id": 2,
            "created_at": "2025-04-18T11:14:40.000Z",
            "updated_at": "2025-04-18T11:14:40.000Z"
        }
    }
}
```

---

### PUT `/orders/:id`

**Deskripsi:**  
Mengupdate data pesanan berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID pesanan (integer)

**Request Body:**
```json
{
  "menuId": 1,
  "quantity": 15
}
```

**Response:**
```json
{
    "message": "Order updated successfully",
    "order": {
        "id": "3",
        "user_id": 1,
        "menu_id": 1,
        "quantity": 15,
        "total_price": 375000,
        "user": {
            "id": 1,
            "name": "Fatih Fikry Oktavianto",
            "email": "fatih@example.com",
            "phone": "081234567890",
            "created_at": "2025-04-18T03:51:18.000Z",
            "updated_at": "2025-04-18T03:56:23.000Z"
        },
        "menu": {
            "id": 1,
            "name": "Nasi Goreng Spesial Gila",
            "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
            "price": "25000.00",
            "user_id": null,
            "created_at": "2025-04-18T03:59:41.000Z",
            "updated_at": "2025-04-18T04:00:24.000Z"
        }
    }
}
```

---

### DELETE `/orders/:id`

**Deskripsi:**  
Menghapus pesanan berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID pesanan (integer)

**Response:**
```json
{
  "message": "Order deleted successfully"
}
```

---

### GET `/orders/user/:userId`

**Deskripsi:**  
Mengambil semua pesanan berdasarkan ID pengguna.

**Params:**
- `userId` – ID user (integer)

**Response:**
```json
[
    {
        "id": 4,
        "user_id": 2,
        "menu_id": 3,
        "quantity": 10,
        "total_price": "250000.00",
        "created_at": "2025-04-18T11:15:43.000Z"
    }
    ...
]
```

---

### GET `/orders/menu/:menuId`

**Deskripsi:**  
Mengambil jumlah pesanan untuk menu tertentu.

**Params:**
- `menuId` – ID menu (integer)

**Response:**
```json
{
    "count": 1
}
```

---

### ⭐ Review Service
Berikut dokumentasi lengkap untuk **Review Service** berdasarkan route yang kamu kasih:

---

## 📘 Review Service API Documentation

### Base URL: `/reviews`

---

### GET `/reviews/`

**Deskripsi:**  
Mengambil seluruh ulasan (review).

**Response:**
```json
[
    {
        "id": 2,
        "user_id": 2,
        "menu_id": 3,
        "order_id": 4,
        "rating": 5,
        "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah.",
        "created_at": "2025-04-18T11:19:49.000Z",
        "updated_at": "2025-04-18T11:19:48.000Z",
        "user": {
            "id": 2,
            "name": "Fatih Fikry Oktavianto",
            "email": "fatih@example.com",
            "phone": "085713309551",
            "created_at": "2025-04-18T11:10:51.000Z",
            "updated_at": "2025-04-18T11:10:51.000Z"
        },
        "menu": {
            "id": 3,
            "name": "Nasi Goreng Jawa",
            "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
            "price": "25000.00",
            "user_id": 2,
            "created_at": "2025-04-18T11:14:40.000Z",
            "updated_at": "2025-04-18T11:14:40.000Z"
        }
    },
    {
        "id": 3,
        "user_id": 2,
        "menu_id": 3,
        "order_id": 4,
        "rating": 2,
        "comment": "Biasa Aja",
        "created_at": "2025-04-18T12:10:59.000Z",
        "updated_at": "2025-04-18T12:16:08.000Z",
        "user": {
            "id": 2,
            "name": "Fatih Fikry Oktavianto",
            "email": "fatih@example.com",
            "phone": "085713309551",
            "created_at": "2025-04-18T11:10:51.000Z",
            "updated_at": "2025-04-18T11:10:51.000Z"
        },
        "menu": {
            "id": 3,
            "name": "Nasi Goreng Jawa",
            "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
            "price": "25000.00",
            "user_id": 2,
            "created_at": "2025-04-18T11:14:40.000Z",
            "updated_at": "2025-04-18T11:14:40.000Z"
        }
    },
    ...
]
```

---

### GET `/reviews/:id`

**Deskripsi:**  
Mengambil review berdasarkan ID.

**Params:**
- `id` – ID review (integer)

**Response:**
```json
{
    "id": 3,
    "user_id": 2,
    "menu_id": 3,
    "order_id": 4,
    "rating": 4,
    "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah banget pastinya",
    "created_at": "2025-04-18T12:10:59.000Z",
    "updated_at": "2025-04-18T12:10:58.000Z",
    "user": {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "phone": "085713309551",
        "created_at": "2025-04-18T11:10:51.000Z",
        "updated_at": "2025-04-18T11:10:51.000Z"
    },
    "menu": {
        "id": 3,
        "name": "Nasi Goreng Jawa",
        "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
        "price": "25000.00",
        "user_id": 2,
        "created_at": "2025-04-18T11:14:40.000Z",
        "updated_at": "2025-04-18T11:14:40.000Z"
    },
    "order": {
        "id": 4,
        "user_id": 2,
        "menu_id": 3,
        "quantity": 10,
        "total_price": "250000.00",
        "created_at": "2025-04-18T11:15:43.000Z"
    }
}
```

---

### GET `/reviews/menu/:menuId`

**Deskripsi:**  
Mengambil seluruh review untuk menu tertentu.

**Params:**
- `menuId` – ID menu (integer)

**Response:**
```json
{
    "menu": {
        "id": 3,
        "name": "Nasi Goreng Jawa",
        "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
        "price": "25000.00",
        "user_id": 2,
        "created_at": "2025-04-18T11:14:40.000Z",
        "updated_at": "2025-04-18T11:14:40.000Z"
    },
    "averageRating": "5.0000",
    "reviewCount": 1,
    "reviews": [
        {
            "id": 2,
            "user_id": 2,
            "menu_id": 3,
            "order_id": 4,
            "rating": 5,
            "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah.",
            "created_at": "2025-04-18T11:19:49.000Z",
            "updated_at": "2025-04-18T11:19:48.000Z",
            "user": {
                "id": 2,
                "name": "Fatih Fikry Oktavianto",
                "email": "fatih@example.com",
                "phone": "085713309551",
                "created_at": "2025-04-18T11:10:51.000Z",
                "updated_at": "2025-04-18T11:10:51.000Z"
            }
        }
    ]
}
```

---

### GET `/reviews/user/:userId`

**Deskripsi:**  
Mengambil semua review yang dibuat oleh user tertentu.

**Params:**
- `userId` – ID user (integer)

**Response:**
```json
{
    "user": {
        "id": 2,
        "name": "Fatih Fikry Oktavianto",
        "email": "fatih@example.com",
        "phone": "085713309551",
        "created_at": "2025-04-18T11:10:51.000Z",
        "updated_at": "2025-04-18T11:10:51.000Z"
    },
    "reviews": [
        {
            "id": 2,
            "user_id": 2,
            "menu_id": 3,
            "order_id": 4,
            "rating": 5,
            "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah.",
            "created_at": "2025-04-18T11:19:49.000Z",
            "updated_at": "2025-04-18T11:19:48.000Z",
            "menu": {
                "id": 3,
                "name": "Nasi Goreng Jawa",
                "description": "Nasi goreng dengan topping ayam, telur, dan kerupuk",
                "price": "25000.00",
                "user_id": 2,
                "created_at": "2025-04-18T11:14:40.000Z",
                "updated_at": "2025-04-18T11:14:40.000Z"
            }
        }
    ]
}
```

---

### GET `/reviews/stats/menu/:menuId`

**Deskripsi:**  
Mengambil statistik review (misalnya rata-rata rating) untuk sebuah menu.

**Params:**
- `menuId` – ID menu (integer)

**Response:**
```json
{
    "menuId": "3",
    "averageRating": "3.5000",
    "reviewCount": 2
}
```

---

### POST `/reviews/`

**Deskripsi:**  
Menambahkan review baru.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "orderId": 4,
  "rating": 4,
  "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah banget pastinya"
}
```

**Response:**
```json
{
    "message": "Review created successfully",
    "review": {
        "id": 3,
        "user_id": 2,
        "menu_id": 3,
        "order_id": 4,
        "rating": 4,
        "comment": "Makanan enak dan porsi cukup besar. Pelayanan ramah banget pastinya",
        "created_at": "2025-04-18T12:10:58.765Z"
    }
}
```

---

### PUT `/reviews/:id`

**Deskripsi:**  
Mengupdate review berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID review (integer)

**Request Body:**
```json
{
  "orderId": 4,
  "rating": 2,
  "comment": "Biasa Aja"
}
```

**Response:**
```json
{
    "message": "Review updated successfully"
}
```

---

### DELETE `/reviews/:id`

**Deskripsi:**  
Menghapus review berdasarkan ID.  
**(Protected route - butuh token)**

**Headers:**
```http
Authorization: Bearer <token>
```

**Params:**
- `id` – ID review (integer)

**Response:**
```json
{
  "message": "Review deleted successfully"
}
```


---

### GET `/menus/:menuId/reviews/sentiment/:sentiment`

**Deskripsi:**  
Mengambil daftar review berdasarkan `menuId` dan `sentiment` tertentu (misalnya positif, negatif, atau netral).

**Params:**
- `menuId` – ID menu (integer)
- `sentiment` – Sentimen review (`positive`, `negative`, `neutral`)

**Response:**
```json
{
    "menuId": "3",
    "sentiment": "negative",
    "reviewCount": 1,
    "reviews": [
        {
            "id": 5,
            "user_id": 2,
            "menu_id": 3,
            "order_id": 4,
            "rating": 1,
            "comment": "The food was awful, it was cold, tasteless, and the portion size was ridiculously small. I won't be coming back here again!",
            "sentiment": "negative",
            "created_at": "2025-04-18T18:32:18.000Z",
            "updated_at": "2025-04-18T18:32:18.000Z",
            "user": {
                "id": 2,
                "name": "Fatih Fikry Oktavianto",
                "email": "fatih@example.com",
                "phone": "085713309551",
                "created_at": "2025-04-18T11:10:51.000Z",
                "updated_at": "2025-04-18T11:10:51.000Z"
            }
        }
    ]
}
```

---

### GET `/menus/:menuId/sentiment-stats`

**Deskripsi:**  
Mengambil statistik jumlah review berdasarkan sentimen untuk sebuah menu.

**Params:**
- `menuId` – ID menu (integer)

**Response:**
```json
{
    "menuId": "3",
    "sentimentStats": {
        "positive": 1,
        "negative": 1,
        "neutral": 1,
        "total": 5,
        "null": 2,
        "positivePercentage": 20,
        "negativePercentage": 20,
        "neutralPercentage": 20
    }
}
```

---

### 📦 `sentimentAnalyzer.js`

**Deskripsi:**  
Modul ini menggunakan _Natural Language Processing (NLP)_ dengan pustaka `node-nlp` untuk menganalisis sentimen review makanan dalam bahasa Indonesia. Fungsinya mendeteksi apakah suatu review bernada **positif**, **netral**, atau **negatif**.

Modul ini merupakan bentuk pemanfaatan **Tren AI** dalam pengolahan bahasa alami (_Natural Language Understanding_) sebagai inovasi untuk meningkatkan fitur analisis data secara otomatis.

---

### 🔍 Fungsi Utama

#### `initializeSentimentAnalyzer()`

**Deskripsi:**  
Melatih model NLP berdasarkan kumpulan contoh kalimat yang dikategorikan sebagai positif, netral, atau negatif. Fungsi ini perlu dipanggil **sebelum pemrosesan pertama** jika model belum terinisialisasi.

**Return:**  
- `manager` (instance dari `NlpManager` yang telah terlatih)

---

#### `analyzeSentiment(text)`

**Deskripsi:**  
Menganalisis sentimen dari teks review dan mengembalikan label sentimen (`positive`, `neutral`, `negative`).  
Jika confidence dari model NLP rendah, maka sistem akan menggunakan pendekatan **analisis berbasis keyword** sebagai fallback untuk hasil yang lebih akurat.

**Params:**
- `text` (string): Kalimat atau paragraf review dari pengguna

**Return:**
- `sentimentLabel` (string): Label sentimen (`positive`, `neutral`, `negative`)

---

### 💡 Nilai Tambah & Inovasi

- ✅ Menggunakan model NLP berbasis AI untuk memahami bahasa alami
- ✅ Review baru dapat diklasifikasikan secara otomatis **tanpa perlu dilabeli satu per satu**
- ✅ Adaptif terhadap review dalam bahasa Indonesia
- ✅ Memperkaya fitur analisis seperti statistik sentimen per menu
- ✅ Dapat dikembangkan lebih lanjut dengan pelatihan tambahan atau integrasi model eksternal

---

### 🧪 Contoh Penggunaan

```js
const { analyzeSentiment } = require('./helpers/sentimentAnalyzer');

(async () => {
  const result = await analyzeSentiment('Makanannya enak banget, recommended!');
  console.log(result); // Output: "positive"
})();
```

---

## 📡 **Dokumentasi Komunikasi Antar Layanan (Implementasi)**

Semua layanan dalam sistem ini berkomunikasi menggunakan **HTTP REST API** untuk melakukan pertukaran data antar layanan yang berbeda. Setiap layanan memiliki endpoint tertentu yang dipanggil oleh layanan lain sesuai dengan kebutuhan fungsionalitasnya.

### **Diagram Komunikasi Antar Service**
Komunikasi antar service diatur sedemikian rupa untuk memenuhi fungsionalitas yang dibutuhkan oleh tiap-tiap modul. Berikut adalah beberapa contoh bagaimana layanan berkomunikasi:

1. **Order Service** akan:
   - Memanggil **User Service** untuk mengecek validitas `user_id`.
   - Memanggil **Menu Service** untuk mengecek keberadaan dan detail dari `menu_id`.

2. **Review Service** akan:
   - Mengambil informasi dari **User Service** dan **Menu Service** sebelum menyimpan review baru untuk memastikan informasi terkait `user_id` dan `menu_id` valid.

3. **Layanan lainnya** juga berinteraksi serupa untuk memastikan data yang digunakan oleh setiap layanan selalu terkini dan akurat.

---

### **Rincian API dan Komunikasi Layanan**

#### 1. **User Service**
- **`getUserWithOrdersAndReviews` (Controller `user`)**
  - **Deskripsi:** Mengambil informasi pengguna beserta pesanan dan review terkait.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${userId}` – Mendapatkan detail pengguna.
    - `GET http://localhost:3003/orders/user/${userId}` – Mendapatkan pesanan oleh pengguna.
    - `GET http://localhost:3002/menus/${order.menu_id}` – Mendapatkan detail menu dari pesanan.
    - `GET http://localhost:3004/reviews?menuId=${order.menu_id}` – Mendapatkan review berdasarkan `menu_id` dari pesanan.

#### 2. **Menu Service**
- **`getAllMenus` (Controller `menu`)**
  - **Deskripsi:** Mengambil semua menu yang ada beserta detail pesanan terkait.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3003/orders/menu/${menu.id}` – Mendapatkan pesanan berdasarkan `menu_id`.
  
- **`createMenu` (Controller `menu`)**
  - **Deskripsi:** Membuat menu baru, dan memverifikasi pengguna yang membuat menu.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${userId}` – Mendapatkan detail pengguna yang membuat menu baru.

#### 3. **Order Service**
- **`createOrder` (Controller `order`)**
  - **Deskripsi:** Membuat pesanan baru dan memverifikasi pengguna serta menu yang dipilih.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${userId}` – Memverifikasi pengguna yang membuat pesanan.
    - `GET http://localhost:3002/menus/${menuId}` – Memverifikasi menu yang dipesan.

- **`updateOrder` (Controller `order`)**
  - **Deskripsi:** Memperbarui pesanan dan memverifikasi pengguna serta menu yang dipilih.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${userId}` – Memverifikasi pengguna yang mengubah pesanan.
    - `GET http://localhost:3002/menus/${menuId}` – Memverifikasi menu yang dipesan.

#### 4. **Review Service**
- **`getAllReviews` (Controller `review`)**
  - **Deskripsi:** Mengambil semua review beserta informasi pengguna dan menu terkait.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${review.user_id}` – Mendapatkan detail pengguna dari review.
    - `GET http://localhost:3002/menus/${review.menu_id}` – Mendapatkan detail menu dari review.

- **`getReviewById` (Controller `review`)**
  - **Deskripsi:** Mengambil review berdasarkan `review_id` dan memastikan data pengguna serta pesanan terkait.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${review.user_id}` – Mendapatkan detail pengguna.
    - `GET http://localhost:3002/menus/${review.menu_id}` – Mendapatkan detail menu.
    - `GET http://localhost:3003/orders/${review.order_id}` – Mendapatkan detail pesanan yang terkait.

- **`createReview` (Controller `review`)**
  - **Deskripsi:** Membuat review baru berdasarkan pesanan dan menu yang ada.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3003/orders/${orderId}` – Mendapatkan detail pesanan.
    - `GET http://localhost:3002/menus/${order.menu_id}` – Mendapatkan detail menu dari pesanan.

- **`updateReview` (Controller `review`)**
  - **Deskripsi:** Memperbarui review yang telah ada.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3003/orders/${review.order_id}` – Mendapatkan detail pesanan terkait review yang diubah.

- **`getReviewsByUserId` (Controller `review`)**
  - **Deskripsi:** Mengambil semua review yang dibuat oleh pengguna berdasarkan `user_id`.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${userId}` – Mendapatkan detail pengguna.
    - `GET http://localhost:3002/menus/${review.menu_id}` – Mendapatkan detail menu yang di-review.

- **`getReviewsByMenuId` (Controller `review`)**
  - **Deskripsi:** Mengambil semua review berdasarkan `menu_id`.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3002/menus/${menuId}` – Mendapatkan detail menu.
    - `GET http://localhost:3001/users/${review.user_id}` – Mendapatkan detail pengguna dari review.

- **`getReviewsByMenuIdAndSentiment` (Controller `review`)**
  - **Deskripsi:** Mengambil review berdasarkan `menu_id` dan sentimen tertentu.
  - **Endpoint yang Digunakan:**
    - `GET http://localhost:3001/users/${review.user_id}` – Mendapatkan detail pengguna.

---

### **Kesimpulan**
Dokumentasi ini menggambarkan bagaimana setiap layanan dalam sistem berkomunikasi untuk memastikan data yang diperlukan oleh satu layanan dapat diakses oleh layanan lainnya. Komunikasi antar layanan menggunakan HTTP REST API dengan standar URL yang konsisten agar mudah dipahami dan diimplementasikan.

Dengan pendekatan ini, kita memastikan bahwa **data antar layanan tetap konsisten**, dan **setiap layanan dapat saling berinteraksi dengan efisien**. Ini juga mendukung skalabilitas, sehingga sistem dapat berkembang dan diintegrasikan dengan layanan lain di masa depan.

---

## Port yang Digunakan di dalam Kode

| Service         | Port |
|-----------------|------|
| User Service     | 3001 |
| Menu Service     | 3002 |
| Order Service    | 3003 |
| Review Service   | 3004 |

---

## 🚀 **Teknologi yang Digunakan**

- **Node.js & Express**: Platform dan framework untuk pengembangan aplikasi backend dengan JavaScript.
- **JSON Format**: Format data untuk komunikasi antar server dan klien.
- **Bcrypt**: Untuk mengenkripsi dan memvalidasi password pengguna.
- **JWT (JSON Web Token)**: Untuk otentikasi dan otorisasi pengguna.
- **Node-NLP**: Pustaka untuk pengolahan bahasa alami, seperti analisis sentimen.
- **Sentiment Analysis**: Untuk menganalisis sentimen positif, negatif, atau netral dari teks ulasan.