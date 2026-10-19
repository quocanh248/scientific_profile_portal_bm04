# Quy ước router

Frontend dùng React Router nhưng tổ chức file theo phong cách gần Next.js.

- `page.tsx`: trang mặc định của thư mục.
- `components.tsx`, `EvidenceSection.tsx`, `RelatedCheck.tsx`: component phụ, không tự tạo URL.
- Route mới phải được khai báo trong `src/router/index.tsx` vì Vite không có file-based routing tự động.

Ví dụ:

```text
src/router/signature/page.tsx   -> /signature
src/router/works/page.tsx       -> /works
```

Nếu sau này có trang chi tiết:

```text
src/router/works/[id].tsx
```

thì map trong `router/index.tsx` bằng `path="works/:id"`.
