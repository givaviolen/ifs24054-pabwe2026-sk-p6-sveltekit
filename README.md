# ifs24054-pabwe2026-sk-p6-sveltekit

Delcom Courses — Studi Kasus 2 PABWE 2026 P6 (SvelteKit 3 + TypeScript + Svelte 5, adapter-bun, Tailwind CSS v4).

## Menjalankan

```bash
bun install
bun run dev            # http://localhost:3005
bun run test:coverage  # threshold 100%
bun run build && bun start
```

`.env` memuat `VITE_DELCOM_BASEURL` dan `APP_PORT=3005`.

## Titik yang perlu dicocokkan dengan dokumentasi API

Semua jalur endpoint ada di `src/features/courses/api/courseApi.ts` dan
`src/features/users/api/userApi.ts`. Bila dokumentasi
https://open-api.delcom.org/docs/1.0/api-courses berbeda, ubah di dua berkas itu saja:

- peserta: `POST/DELETE /courses/:id/students`
- rating: `POST /courses/:id/ratings` dengan body `{ rating }`
- status belajar: `PUT /courses/-/contents/:id/learns` dengan body `{ status: 0|1 }`
- body konten: `{ title, youtube }`
- ubah kata sandi: `PUT /users/password` dengan `{ password, new_password }`; foto: `POST /users/photo`
