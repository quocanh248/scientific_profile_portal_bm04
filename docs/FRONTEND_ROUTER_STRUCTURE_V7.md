# Frontend file-based style routing (V7 DEV)

Bản này giữ nguyên API/backend và các chức năng nghiệp vụ của V6.4, nhưng tổ chức frontend theo phong cách gần Next.js: mỗi URL có một thư mục trong `src/router`, file mặc định của trang là `page.tsx`.

## Quy ước URL → source

- `/` → `src/router/page.tsx`
- `/profile` → `src/router/profile/page.tsx`
- `/works` → `src/router/works/page.tsx`
- `/approvals` → `src/router/approvals/page.tsx`
- `/signature` → `src/router/signature/page.tsx`
- `/reports` → `src/router/reports/page.tsx`
- `/admin` → `src/router/admin/page.tsx`
- `/password` → `src/router/password/page.tsx`
- `/login` → `src/router/login/page.tsx`

Vite không có file router tự động như Next.js, nên `src/router/index.tsx` là bảng ánh xạ URL → page. Khi thêm trang mới, tạo thư mục + `page.tsx`, sau đó thêm một `<Route>` ở file này.

## Shared code

- `src/app/AppContext.tsx`: user, catalog, login/logout, thông báo.
- `src/app/routes.ts`: metadata menu/route.
- `src/layouts/AppLayout.tsx`: sidebar, topbar, `<Outlet/>`.
- `src/components/ui.tsx`: Card, Field, Badge, Empty, helper ngày/hiệu lực minh chứng.
- `src/router/profile/components.tsx`: bảng con của Lý lịch BM-04.
- `src/router/profile/EvidenceSection.tsx`: quản lý minh chứng.

## Route con

Nếu sau này cần `/works/detail` có thể tạo `src/router/works/detail.tsx` và map trong `src/router/index.tsx`. Nếu cần `/works/:id`, nên đặt file dễ nhận biết như `src/router/works/[id].tsx` rồi map `path="works/:id"`.
