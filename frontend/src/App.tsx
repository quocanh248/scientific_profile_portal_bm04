import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  api,
  download,
  downloadPost,
  openInline,
  labels,
  roleLabels,
  type User,
  type Catalog,
  type Work,
  type Approval,
  type Report,
  type Lecturer,
  type ProfileData,
  type EducationRecord,
  type IPRecord,
  type PracticalRecord,
  type TaskRecord,
  type AwardRecord,
  type EmploymentRecord,
  type EvidenceDocument,
  type NotificationItem,
  type ApiError,
  type SigningIdentity,
  type SignatureVerification,
  type ApprovalPage,
  type ApprovalDetail,
  type ApprovalVerificationItem,
} from "./api";
import {
  DialogHost,
  showMessage,
  askConfirm,
  askText,
  askPassword,
} from "./dialog";

type Page =
  | "dashboard"
  | "profile"
  | "works"
  | "approvals"
  | "reports"
  | "admin"
  | "password";
const currentYear = new Date().getFullYear();
function datefmt(s?: string | null) {
  return s ? new Date(s).toLocaleDateString("vi-VN") : "—";
}
function evidenceState(ev: EvidenceDocument) {
  if (ev.validity_mode !== "fixed")
    return { key: "indefinite", label: "∞ Vô thời hạn", invalid: false };
  if (ev.valid_from) {
    const start = new Date(`${ev.valid_from}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (now < start)
      return {
        key: "not-yet-valid",
        label: `Chưa có hiệu lực · từ ${datefmt(ev.valid_from)}`,
        invalid: true,
      };
  }
  if (!ev.valid_until)
    return { key: "expired", label: "Thiếu ngày hết hiệu lực", invalid: true };
  const end = new Date(`${ev.valid_until}T00:00:00`),
    now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (days < 0)
    return {
      key: "expired",
      label: `✕ Hết hiệu lực · ${datefmt(ev.valid_until)}`,
      invalid: true,
    };
  if (days <= 30)
    return {
      key: "expiring",
      label: `⚠ Sắp hết hiệu lực · còn ${days} ngày`,
      invalid: false,
    };
  return {
    key: "valid",
    label: `✓ Còn hiệu lực · đến ${datefmt(ev.valid_until)}`,
    invalid: false,
  };
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>{labels[status] || status}</span>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Card({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-header">
        {title && <h3>{title}</h3>}
        {actions}
      </div>
      {children}
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <FileText size={30} />
      <p>{text}</p>
    </div>
  );
}
function Stat({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
function yearInput(
  value: number | null | undefined,
  onChange: (n: number | null) => void,
) {
  return (
    <input
      type="number"
      min="1900"
      max={currentYear + 2}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    />
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [page, setPage] = useState<Page>("dashboard");
  const [catalog, setCatalog] = useState<Catalog>({
      departments: [],
      work_types: [],
      talent_categories: [],
      registered_roles: [],
    }),
    [menu, setMenu] = useState(false);
  function tell(message: string, error = false) {
    void showMessage(message, error);
  }
  async function bootstrap() {
    try {
      await api("csrf/");
      const u = await api<User>("me/");
      setUser(u);
      setCatalog(await api<Catalog>("catalogs/"));
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void bootstrap();
  }, []);
  async function logout() {
    try {
      await api("logout/", "POST");
      setUser(null);
      setPage("dashboard");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  if (!ready) return <div className="loading">Đang tải hệ thống...</div>;
  if (!user)
    return (
      <Login
        onLogin={async (u) => {
          setUser(u);
          setCatalog(await api<Catalog>("catalogs/"));
          setPage("dashboard");
        }}
      />
    );
  const force = user.must_change_password;
  const nav: { page: Page; label: string; icon: ReactNode; roles: string[] }[] =
    [
      {
        page: "dashboard",
        label: "Tổng quan",
        icon: <LayoutDashboard size={19} />,
        roles: ["lecturer", "reviewer", "signer", "admin", "viewer_admin"],
      },
      {
        page: "profile",
        label: "Lý lịch BM-04",
        icon: <BookOpen size={19} />,
        roles: ["lecturer", "admin", "viewer_admin"],
      },
      {
        page: "works",
        label: "Công trình khoa học",
        icon: <FilePlus2 size={19} />,
        roles: ["lecturer", "reviewer", "admin", "signer", "viewer_admin"],
      },
      {
        page: "approvals",
        label: "In & phê duyệt BM-04",
        icon: <FileCheck2 size={19} />,
        roles: ["lecturer", "reviewer", "signer", "admin", "viewer_admin"],
      },
      {
        page: "reports",
        label: "Thống kê báo cáo",
        icon: <Activity size={19} />,
        roles: ["reviewer", "signer", "admin", "viewer_admin"],
      },
      {
        page: "admin",
        label: "Quản trị nhân sự",
        icon: <Users size={19} />,
        roles: ["admin", "viewer_admin"],
      },
      {
        page: "password",
        label: "Đổi mật khẩu",
        icon: <LockKeyhole size={19} />,
        roles: ["lecturer", "reviewer", "signer", "admin", "viewer_admin"],
      },
    ];
  const current = force ? "password" : page;
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "show" : ""}`}>
        <div className="brand">
          <div className="brand-logo">
            <img
              src="/logo-dhcsnd.jpg"
              alt="Logo Trường Đại học Cảnh sát nhân dân"
            />
          </div>
          <div>
            <strong>HỒ SƠ KHOA HỌC</strong>
            <span>ĐH CẢNH SÁT NHÂN DÂN · BM-04</span>
          </div>
        </div>
        <div className="sidebar-section">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {nav
            .filter((x) => x.roles.includes(user.role))
            .map((n) => (
              <button
                key={n.page}
                disabled={force && n.page !== "password"}
                className={`nav-item ${current === n.page ? "active" : ""}`}
                onClick={() => {
                  setPage(n.page);
                  setMenu(false);
                }}
              >
                {n.icon}
                <span>{n.label}</span>
                {current === n.page && <ChevronRight size={16} />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="online-dot" /> Mạng nội bộ · BM-04 V1
          <br />
          <small>Kho minh chứng riêng, không public</small>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            TRANG CHỦ <ChevronRight size={13} />{" "}
            {nav.find((n) => n.page === current)?.label.toUpperCase()}
          </div>
          <div className="top-user">
            <div className="avatar">
              {(user.lecturer?.full_name || user.username)
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <strong>{user.lecturer?.full_name || user.username}</strong>
              <small>{roleLabels[user.role]}</small>
            </div>
            <button className="icon-btn" onClick={() => void logout()}>
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <DialogHost />
        <main className="content">
          {force && (
            <div className="alert">
              Tài khoản mới phải đổi mật khẩu trước khi sử dụng chức năng khác.
            </div>
          )}
          {current === "dashboard" && (
            <Dashboard user={user} tell={tell} navigate={setPage} />
          )}{" "}
          {current === "profile" && (
            <Profile user={user} catalog={catalog} tell={tell} />
          )}{" "}
          {current === "works" && (
            <Works user={user} catalog={catalog} tell={tell} />
          )}{" "}
          {current === "approvals" && (
            <Approvals user={user} catalog={catalog} tell={tell} />
          )}{" "}
          {current === "reports" && <Reports tell={tell} />}{" "}
          {current === "admin" && (
            <Admin
              user={user}
              catalog={catalog}
              refreshCatalog={async () => setCatalog(await api("catalogs/"))}
              tell={tell}
            />
          )}{" "}
          {current === "password" && (
            <Password onSaved={(u) => setUser(u)} tell={tell} />
          )}
        </main>
      </div>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => Promise<void> }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("csrf/");
      await onLogin(await api<User>("login/", "POST", { username, password }));
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <img
            className="login-brand-logo"
            src="/logo-dhcsnd.jpg"
            alt="Logo Trường Đại học Cảnh sát nhân dân"
          />
          <span>
            TRƯỜNG ĐẠI HỌC CẢNH SÁT NHÂN DÂN
            <br />
            HỆ THỐNG QUẢN LÝ LÝ LỊCH KHOA HỌC BM-04
          </span>
        </div>
        <div className="login-hero">
          <span className="eyebrow">NỀN TẢNG QUẢN LÝ TẬP TRUNG</span>
          <h1>
            Hồ sơ khoa học.
            <br />
            <em>Xác minh và phê duyệt.</em>
          </h1>
          <p>
            Quản lý dữ liệu theo biểu mẫu BM-04, công trình khoa học, minh chứng
            và quy trình ký xác nhận trong mạng nội bộ.
          </p>
          <div className="login-features">
            <span>
              <CheckCircle2 size={18} /> Dữ liệu đúng cấu trúc BM-04
            </span>
            <span>
              <CheckCircle2 size={18} /> Minh chứng gắn theo từng dữ liệu
            </span>
            <span>
              <CheckCircle2 size={18} /> Xem PDF trực tiếp & ký số nội bộ
            </span>
          </div>
        </div>
        <div className="login-footer">DÀNH CHO NGƯỜI DÙNG ĐƯỢC CẤP QUYỀN</div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <span className="login-icon">
            <LockKeyhole size={26} />
          </span>
          <div className="eyebrow blue">CHÀO MỪNG TRỞ LẠI</div>
          <h2>Đăng nhập hệ thống</h2>
          <form onSubmit={submit}>
            <Field label="Tên đăng nhập">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="error-text">{error}</p>}
            <button className="primary full" disabled={loading}>
              {loading ? "Đang xác thực..." : "Đăng nhập"}{" "}
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  user,
  tell,
  navigate,
}: {
  user: User;
  tell: (m: string, e?: boolean) => void;
  navigate: (p: Page) => void;
}) {
  const [works, setWorks] = useState<Work[]>([]),
    [approvals, setApprovals] = useState<Approval[]>([]),
    [reports, setReports] = useState<Report | null>(null),
    [notes, setNotes] = useState<NotificationItem[]>([]);
  async function loadNotes() {
    if (user.role === "admin")
      setNotes(await api<NotificationItem[]>("notifications/"));
  }
  useEffect(() => {
    void (async () => {
      try {
        const [w, a] = await Promise.all([
          api<Work[]>("works/"),
          api<Approval[]>("approvals/"),
        ]);
        setWorks(w);
        setApprovals(a);
        if (user.role !== "lecturer") setReports(await api<Report>("reports/"));
        await loadNotes();
      } catch (e) {
        tell((e as Error).message, true);
      }
    })();
  }, [user.role]);
  async function markNotes() {
    try {
      await api("notifications/read/", "POST", {});
      await loadNotes();
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  const mine = user.lecturer?.id;
  const verified =
    user.role === "lecturer"
      ? works.filter(
          (w) =>
            w.status === "verified" &&
            w.authors.some((a) => a.lecturer_id === mine),
        ).length
      : reports?.total_works || 0;
  const pending =
    user.role === "lecturer"
      ? works.filter(
          (w) => w.status === "pending" && w.created_by_id === user.id,
        ).length
      : reports?.pending_works || 0;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow blue">TỔNG QUAN</span>
        <h1>Xin chào, {user.lecturer?.full_name || user.username}</h1>
        <p>Hệ thống hiện sử dụng cấu trúc lý lịch khoa học BM-04.</p>
      </div>
      <div className="stat-grid">
        <Stat
          icon={<BookOpen />}
          title="Công trình đã xác nhận"
          value={verified}
        />
        <Stat
          icon={<FileClock />}
          title="Công trình chờ kiểm tra"
          value={pending}
        />
        <Stat
          icon={<FileCheck2 />}
          title="BM-04 hoàn tất"
          value={approvals.filter((a) => a.status === "completed").length}
        />
        <Stat
          icon={<ClipboardCheck />}
          title="BM-04 đang xử lý"
          value={
            approvals.filter(
              (a) => !["completed", "rejected", "changes"].includes(a.status),
            ).length
          }
        />
      </div>
      <div className="two-cols">
        <Card title="Thao tác nhanh">
          <div className="quick-grid">
            <button
              onClick={() =>
                navigate(user.role === "lecturer" ? "profile" : "approvals")
              }
            >
              <BookOpen />{" "}
              {user.role === "lecturer" ? "Cập nhật BM-04" : "Xác minh BM-04"}
            </button>
            <button onClick={() => navigate("works")}>
              <FilePlus2 /> Công trình khoa học
            </button>
            <button onClick={() => navigate("approvals")}>
              <FileCheck2 /> In & phê duyệt BM-04
            </button>
            <button
              onClick={() =>
                navigate(user.role === "lecturer" ? "password" : "reports")
              }
            >
              <Activity />{" "}
              {user.role === "lecturer" ? "Tài khoản" : "Xem báo cáo"}
            </button>
          </div>
        </Card>
        <Card title="Yêu cầu BM-04 gần đây">
          {approvals.length === 0 ? (
            <Empty text="Chưa có yêu cầu nào." />
          ) : (
            approvals.slice(0, 5).map((a) => (
              <div className="record" key={a.id}>
                <div>
                  <strong>{a.code}</strong>
                  <small>
                    {a.task_name} · {datefmt(a.submitted_at)}
                  </small>
                </div>
                <Badge status={a.status} />
              </div>
            ))
          )}
        </Card>
      </div>
      {user.role === "admin" && (
        <Card
          title={`Thông báo cập nhật công trình (${notes.filter((n) => !n.read).length} chưa đọc)`}
          actions={
            notes.some((n) => !n.read) ? (
              <button className="secondary" onClick={() => void markNotes()}>
                Đánh dấu đã đọc
              </button>
            ) : undefined
          }
        >
          {notes.length ? (
            notes.slice(0, 12).map((n) => (
              <div className={`record ${n.read ? "muted" : ""}`} key={n.id}>
                <div>
                  <strong>{n.title}</strong>
                  <small>{n.body}</small>
                </div>
                <small>{datefmt(n.created_at)}</small>
              </div>
            ))
          ) : (
            <Empty text="Chưa có thông báo cập nhật công trình." />
          )}
        </Card>
      )}
    </>
  );
}

function Profile({
  user,
  catalog,
  tell,
}: {
  user: User;
  catalog: Catalog;
  tell: (m: string, e?: boolean) => void;
}) {
  const [data, setData] = useState<ProfileData | null>(null),
    [saving, setSaving] = useState(false),
    [lecturers, setLecturers] = useState<Lecturer[]>([]),
    [targetId, setTargetId] = useState("");
  const readOnly = user.role === "viewer_admin",
    isAdminView = user.role === "admin" || user.role === "viewer_admin";
  async function load(id?: string) {
    try {
      const suffix = isAdminView ? `?lecturer_id=${id || targetId}` : "";
      if (isAdminView && !id && !targetId) return;
      setData(await api<ProfileData>(`profile/${suffix}`));
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  useEffect(() => {
    void (async () => {
      if (isAdminView) {
        try {
          const ls = await api<Lecturer[]>("admin/lecturers/");
          setLecturers(ls);
          const first = ls[0]?.id || "";
          setTargetId(first);
          if (first) await load(first);
        } catch (e) {
          tell((e as Error).message, true);
        }
      } else await load();
    })();
  }, [user.role]);
  function mutate<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    if (data) setData({ ...data, [key]: value });
  }
  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      if (readOnly) return;
      const payload = {
        ...(user.role === "admin" ? { lecturer_id: targetId } : {}),
        science: data.science,
        education: data.education,
        employment: data.employment,
        ip_records: data.ip_records,
        practical_applications: data.practical_applications,
        research_tasks: data.research_tasks,
        awards: data.awards,
      };
      const updated = await api<ProfileData>("profile/", "PATCH", payload);
      setData(updated);
      tell(
        user.role === "admin"
          ? "Admin đã cập nhật lý lịch khoa học của giảng viên."
          : "Đã lưu dữ liệu khoa học BM-04.",
      );
    } catch (e) {
      tell((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  async function changeTarget(id: string) {
    setTargetId(id);
    setData(null);
    if (id) await load(id);
  }
  if (isAdminView && lecturers.length === 0)
    return <div className="loading-inline">Chưa có giảng viên để quản lý.</div>;
  if (!data)
    return <div className="loading-inline">Đang tải lý lịch BM-04...</div>;
  const l = data.lecturer,
    s = data.science;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow blue">BIỂU MẪU BM-04</span>
        <h1>Lý lịch khoa học</h1>
        <p>
          {readOnly
            ? "Admin xem có thể xem toàn bộ lý lịch nhưng không được chỉnh sửa."
            : user.role === "admin"
              ? "Admin có toàn quyền cập nhật dữ liệu khoa học thay cho giảng viên."
              : "Thông tin nhân sự cơ bản do Admin quản lý. Giảng viên tự cập nhật quá trình công tác và thông tin khoa học."}
        </p>
      </div>
      {isAdminView && (
        <Card
          title={
            readOnly ? "Chọn giảng viên để xem" : "Chọn giảng viên để thao tác"
          }
        >
          <Field label="Giảng viên">
            <select
              value={targetId}
              onChange={(e) => void changeTarget(e.target.value)}
            >
              {lecturers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.staff_code} — {x.full_name} — {x.department}
                </option>
              ))}
            </select>
          </Field>
        </Card>
      )}
      <div className="bm04-note">
        <strong>BM-04</strong> gồm thông tin cá nhân, đào tạo, quá trình công
        tác, tối đa 05 công trình tiêu biểu, sở hữu trí tuệ, ứng dụng thực tiễn,
        nhiệm vụ KH,CN&ĐMST, giải thưởng và thành tựu khác.
      </div>
      <Card title="1–7. Thông tin nhân sự & đơn vị công tác (quản lý tại mục Quản trị nhân sự)">
        <div className="form-grid">
          <Field label="Họ và tên">
            <input disabled value={l.full_name} />
          </Field>
          <Field label="Số định danh cá nhân">
            <input disabled value={l.personal_id || "—"} />
          </Field>
          <Field label="Ngày sinh">
            <input disabled value={l.date_of_birth || "—"} />
          </Field>
          <Field label="Giới tính">
            <input disabled value={l.gender_label || "—"} />
          </Field>
          <Field label="Chức danh nghề nghiệp">
            <input disabled value={l.professional_title || "—"} />
          </Field>
          <Field label="Chức vụ">
            <input disabled value={l.position || "—"} />
          </Field>
          <Field label="Địa chỉ nhà riêng">
            <input disabled value={l.home_address || "—"} />
          </Field>
          <Field label="Điện thoại">
            <input disabled value={l.phone || "—"} />
          </Field>
          <Field label="E-mail">
            <input disabled value={l.email || "—"} />
          </Field>
          <Field label="Tên đơn vị">
            <input disabled value={data.organization.name} />
          </Field>
          <Field label="Địa chỉ đơn vị">
            <input disabled value={data.organization.address || "—"} />
          </Field>
          <Field label="Thủ trưởng / điện thoại">
            <input
              disabled
              value={`${data.organization.head_name || "—"} / ${data.organization.phone || "—"}`}
            />
          </Field>
        </div>
      </Card>
      <Card title="3 & 5. Học hàm, học vị và nhóm nhân tài">
        <div className="form-grid">
          <Field label="Học hàm (nếu có)">
            <input
              value={s.academic_rank}
              onChange={(e) =>
                mutate("science", { ...s, academic_rank: e.target.value })
              }
            />
          </Field>
          <Field label="Năm được bổ nhiệm học hàm">
            {yearInput(s.academic_rank_year, (n) =>
              mutate("science", { ...s, academic_rank_year: n }),
            )}
          </Field>
          <Field label="Học vị (nếu có)">
            <input
              value={s.academic_degree}
              onChange={(e) =>
                mutate("science", { ...s, academic_degree: e.target.value })
              }
            />
          </Field>
          <Field label="Năm được công nhận học vị">
            {yearInput(s.academic_degree_year, (n) =>
              mutate("science", { ...s, academic_degree_year: n }),
            )}
          </Field>
          <Field label="Phân loại">
            <select
              value={s.talent_category}
              onChange={(e) =>
                mutate("science", { ...s, talent_category: e.target.value })
              }
            >
              {catalog.talent_categories.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>
      <Card
        title="8. Quá trình đào tạo"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("education", [
                  ...data.education,
                  {
                    level: "",
                    institution: "",
                    specialization: "",
                    graduation_year: currentYear,
                  },
                ])
              }
            >
              <Plus size={15} /> Thêm dòng
            </button>
          )
        }
      >
        <EditableEducation
          rows={data.education}
          setRows={(v) => mutate("education", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="education"
          items={data.education.map((x) => ({
            id: x.id,
            label: `${x.level || "Bậc đào tạo"} — ${x.institution || "Nơi đào tạo"} (${x.graduation_year || ""})`,
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card
        title="9. Quá trình công tác"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("employment", [
                  ...data.employment,
                  {
                    start_year: currentYear,
                    end_year: null,
                    position: "",
                    organization: data.organization.name || "",
                    organization_address: data.organization.address || "",
                  },
                ])
              }
            >
              <Plus size={15} /> Thêm quá trình công tác
            </button>
          )
        }
      >
        <p className="muted small">
          Giảng viên tự cập nhật quá trình công tác. Minh chứng không bắt buộc;
          có thể đính kèm quyết định tuyển dụng, điều động, bổ nhiệm hoặc tài
          liệu liên quan.
        </p>
        <EditableEmployment
          rows={data.employment}
          setRows={(v) => mutate("employment", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="employment"
          items={data.employment.map((x) => ({
            id: x.id,
            label: `${x.start_year}-${x.end_year || "nay"} · ${x.position} · ${x.organization}`,
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card title="10. Các công trình khoa học đã công bố chủ yếu">
        <p className="muted small">
          Có thể chọn tối đa 05 công trình tiêu biểu vào BM-04. Minh chứng công
          trình là bắt buộc và được quản lý trực tiếp tại menu{" "}
          <strong>Công trình khoa học</strong>; không tải minh chứng riêng lần
          thứ hai tại Lý lịch BM-04.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tên công trình</th>
                <th>Vai trò</th>
                <th>Nơi công bố</th>
                <th>Năm</th>
                <th>Minh chứng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.my_works.length ? (
                data.my_works.map((w) => (
                  <tr key={w.id}>
                    <td>{w.title}</td>
                    <td>{w.my_authorship_label || "—"}</td>
                    <td>{w.venue || "—"}</td>
                    <td>{w.publication_year}</td>
                    <td>
                      {(w.verification_evidence || w.evidence || []).length ? (
                        <div className="mini-actions">
                          {(w.verification_evidence || w.evidence || []).map(
                            (ev) => (
                              <button
                                key={ev.id}
                                onClick={() =>
                                  openInline(`evidence/${ev.id}/view/`)
                                }
                              >
                                <Eye size={14} /> {ev.original_name}
                              </button>
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="verification-warning">
                          Chưa có minh chứng
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge status={w.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Chưa có công trình.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card
        title="11. Văn bằng bảo hộ quyền sở hữu trí tuệ"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("ip_records", [
                  ...data.ip_records,
                  { title_content: "", grant_year: currentYear },
                ])
              }
            >
              <Plus size={15} /> Thêm
            </button>
          )
        }
      >
        <EditableIP
          rows={data.ip_records}
          setRows={(v) => mutate("ip_records", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="ip"
          items={data.ip_records.map((x) => ({
            id: x.id,
            label: `${x.title_content} (${x.grant_year})`,
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card
        title="12. Công trình được áp dụng trong thực tiễn"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("practical_applications", [
                  ...data.practical_applications,
                  {
                    work_name: "",
                    application_detail: "",
                    start_date: "",
                    end_date: "",
                  },
                ])
              }
            >
              <Plus size={15} /> Thêm
            </button>
          )
        }
      >
        <EditablePractical
          rows={data.practical_applications}
          setRows={(v) => mutate("practical_applications", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="practical"
          items={data.practical_applications.map((x) => ({
            id: x.id,
            label: x.work_name || "Công trình áp dụng thực tiễn",
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card
        title="13. Nhiệm vụ KH, CN&ĐMST đã và đang chủ trì hoặc tham gia"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("research_tasks", [
                  ...data.research_tasks,
                  {
                    name: "",
                    participation_role: "participant",
                    start_date: "",
                    end_date: "",
                    program_name: "",
                    status: "ongoing",
                  },
                ])
              }
            >
              <Plus size={15} /> Thêm
            </button>
          )
        }
      >
        <EditableTasks
          rows={data.research_tasks}
          setRows={(v) => mutate("research_tasks", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="task"
          items={data.research_tasks.map((x) => ({
            id: x.id,
            label: x.name || "Nhiệm vụ KH,CN&ĐMST",
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card
        title="14. Giải thưởng"
        actions={
          !readOnly && (
            <button
              className="secondary"
              onClick={() =>
                mutate("awards", [
                  ...data.awards,
                  { description: "", award_year: currentYear },
                ])
              }
            >
              <Plus size={15} /> Thêm
            </button>
          )
        }
      >
        <EditableAwards
          rows={data.awards}
          setRows={(v) => mutate("awards", v)}
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="award"
          items={data.awards.map((x) => ({
            id: x.id,
            label: `${x.description} (${x.award_year})`,
            evidence: x.verification_evidence,
          }))}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
      </Card>
      <Card title="15. Thành tựu hoạt động KH&CN và sản xuất kinh doanh khác">
        <textarea
          rows={5}
          value={s.other_achievements}
          onChange={(e) =>
            mutate("science", { ...s, other_achievements: e.target.value })
          }
        />
        <EvidenceSection
          user={user}
          lecturerId={l.id}
          section="achievement"
          items={[
            {
              id: "science",
              label: "Thành tựu hoạt động KH&CN và sản xuất kinh doanh khác",
              evidence: s.verification_evidence,
            },
          ]}
          onChanged={() => load(isAdminView ? targetId : undefined)}
          tell={tell}
        />
        <div className="action-row">
          {!readOnly && (
            <button
              className="primary"
              onClick={() => void save()}
              disabled={saving}
            >
              <Save size={17} /> {saving ? "Đang lưu..." : "Lưu lý lịch BM-04"}
            </button>
          )}
        </div>
      </Card>
    </>
  );
}
function EditableEducation({
  rows,
  setRows,
}: {
  rows: EducationRecord[];
  setRows: (v: EducationRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Bậc đào tạo</th>
            <th>Nơi đào tạo</th>
            <th>Chuyên môn</th>
            <th>Năm cấp bằng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  value={x.level}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, level: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.institution}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, institution: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.specialization}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, specialization: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={x.graduation_year}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, graduation_year: Number(e.target.value) }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có quá trình đào tạo." />
  );
}
function EditableIP({
  rows,
  setRows,
}: {
  rows: IPRecord[];
  setRows: (v: IPRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Tên và nội dung văn bằng</th>
            <th>Năm cấp</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  value={x.title_content}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, title_content: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={x.grant_year}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, grant_year: Number(e.target.value) }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có văn bằng sở hữu trí tuệ." />
  );
}
function EditablePractical({
  rows,
  setRows,
}: {
  rows: PracticalRecord[];
  setRows: (v: PracticalRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Tên công trình</th>
            <th>Hình thức, quy mô, địa chỉ áp dụng</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  value={x.work_name}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, work_name: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <textarea
                  rows={2}
                  value={x.application_detail}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, application_detail: e.target.value }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={x.start_date}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, start_date: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={x.end_date}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, end_date: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có công trình áp dụng thực tiễn." />
  );
}
function EditableTasks({
  rows,
  setRows,
}: {
  rows: TaskRecord[];
  setRows: (v: TaskRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Tên nhiệm vụ</th>
            <th>Vai trò</th>
            <th>Thời gian</th>
            <th>Chương trình</th>
            <th>Tình trạng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  value={x.name}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, name: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <select
                  value={x.participation_role}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? {
                              ...r,
                              participation_role: e.target
                                .value as TaskRecord["participation_role"],
                            }
                          : r,
                      ),
                    )
                  }
                >
                  <option value="lead">Chủ trì</option>
                  <option value="participant">Tham gia</option>
                </select>
              </td>
              <td>
                <input
                  type="date"
                  value={x.start_date}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, start_date: e.target.value } : r,
                      ),
                    )
                  }
                />
                <input
                  type="date"
                  value={x.end_date}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, end_date: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.program_name}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, program_name: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <select
                  value={x.status}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? {
                              ...r,
                              status: e.target.value as TaskRecord["status"],
                            }
                          : r,
                      ),
                    )
                  }
                >
                  <option value="accepted">Đã nghiệm thu</option>
                  <option value="ongoing">Chưa nghiệm thu</option>
                </select>
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có nhiệm vụ KH,CN&ĐMST." />
  );
}
function EditableAwards({
  rows,
  setRows,
}: {
  rows: AwardRecord[];
  setRows: (v: AwardRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Hình thức và nội dung giải thưởng</th>
            <th>Năm tặng thưởng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  value={x.description}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, description: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={x.award_year}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, award_year: Number(e.target.value) }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có giải thưởng." />
  );
}

function EvidenceSection({
  user,
  lecturerId,
  section,
  items,
  onChanged,
  tell,
  title = "Minh chứng xác minh",
}: {
  user: User;
  lecturerId: string;
  section: string;
  items: {
    id?: string | number;
    label: string;
    evidence?: EvidenceDocument[];
  }[];
  onChanged: () => Promise<void>;
  tell: (m: string, e?: boolean) => void;
  title?: string;
}) {
  const canUpload = user.role === "admin" || user.role === "lecturer";
  const [pending, setPending] = useState<{
    entityId: string | number;
    label: string;
    file: File;
  } | null>(null);
  const [validityMode, setValidityMode] = useState<"indefinite" | "fixed">(
      "indefinite",
    ),
    [validFrom, setValidFrom] = useState(""),
    [validUntil, setValidUntil] = useState("");
  const [linkTarget, setLinkTarget] = useState<{
      entityId: string | number;
      label: string;
    } | null>(null),
    [library, setLibrary] = useState<EvidenceDocument[]>([]),
    [selectedEvidence, setSelectedEvidence] = useState("");
  function chooseFile(
    entityId: string | number,
    label: string,
    f: File | null,
  ) {
    if (!f) return;
    setPending({ entityId, label, file: f });
    setValidityMode("indefinite");
    setValidFrom("");
    setValidUntil("");
  }
  async function upload() {
    if (!pending) return;
    if (validityMode === "fixed" && !validUntil) {
      tell("Minh chứng có thời hạn bắt buộc nhập ngày hết hiệu lực.", true);
      return;
    }
    const fd = new FormData();
    fd.append("file", pending.file);
    fd.append("section", section);
    fd.append("entity_id", String(pending.entityId));
    fd.append("lecturer_id", lecturerId);
    fd.append("validity_mode", validityMode);
    if (validFrom) fd.append("valid_from", validFrom);
    if (validUntil) fd.append("valid_until", validUntil);
    try {
      await api("profile/evidence/", "POST", fd);
      setPending(null);
      await onChanged();
      tell("Đã tải minh chứng xác minh.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function openReuse(entityId: string | number, label: string) {
    try {
      setLibrary(
        await api<EvidenceDocument[]>(
          `profile/evidence/?lecturer_id=${encodeURIComponent(lecturerId)}`,
        ),
      );
      setSelectedEvidence("");
      setLinkTarget({ entityId, label });
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function linkExisting() {
    if (!linkTarget || !selectedEvidence) return;
    const fd = new FormData();
    fd.append("existing_evidence_id", selectedEvidence);
    fd.append("section", section);
    fd.append("entity_id", String(linkTarget.entityId));
    fd.append("lecturer_id", lecturerId);
    try {
      await api("profile/evidence/", "POST", fd);
      setLinkTarget(null);
      await onChanged();
      tell("Đã liên kết minh chứng có sẵn với thông tin này.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  return (
    <>
      <div className="evidence-section">
        <div className="evidence-section-title">
          <ShieldCheck size={16} />
          <strong>{title}</strong>
          <small>
            {section === "employment"
              ? "Minh chứng không bắt buộc; giảng viên có thể đính kèm quyết định hoặc tài liệu liên quan."
              : "Dùng để Phòng NCKH đối chiếu khi xác minh BM-04."}
          </small>
        </div>
        {items.length === 0 ? (
          <p className="muted small">Chưa có dữ liệu để gắn minh chứng.</p>
        ) : (
          items.map((item, i) => (
            <div className="evidence-item" key={`${section}-${item.id ?? i}`}>
              <div className="evidence-item-head">
                <span>{item.label}</span>
                {canUpload && item.id && (
                  <div className="mini-actions">
                    <label className="secondary file-button compact-file">
                      <Upload size={14} /> Tải minh chứng
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) =>
                          chooseFile(
                            item.id!,
                            item.label,
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                    </label>
                    <button
                      className="secondary"
                      onClick={() => void openReuse(item.id!, item.label)}
                    >
                      Dùng minh chứng đã có
                    </button>
                  </div>
                )}
              </div>
              {!item.id && (
                <small className="muted">
                  Lưu dữ liệu trước khi tải minh chứng.
                </small>
              )}
              <div className="evidence-list">
                {(item.evidence || []).length === 0 ? (
                  <span className="muted small">Chưa có minh chứng.</span>
                ) : (
                  (item.evidence || []).map((ev) => {
                    const st = evidenceState(ev);
                    return (
                      <div
                        className="evidence-row evidence-row-rich"
                        key={ev.id}
                      >
                        <div className="evidence-main">
                          <span>{ev.original_name}</span>
                          <small
                            className={`evidence-validity evidence-${st.key}`}
                          >
                            {st.label}
                            {ev.validity_mode === "fixed" && ev.valid_from
                              ? ` · hiệu lực từ ${datefmt(ev.valid_from)}`
                              : ""}
                          </small>
                        </div>
                        <div className="mini-actions">
                          <button
                            onClick={() =>
                              openInline(`profile/evidence/${ev.id}/view/`)
                            }
                          >
                            <Eye size={14} /> Xem
                          </button>
                          <button
                            onClick={() =>
                              void download(
                                `profile/evidence/${ev.id}/download/`,
                                ev.original_name,
                              )
                            }
                          >
                            <Download size={14} /> Tải
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {pending && (
        <div className="modal-backdrop">
          <div className="modal evidence-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow blue">MINH CHỨNG XÁC MINH</span>
                <h2>Thiết lập thời hạn hiệu lực</h2>
              </div>
              <button className="icon-btn" onClick={() => setPending(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>{pending.label}</strong>
              </p>
              <p className="muted small">Tệp: {pending.file.name}</p>
              <Field label="Thời hạn hiệu lực">
                <select
                  value={validityMode}
                  onChange={(e) =>
                    setValidityMode(e.target.value as "indefinite" | "fixed")
                  }
                >
                  <option value="indefinite">Vô thời hạn</option>
                  <option value="fixed">Có thời hạn</option>
                </select>
              </Field>
              {validityMode === "fixed" && (
                <div className="form-grid">
                  <Field label="Ngày có hiệu lực (không bắt buộc)">
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                    />
                  </Field>
                  <Field label="Ngày hết hiệu lực *">
                    <input
                      required
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </Field>
                </div>
              )}
              <p className="muted small">
                Hệ thống cảnh báo trước 30 ngày. Minh chứng đã hết hiệu lực
                không được dùng để xác minh BM-04 mới.
              </p>
            </div>
            <div className="modal-footer">
              <button className="secondary" onClick={() => setPending(null)}>
                Hủy
              </button>
              <button className="primary" onClick={() => void upload()}>
                Tải lên
              </button>
            </div>
          </div>
        </div>
      )}
      {linkTarget && (
        <div className="modal-backdrop">
          <div className="modal evidence-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow blue">TÁI SỬ DỤNG MINH CHỨNG</span>
                <h2>Dùng minh chứng đã có</h2>
              </div>
              <button className="icon-btn" onClick={() => setLinkTarget(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Liên kết cho: <strong>{linkTarget.label}</strong>
              </p>
              <Field label="Chọn minh chứng">
                <select
                  value={selectedEvidence}
                  onChange={(e) => setSelectedEvidence(e.target.value)}
                >
                  <option value="">-- Chọn minh chứng --</option>
                  {library.map((ev) => {
                    const st = evidenceState(ev);
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.original_name} · {st.label}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <p className="muted small">
                Một file minh chứng có thể liên kết với nhiều thông tin; hệ
                thống không nhân bản file.
              </p>
            </div>
            <div className="modal-footer">
              <button className="secondary" onClick={() => setLinkTarget(null)}>
                Hủy
              </button>
              <button
                className="primary"
                disabled={!selectedEvidence}
                onClick={() => void linkExisting()}
              >
                Liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Works({
  user,
  catalog,
  tell,
}: {
  user: User;
  catalog: Catalog;
  tell: (m: string, e?: boolean) => void;
}) {
  const [items, setItems] = useState<Work[]>([]),
    [selected, setSelected] = useState<Work | null>(null),
    [adding, setAdding] = useState(false),
    [links, setLinks] = useState<
      {
        id: number;
        work_title: string;
        lecturer: string;
        authorship_type: string;
        department_at_publication: string;
      }[]
    >([]),
    [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [workValidityMode, setWorkValidityMode] = useState<
      "indefinite" | "fixed"
    >("indefinite"),
    [workValidFrom, setWorkValidFrom] = useState(""),
    [workValidUntil, setWorkValidUntil] = useState("");
  const [form, setForm] = useState({
    title: "",
    publication_year: currentYear,
    work_type_id: catalog.work_types[0]?.id || 0,
    doi: "",
    venue: "",
    authorship_type: "author",
    coauthors: "",
    publication_department_id: user.lecturer?.department_id || 0,
    lecturer_id: "",
  });
  const canCreate = user.role === "lecturer" || user.role === "admin",
    canReview = user.role === "reviewer" || user.role === "admin";
  useEffect(() => {
    if (catalog.work_types.length && !form.work_type_id)
      setForm((x) => ({ ...x, work_type_id: catalog.work_types[0].id }));
  }, [catalog.work_types]);
  async function reload() {
    try {
      setItems(await api<Work[]>("works/"));
      if (canReview) setLinks(await api("link-requests/"));
      if (user.role === "admin") {
        const ls = await api<Lecturer[]>("admin/lecturers/");
        setLecturers(ls);
        if (!form.lecturer_id && ls.length)
          setForm((x) => ({
            ...x,
            lecturer_id: ls[0].id,
            publication_department_id: ls[0].department_id,
          }));
      }
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  useEffect(() => {
    void reload();
  }, [user.role]);
  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        authors: form.coauthors
          .split(/[\n,;]/)
          .map((name) => ({ name: name.trim() }))
          .filter((a) => a.name),
      };
      const w = await api<Work>("works/", "POST", payload);
      setAdding(false);
      setSelected(w);
      await reload();
      tell(
        user.role === "admin"
          ? "Admin đã tạo bản nháp công trình. Hãy tải ít nhất một minh chứng trước khi gửi xác minh."
          : "Đã tạo bản nháp. Minh chứng công trình khoa học là bắt buộc trước khi gửi xác minh.",
      );
    } catch (e) {
      const err = e as ApiError;
      tell(
        err.duplicate
          ? `${err.message} Công trình trùng: ${err.duplicate.title}`
          : err.message,
        true,
      );
    }
  }
  async function upload(w: Work, f: File | null) {
    if (!f) return;
    if (workValidityMode === "fixed" && !workValidUntil) {
      tell("Minh chứng có thời hạn bắt buộc nhập ngày hết hiệu lực.", true);
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    fd.append("validity_mode", workValidityMode);
    if (workValidFrom) fd.append("valid_from", workValidFrom);
    if (workValidUntil) fd.append("valid_until", workValidUntil);
    try {
      await api(`works/${w.id}/evidence/`, "POST", fd);
      setSelected(await api(`works/${w.id}/`));
      await reload();
      setWorkValidityMode("indefinite");
      setWorkValidFrom("");
      setWorkValidUntil("");
      tell("Đã tải minh chứng công trình khoa học.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function submit(w: Work) {
    if (!(await askConfirm("Gửi công trình đến Phòng NCKH để xác minh?")))
      return;
    try {
      await api(`works/${w.id}/submit/`, "POST", {});
      setSelected(await api(`works/${w.id}/`));
      await reload();
      tell("Đã gửi xác minh.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function review(w: Work, action: string) {
    const comment =
      action === "verified"
        ? ""
        : (await askText("Nhập lý do xử lý công trình:")) || "";
    if (action !== "verified" && !comment) return;
    try {
      await api(`works/${w.id}/review/`, "POST", { action, comment });
      setSelected(await api(`works/${w.id}/`));
      await reload();
      tell("Đã xử lý công trình.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function link(w: Work) {
    const authorship = await askText(
      "Nhập author nếu là Tác giả; coauthor nếu là Đồng tác giả:",
      "coauthor",
      "Vai trò tác giả",
    );
    if (!authorship) return;
    try {
      await api("link-requests/", "POST", {
        work_id: w.id,
        authorship_type: authorship,
        publication_department_id: user.lecturer?.department_id,
      });
      tell("Đã gửi yêu cầu liên kết.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function reviewLink(id: number, action: string) {
    try {
      await api(`link-requests/${id}/review/`, "POST", { action });
      await reload();
      tell("Đã xử lý liên kết.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  function chooseLecturer(id: string) {
    const l = lecturers.find((x) => x.id === id);
    setForm({
      ...form,
      lecturer_id: id,
      publication_department_id:
        l?.department_id || form.publication_department_id,
    });
  }
  const editableSelected =
    selected &&
    ["draft", "changes", "rejected"].includes(selected.status) &&
    (user.role === "admin" || selected.created_by_id === user.id);
  return (
    <>
      <div className="page-heading row-head">
        <div>
          <span className="eyebrow blue">MỤC 10 BM-04</span>
          <h1>Công trình khoa học</h1>
          <p>
            Mỗi công trình bắt buộc có ít nhất một minh chứng. Minh chứng được
            dùng trực tiếp để Phòng NCKH xác minh công trình trong BM-04.
          </p>
        </div>
        {canCreate && (
          <button className="primary" onClick={() => setAdding(!adding)}>
            <Plus size={17} /> Thêm công trình
          </button>
        )}
      </div>
      {adding && (
        <Card
          title={
            user.role === "admin"
              ? "Admin thêm công trình cho giảng viên"
              : "Khai báo công trình"
          }
        >
          <form onSubmit={create}>
            {user.role === "admin" && (
              <Field label="Giảng viên sở hữu / khai báo">
                <select
                  required
                  value={form.lecturer_id}
                  onChange={(e) => chooseLecturer(e.target.value)}
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.staff_code} — {l.full_name} — {l.department}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="form-grid">
              <Field label="Tên công trình">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Loại">
                <select
                  required
                  value={form.work_type_id}
                  onChange={(e) =>
                    setForm({ ...form, work_type_id: Number(e.target.value) })
                  }
                >
                  {catalog.work_types.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Năm công bố">
                <input
                  type="number"
                  required
                  value={form.publication_year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      publication_year: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Vai trò của giảng viên">
                <select
                  value={form.authorship_type}
                  onChange={(e) =>
                    setForm({ ...form, authorship_type: e.target.value })
                  }
                >
                  <option value="author">Tác giả</option>
                  <option value="coauthor">Đồng tác giả</option>
                </select>
              </Field>
              <Field label="Nơi công bố / tên tạp chí">
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </Field>
              <Field label="DOI (nếu có)">
                <input
                  value={form.doi}
                  onChange={(e) => setForm({ ...form, doi: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Đồng tác giả khác (mỗi tên một dòng)">
              <textarea
                rows={3}
                value={form.coauthors}
                onChange={(e) =>
                  setForm({ ...form, coauthors: e.target.value })
                }
              />
            </Field>
            <button
              className="primary"
              disabled={user.role === "admin" && !form.lecturer_id}
            >
              Lưu bản nháp
            </button>
          </form>
        </Card>
      )}
      {canReview && links.length > 0 && (
        <Card title="Yêu cầu liên kết đồng tác giả">
          {links.map((x) => (
            <div className="record" key={x.id}>
              <div>
                <strong>{x.work_title}</strong>
                <small>
                  {x.lecturer} ·{" "}
                  {labels[x.authorship_type] || x.authorship_type} ·{" "}
                  {x.department_at_publication}
                </small>
              </div>
              <div className="action-row">
                <button
                  className="secondary"
                  onClick={() => void reviewLink(x.id, "approved")}
                >
                  Duyệt
                </button>
                <button
                  className="secondary"
                  onClick={() => void reviewLink(x.id, "rejected")}
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <Card title={`Danh sách công trình (${items.length})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tên công trình</th>
                <th>Năm</th>
                <th>Nơi công bố</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td className="strong">{w.title}</td>
                  <td>{w.publication_year}</td>
                  <td>{w.venue || "—"}</td>
                  <td>
                    <Badge status={w.status} />
                  </td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => setSelected(w)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && (
        <Card
          title="Chi tiết công trình"
          actions={
            <button className="icon-btn" onClick={() => setSelected(null)}>
              <X />
            </button>
          }
        >
          <h3>{selected.title}</h3>
          <p>
            {selected.work_type} · {selected.publication_year} ·{" "}
            {selected.venue || "Chưa có nơi công bố"}
          </p>
          <p>
            <strong>Tác giả:</strong>{" "}
            {selected.authors
              .map((a) => `${a.name} (${a.authorship_label})`)
              .join("; ")}
          </p>
          <div className="evidence-list">
            <strong>Minh chứng công trình khoa học (bắt buộc):</strong>
            {selected.evidence.length === 0 ? (
              <span className="muted"> Chưa có minh chứng.</span>
            ) : (
              selected.evidence.map((ev) => {
                const st = evidenceState(ev);
                return (
                  <div className="evidence-row evidence-row-rich" key={ev.id}>
                    <div className="evidence-main">
                      <span>{ev.original_name}</span>
                      <small className={`evidence-validity evidence-${st.key}`}>
                        {st.label}
                      </small>
                    </div>
                    <div className="mini-actions">
                      <button
                        onClick={() => openInline(`evidence/${ev.id}/view/`)}
                      >
                        <Eye size={14} /> Xem
                      </button>
                      <button
                        onClick={() =>
                          void download(
                            `evidence/${ev.id}/download/`,
                            ev.original_name,
                          )
                        }
                      >
                        <Download size={14} /> Tải
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {editableSelected && (
            <>
              <div className="form-grid evidence-validity-form">
                <Field label="Thời hạn hiệu lực">
                  <select
                    value={workValidityMode}
                    onChange={(e) => {
                      const mode = e.target.value as "indefinite" | "fixed";
                      setWorkValidityMode(mode);
                      if (mode === "indefinite") {
                        setWorkValidFrom("");
                        setWorkValidUntil("");
                      }
                    }}
                  >
                    <option value="indefinite">Vô thời hạn</option>
                    <option value="fixed">Có thời hạn</option>
                  </select>
                </Field>
                {workValidityMode === "fixed" && (
                  <>
                    <Field label="Ngày có hiệu lực (không bắt buộc)">
                      <input
                        type="date"
                        value={workValidFrom}
                        onChange={(e) => setWorkValidFrom(e.target.value)}
                      />
                    </Field>
                    <Field label="Ngày hết hiệu lực (bắt buộc)">
                      <input
                        type="date"
                        required
                        value={workValidUntil}
                        onChange={(e) => setWorkValidUntil(e.target.value)}
                      />
                    </Field>
                  </>
                )}
              </div>
              <div className="action-row">
                <label className="secondary file-button">
                  Tải minh chứng
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) =>
                      void upload(selected, e.target.files?.[0] || null)
                    }
                  />
                </label>
                <button
                  className="primary"
                  disabled={selected.evidence.length === 0}
                  title={
                    selected.evidence.length === 0
                      ? "Phải có ít nhất một minh chứng công trình trước khi gửi xác minh"
                      : ""
                  }
                  onClick={() => void submit(selected)}
                >
                  Gửi kiểm tra công trình
                </button>
              </div>
              {selected.evidence.length === 0 && (
                <p className="verification-warning">
                  Công trình khoa học bắt buộc có ít nhất một minh chứng trước
                  khi gửi xác minh.
                </p>
              )}
            </>
          )}
          {user.role === "lecturer" &&
            selected.status === "verified" &&
            !selected.authors.some(
              (a) => a.lecturer_id === user.lecturer?.id,
            ) && (
              <button className="secondary" onClick={() => void link(selected)}>
                Yêu cầu liên kết công trình
              </button>
            )}
          {canReview && selected.status === "pending" && (
            <div className="action-row">
              <button
                className="primary"
                onClick={() => void review(selected, "verified")}
              >
                Xác nhận công trình
              </button>
              <button
                className="secondary"
                onClick={() => void review(selected, "changes")}
              >
                Yêu cầu chỉnh sửa
              </button>
              <button
                className="secondary"
                onClick={() => void review(selected, "rejected")}
              >
                Từ chối
              </button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
function Approvals({
  user,
  catalog,
  tell,
}: {
  user: User;
  catalog: Catalog;
  tell: (m: string, e?: boolean) => void;
}) {
  const [items, setItems] = useState<Approval[]>([]),
    [profile, setProfile] = useState<ProfileData | null>(null),
    [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [identity, setIdentity] = useState<SigningIdentity | null>(null),
    [sigName, setSigName] = useState(""),
    [sigPosition, setSigPosition] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", lecturer: "" }),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [total, setTotal] = useState(0),
    [pages, setPages] = useState(1);
  const [detail, setDetail] = useState<ApprovalDetail | null>(null),
    [detailLoading, setDetailLoading] = useState(false);
  const [builder, setBuilder] = useState({
    parent_approval_id: "",
    lecturer_id: "",
    task_name: "",
    registered_role: "lead",
    registered_role_other: "",
    signing_place: "",
    signing_date: new Date().toISOString().slice(0, 10),
    selected_work_ids: [] as string[],
    selected_ip_ids: [] as string[],
    selected_application_ids: [] as string[],
    selected_award_ids: [] as string[],
  });
  const canBuild = user.role === "lecturer" || user.role === "admin",
    canReviewer = user.role === "reviewer" || user.role === "admin",
    canSigner = user.role === "signer" || user.role === "admin",
    canIdentity =
      user.role === "lecturer" ||
      user.role === "signer" ||
      user.role === "admin",
    readOnly = user.role === "viewer_admin";
  async function loadProfile(id: string) {
    if (!id) return;
    try {
      setProfile(
        await api<ProfileData>(
          user.role === "admin" ? `profile/?lecturer_id=${id}` : "profile/",
        ),
      );
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function loadIdentity() {
    if (!canIdentity) return;
    try {
      const x = await api<SigningIdentity>("signing/identity/");
      setIdentity(x);
      setSigName(x.display_name || user.username);
      setSigPosition(x.position || "");
    } catch {
      setIdentity(null);
    }
  }
  async function loadApprovals(
    targetPage = page,
    f = filters,
    size = pageSize,
  ) {
    const q = new URLSearchParams({
      page: String(targetPage),
      page_size: String(size),
    });
    if (f.q.trim()) q.set("q", f.q.trim());
    if (f.status) q.set("status", f.status);
    if (f.lecturer.trim()) q.set("lecturer", f.lecturer.trim());
    const r = await api<ApprovalPage>(`approvals/?${q.toString()}`);
    setItems(r.results);
    setTotal(r.count);
    setPage(r.page);
    setPages(Math.max(1, r.pages));
    setPageSize(r.page_size);
    if (detail && !r.results.some((x) => x.id === detail.id)) setDetail(null);
  }
  async function reload() {
    try {
      await loadApprovals(page, filters, pageSize);
      if (user.role === "lecturer") await loadProfile("self");
      if (user.role === "admin") {
        const ls = await api<Lecturer[]>("admin/lecturers/");
        setLecturers(ls);
        const id = builder.lecturer_id || ls[0]?.id || "";
        if (id) {
          setBuilder((x) => (x.lecturer_id ? x : { ...x, lecturer_id: id }));
          await loadProfile(id);
        }
      }
      await loadIdentity();
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  useEffect(() => {
    void reload();
  }, [user.role]);
  function toggle(list: keyof typeof builder, id: string, max?: number) {
    const arr = builder[list] as string[];
    const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    if (max && next.length > max) {
      tell(`Chỉ được chọn tối đa ${max} mục.`, true);
      return;
    }
    setBuilder({ ...builder, [list]: next });
  }
  async function changeLecturer(id: string) {
    setBuilder({
      ...builder,
      lecturer_id: id,
      selected_work_ids: [],
      selected_ip_ids: [],
      selected_application_ids: [],
      selected_award_ids: [],
    });
    setProfile(null);
    await loadProfile(id);
  }
  async function create() {
    try {
      let payload: Record<string, unknown> = { ...builder };
      if (user.role === "lecturer") {
        if (!identity?.provisioned || !identity?.has_signature_image) {
          tell(
            "Hãy tải ảnh chữ ký và cấp danh tính ký số trước khi gửi BM-04.",
            true,
          );
          return;
        }
        const password = await askPassword(
          "Nhập lại mật khẩu để ký số cá nhân và gửi BM-04. Ký tự được ẩn và mật khẩu không được ghi vào nhật ký.",
        );
        if (!password) return;
        payload = { ...payload, password };
      }
      await api("approvals/", "POST", payload);
      setBuilder((x) => ({ ...x, parent_approval_id: "" }));
      await reload();
      tell(
        user.role === "admin"
          ? "Admin đã tạo và gửi BM-04 thay cho giảng viên (không ký thay chữ ký cá nhân)."
          : "Đã ký số cá nhân và gửi BM-04 đến Phòng NCKH kiểm tra.",
      );
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function preview() {
    try {
      await downloadPost("profile/draft-pdf/", "BM-04-ban-nhap.pdf", builder);
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function action(a: Approval, act: string) {
    const comment = ["changes", "reject"].includes(act)
      ? (await askText("Nhập lý do trả sửa hoặc từ chối:")) || ""
      : "";
    if (["changes", "reject"].includes(act) && !comment) return;
    try {
      await api(`approvals/${a.id}/review/`, "POST", { action: act, comment });
      await reload();
      if (detail?.id === a.id) await openDetail(a);
      tell("Đã xử lý hồ sơ.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function uploadSignature(f: File | null) {
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    fd.append("display_name", sigName);
    fd.append("position", sigPosition);
    try {
      const x = await api<SigningIdentity>("signing/identity/", "POST", fd);
      setIdentity(x);
      tell("Đã lưu ảnh chữ ký và cấp/cập nhật chứng thư ký số nội bộ.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function sign(a: Approval) {
    const password = await askPassword(
      "Nhập lại mật khẩu tài khoản để xác nhận ký số. Ký tự được ẩn.",
    );
    if (!password) return;
    try {
      const x = await api<{ verification_code: string }>(
        `approvals/${a.id}/sign/`,
        "POST",
        { password },
      );
      await reload();
      if (detail?.id === a.id) await openDetail(a);
      tell(`Đã ký số nội bộ. Mã xác thực: ${x.verification_code}`);
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function verify(a: Approval) {
    try {
      const v = await api<SignatureVerification>(
        `approvals/${a.id}/verify-signature/`,
      );
      const desc = v.signatures
        .map(
          (x) =>
            `${x.signature_role_label}: ${x.signer} (${x.valid ? "hợp lệ" : "không hợp lệ"}) · ${x.verification_code}`,
        )
        .join(" | ");
      tell(
        `${v.valid ? "Tất cả chữ ký hợp lệ" : "Có chữ ký không hợp lệ"} · ${desc}`,
        !v.valid,
      );
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function openDetail(a: Approval) {
    setDetailLoading(true);
    try {
      setDetail(await api<ApprovalDetail>(`approvals/${a.id}/`));
    } catch (e) {
      tell((e as Error).message, true);
    } finally {
      setDetailLoading(false);
    }
  }
  async function reviewItem(item: ApprovalVerificationItem, act: string) {
    const comment = ["changes", "rejected"].includes(act)
      ? (await askText("Nhập lý do cho mục xác minh này:")) || ""
      : "";
    if (["changes", "rejected"].includes(act) && !comment) return;
    try {
      await api(`approvals/${detail?.id}/items/${item.id}/review/`, "POST", {
        action: act,
        comment,
      });
      if (detail) await openDetail(detail);
      await loadApprovals(page, filters, pageSize);
      tell("Đã cập nhật kết quả xác minh từng mục.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function revise(a: Approval) {
    try {
      const d = await api<ApprovalDetail>(`approvals/${a.id}/`);
      const snap = d.snapshot as any;
      setBuilder({
        parent_approval_id: a.id,
        lecturer_id: a.lecturer_id,
        task_name: String(snap.task_name || a.task_name),
        registered_role: String(snap.registered_role || a.registered_role),
        registered_role_other: String(snap.registered_role_other || ""),
        signing_place: String(snap.signing_place || ""),
        signing_date: String(
          snap.signing_date || new Date().toISOString().slice(0, 10),
        ),
        selected_work_ids: (snap.works || []).map((x: any) => String(x.id)),
        selected_ip_ids: (snap.ip_records || []).map((x: any) => String(x.id)),
        selected_application_ids: (snap.practical_applications || []).map(
          (x: any) => String(x.id),
        ),
        selected_award_ids: (snap.awards || []).map((x: any) => String(x.id)),
      });
      await loadProfile("self");
      tell(
        `Đã nạp dữ liệu từ ${a.code}. Hãy cập nhật lý lịch/minh chứng nếu cần, kiểm tra lựa chọn và ký gửi phiên bản mới.`,
      );
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function applyFilters(e?: FormEvent) {
    e?.preventDefault();
    try {
      await loadApprovals(1, filters, pageSize);
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  async function resetFilters() {
    const f = { q: "", status: "", lecturer: "" };
    setFilters(f);
    setDetail(null);
    try {
      await loadApprovals(1, f, pageSize);
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  async function gotoPage(n: number) {
    if (n < 1 || n > pages || n === page) return;
    try {
      await loadApprovals(n, filters, pageSize);
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow blue">BM-04</span>
        <h1>In, phê duyệt và ký số nội bộ</h1>
        <p>
          {readOnly
            ? "Admin xem chỉ được xem, kiểm tra chữ ký và tải hồ sơ."
            : user.role === "admin"
              ? "Admin có thể tạo, kiểm tra, phê duyệt và ký bằng danh tính ký số của chính tài khoản Admin."
              : "Mỗi hồ sơ BM-04 được chốt dữ liệu, phê duyệt và ký số trong mạng nội bộ."}
        </p>
      </div>
      {canIdentity && (
        <Card
          title={
            user.role === "lecturer"
              ? "Chữ ký số cá nhân của giảng viên"
              : "Danh tính ký số nội bộ"
          }
        >
          <div className="form-grid">
            <Field label="Họ tên hiển thị dưới chữ ký">
              <input
                value={sigName}
                onChange={(e) => setSigName(e.target.value)}
              />
            </Field>
            <Field label="Chức vụ / chức danh người ký">
              <input
                value={sigPosition}
                onChange={(e) => setSigPosition(e.target.value)}
              />
            </Field>
          </div>
          <div className="signature-status">
            <ShieldCheck size={18} />
            <span>
              {identity?.provisioned
                ? `Đã cấp chứng thư · Serial ${identity.certificate_serial || "—"}`
                : "Chưa được cấp chứng thư"}
            </span>
            <span>
              {identity?.has_signature_image
                ? "Đã có ảnh chữ ký"
                : "Chưa có ảnh chữ ký"}
            </span>
          </div>
          <label className="secondary file-button">
            <Upload size={16} /> Tải/cập nhật ảnh chữ ký
            <input
              hidden
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) =>
                void uploadSignature(e.target.files?.[0] || null)
              }
            />
          </label>
          <p className="muted small">
            Ảnh chữ ký được căn giữa trong ô ký trên BM-04. Với giảng viên, chữ
            ký số được thực hiện ngay khi bấm gửi yêu cầu xác minh lý lịch; hệ
            thống đồng thời ký mật mã PDF bằng khóa nội bộ được mã hóa trên
            server.
          </p>
        </Card>
      )}
      {canBuild && profile && (
        <Card
          title={
            builder.parent_approval_id
              ? "Tạo phiên bản BM-04 mới sau khi trả sửa"
              : user.role === "admin"
                ? "Admin tạo hồ sơ BM-04 cho giảng viên"
                : "Tạo hồ sơ BM-04"
          }
        >
          {user.role === "admin" && (
            <Field label="Giảng viên">
              <select
                value={builder.lecturer_id}
                onChange={(e) => void changeLecturer(e.target.value)}
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.staff_code} — {l.full_name} — {l.department}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="form-grid">
            <Field label="Tên nhiệm vụ KH,CN&ĐMST">
              <input
                value={builder.task_name}
                onChange={(e) =>
                  setBuilder({ ...builder, task_name: e.target.value })
                }
              />
            </Field>
            <Field label="Chức danh đăng ký">
              <select
                value={builder.registered_role}
                onChange={(e) =>
                  setBuilder({ ...builder, registered_role: e.target.value })
                }
              >
                {catalog.registered_roles.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </Field>
            {builder.registered_role === "other" && (
              <Field label="Ghi rõ chức danh khác">
                <input
                  value={builder.registered_role_other}
                  onChange={(e) =>
                    setBuilder({
                      ...builder,
                      registered_role_other: e.target.value,
                    })
                  }
                />
              </Field>
            )}
            <Field label="Địa danh ký">
              <input
                placeholder="Ví dụ: Thành phố Hồ Chí Minh"
                value={builder.signing_place}
                onChange={(e) =>
                  setBuilder({ ...builder, signing_place: e.target.value })
                }
              />
            </Field>
            <Field label="Ngày lập">
              <input
                type="date"
                value={builder.signing_date}
                onChange={(e) =>
                  setBuilder({ ...builder, signing_date: e.target.value })
                }
              />
            </Field>
          </div>
          <h4>
            Mục 10 — Chọn tối đa 05 công trình tiêu biểu (
            {builder.selected_work_ids.length}/5)
          </h4>
          <div className="check-list">
            {profile.my_works.length ? (
              profile.my_works.map((w) => (
                <label key={w.id}>
                  <input
                    type="checkbox"
                    checked={builder.selected_work_ids.includes(w.id)}
                    onChange={() => toggle("selected_work_ids", w.id, 5)}
                  />
                  <span>
                    <strong>{w.title}</strong>
                    <small>
                      {w.publication_year} · {w.venue || "—"} ·{" "}
                      {w.my_authorship_label}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <p className="muted">Chưa có công trình trong hồ sơ.</p>
            )}
          </div>
          <div className="two-cols">
            <RelatedCheck
              title="Mục 11 — SHTT liên quan đến nhiệm vụ"
              items={profile.ip_records.map((x) => ({
                id: String(x.id),
                label: `${x.title_content} (${x.grant_year})`,
              }))}
              selected={builder.selected_ip_ids}
              onToggle={(id) => toggle("selected_ip_ids", id)}
            />
            <RelatedCheck
              title="Mục 12 — Ứng dụng thực tiễn liên quan"
              items={profile.practical_applications.map((x) => ({
                id: String(x.id),
                label: x.work_name,
              }))}
              selected={builder.selected_application_ids}
              onToggle={(id) => toggle("selected_application_ids", id)}
            />
          </div>
          <RelatedCheck
            title="Mục 14 — Giải thưởng liên quan đến nhiệm vụ"
            items={profile.awards.map((x) => ({
              id: String(x.id),
              label: `${x.description} (${x.award_year})`,
            }))}
            selected={builder.selected_award_ids}
            onToggle={(id) => toggle("selected_award_ids", id)}
          />
          <div className="alert">
            Mục 13 và mục 15 lấy đầy đủ từ lý lịch đã lưu. Mục 16 là nội dung
            cam kết cố định.
          </div>
          <div className="action-row">
            <button className="secondary" onClick={() => void preview()}>
              <Download size={17} /> Tải bản nháp
            </button>
            <button className="primary" onClick={() => void create()}>
              <FileCheck2 size={17} />{" "}
              {user.role === "lecturer"
                ? "Ký số & gửi yêu cầu xác nhận"
                : "Gửi yêu cầu xác nhận"}
            </button>
          </div>
        </Card>
      )}
      <Card title="Tìm kiếm và lọc hồ sơ">
        <form
          className="approval-filter-grid"
          onSubmit={(e) => void applyFilters(e)}
        >
          <Field label="Từ khóa">
            <div className="search-box approval-search">
              <Search size={16} />
              <input
                placeholder="Mã BM-04 hoặc tên nhiệm vụ"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Giảng viên">
            <input
              placeholder="Tên hoặc mã giảng viên"
              value={filters.lecturer}
              onChange={(e) =>
                setFilters({ ...filters, lecturer: e.target.value })
              }
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="review">Chờ NCKH</option>
              <option value="signer">Chờ lãnh đạo</option>
              <option value="print">Chờ ký số nội bộ</option>
              <option value="completed">Hoàn tất</option>
              <option value="signed">Chờ lưu scan (legacy)</option>
              <option value="changes">Cần bổ sung</option>
              <option value="rejected">Từ chối</option>
            </select>
          </Field>
          <Field label="Số dòng / trang">
            <select
              value={pageSize}
              onChange={(e) => {
                const n = Number(e.target.value);
                setPageSize(n);
                void loadApprovals(1, filters, n);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </Field>
          <div className="approval-filter-actions">
            <button className="primary" type="submit">
              <Search size={16} /> Tìm kiếm
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => void resetFilters()}
            >
              Đặt lại
            </button>
          </div>
        </form>
      </Card>
      {(detailLoading || detail) && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) {
              setDetail(null);
              setDetailLoading(false);
            }
          }}
        >
          <div className="modal approval-detail-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow blue">
                  LIÊN KẾT BM-04 → CÔNG TRÌNH KHOA HỌC
                </span>
                <h2>{detail?.code || "Đang tải chi tiết..."}</h2>
              </div>
              <button
                className="icon-btn"
                onClick={() => {
                  setDetail(null);
                  setDetailLoading(false);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="loading-inline">Đang tải chi tiết BM-04...</div>
              ) : (
                detail && (
                  <>
                    <div className="approval-detail-head">
                      <div>
                        <span className="eyebrow blue">GIẢNG VIÊN</span>
                        <strong>
                          {detail.lecturer_code} — {detail.lecturer}
                        </strong>
                        <small>{detail.lecturer_department}</small>
                      </div>
                      <div>
                        <span className="eyebrow blue">NHIỆM VỤ</span>
                        <strong>{detail.task_name}</strong>
                        <small>Gửi ngày {datefmt(detail.submitted_at)}</small>
                      </div>
                      <div>
                        <span className="eyebrow blue">TRẠNG THÁI</span>
                        <Badge status={detail.status} />
                      </div>
                    </div>
                    <div className="action-row">
                      <button
                        className="secondary"
                        onClick={() =>
                          openInline(`approvals/${detail.id}/pdf/?inline=1`)
                        }
                      >
                        <Eye size={15} /> Xem BM-04
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          void download(
                            `approvals/${detail.id}/pdf/`,
                            `${detail.code}.pdf`,
                          )
                        }
                      >
                        <Download size={15} /> Tải BM-04
                      </button>
                    </div>
                    <h4>
                      Checklist xác minh theo từng mục BM-04 (
                      {detail.verification_verified}/{detail.verification_total}
                      )
                    </h4>
                    <div className="verification-checklist">
                      {detail.verification_items.length === 0 ? (
                        <Empty text="Hồ sơ này chưa có checklist xác minh (dữ liệu legacy)." />
                      ) : (
                        detail.verification_items.map((v) => (
                          <div className="verification-item" key={v.id}>
                            <div className="verification-item-head">
                              <div>
                                <strong>{v.section_label}</strong>
                                <span>{v.label}</span>
                                <small>
                                  {v.reused
                                    ? "✓ Tái sử dụng kết quả xác minh trước vì dữ liệu và minh chứng không thay đổi."
                                    : v.evidence_required
                                      ? "Minh chứng bắt buộc"
                                      : "Minh chứng không bắt buộc"}
                                </small>
                              </div>
                              <Badge status={v.status} />
                            </div>
                            <div className="evidence-list">
                              {v.evidence.length === 0 ? (
                                <span className="muted small">
                                  Không có minh chứng đính kèm.
                                </span>
                              ) : (
                                v.evidence.map((ev) => {
                                  const st = evidenceState(ev);
                                  const evidenceBase =
                                    v.section === "work"
                                      ? `evidence/${ev.id}`
                                      : `profile/evidence/${ev.id}`;
                                  return (
                                    <div
                                      className="evidence-row evidence-row-rich"
                                      key={ev.id}
                                    >
                                      <div className="evidence-main">
                                        <span>{ev.original_name}</span>
                                        <small
                                          className={`evidence-validity evidence-${st.key}`}
                                        >
                                          {st.label}
                                        </small>
                                      </div>
                                      <div className="mini-actions">
                                        <button
                                          onClick={() =>
                                            openInline(`${evidenceBase}/view/`)
                                          }
                                        >
                                          <Eye size={14} /> Xem
                                        </button>
                                        <button
                                          onClick={() =>
                                            void download(
                                              `${evidenceBase}/download/`,
                                              ev.original_name,
                                            )
                                          }
                                        >
                                          <Download size={14} /> Tải
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                            {v.comment && (
                              <p className="verification-comment">
                                {v.comment}
                              </p>
                            )}
                            {canReviewer &&
                              detail.status === "review" &&
                              !readOnly &&
                              v.status !== "verified" && (
                                <>
                                  <div className="action-row">
                                    <button
                                      className="primary"
                                      disabled={
                                        (v.evidence_required &&
                                          v.evidence.length === 0) ||
                                        v.evidence.some(
                                          (ev) => evidenceState(ev).invalid,
                                        )
                                      }
                                      title={
                                        v.evidence_required &&
                                        v.evidence.length === 0
                                          ? "Mục này bắt buộc có minh chứng xác minh trước khi xác minh"
                                          : v.evidence.some(
                                                (ev) =>
                                                  evidenceState(ev).invalid,
                                              )
                                            ? "Có minh chứng đã hết hiệu lực hoặc chưa có hiệu lực"
                                            : ""
                                      }
                                      onClick={() =>
                                        void reviewItem(v, "verified")
                                      }
                                    >
                                      Xác minh
                                    </button>
                                  </div>
                                  {v.evidence_required &&
                                    v.evidence.length === 0 && (
                                      <p className="verification-warning">
                                        Chưa có minh chứng xác minh. Hãy dùng
                                        nút <strong>Trả sửa</strong> ở cấp hồ sơ
                                        BM-04 để giảng viên bổ sung minh chứng
                                        và tạo phiên bản mới.
                                      </p>
                                    )}
                                </>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                    {/* <h4>Nhật ký cập nhật liên quan giảng viên</h4>
                    <div className="audit-mini">
                      {detail.lecturer_logs.length === 0 ? (
                        <span className="muted small">Chưa có nhật ký.</span>
                      ) : (
                        detail.lecturer_logs.slice(0, 30).map((x, i) => (
                          <div className="record" key={i}>
                            <div>
                              <strong>{x.action}</strong>
                              <small>
                                {x.actor || "Hệ thống"} · {x.entity}{" "}
                                {x.entity_id || ""}
                              </small>
                            </div>
                            <small>
                              {new Date(x.at).toLocaleString("vi-VN")}
                            </small>
                          </div>
                        ))
                      )}
                    </div> */}
                    <h4>
                      Công trình khoa học được sử dụng trong BM-04 (
                      {detail.linked_works.length})
                    </h4>
                    {detail.linked_works.length === 0 ? (
                      <Empty text="BM-04 này không chọn công trình khoa học tiêu biểu." />
                    ) : (
                      <div className="approval-work-list">
                        {detail.linked_works.map((w, i) => (
                          <div className="approval-work" key={w.id}>
                            <div className="approval-work-title">
                              <span>{i + 1}</span>
                              <div>
                                <strong>{w.title}</strong>
                                <small>
                                  {w.work_type} · {w.publication_year} ·{" "}
                                  {w.venue || "Chưa ghi nơi công bố"}
                                </small>
                              </div>
                              {/* <Badge status={w.status} /> */}
                            </div>
                            <div className="work-meta-grid">
                              <span>
                                <b>DOI:</b> {w.doi || "—"}
                              </span>
                              <span>
                                <b>Tác giả:</b>{" "}
                                {w.authors.map((a) => a.name).join(", ") || "—"}
                              </span>
                            </div>
                            <div className="evidence-list">
                              <b>
                                Minh chứng công trình khoa học tại thời điểm gửi
                                (bắt buộc):
                              </b>
                              {(w.verification_evidence || w.evidence || [])
                                .length === 0 ? (
                                <span className="muted">
                                  {" "}
                                  Không có minh chứng.
                                </span>
                              ) : (
                                (
                                  w.verification_evidence ||
                                  w.evidence ||
                                  []
                                ).map((ev) => {
                                  const st = evidenceState(ev);
                                  return (
                                    <div
                                      className="evidence-row evidence-row-rich"
                                      key={ev.id}
                                    >
                                      <div className="evidence-main">
                                        <span>{ev.original_name}</span>
                                        <small
                                          className={`evidence-validity evidence-${st.key}`}
                                        >
                                          {st.label}
                                        </small>
                                      </div>
                                      <div className="mini-actions">
                                        <button
                                          onClick={() =>
                                            openInline(
                                              `evidence/${ev.id}/view/`,
                                            )
                                          }
                                        >
                                          <Eye size={14} /> Xem
                                        </button>
                                        <button
                                          onClick={() =>
                                            void download(
                                              `evidence/${ev.id}/download/`,
                                              ev.original_name,
                                            )
                                          }
                                        >
                                          <Download size={14} /> Tải
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
      <Card title={`Danh sách hồ sơ BM-04 (${total})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giảng viên</th>
                <th>Nhiệm vụ</th>
                <th>Chức danh</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Empty text="Không có hồ sơ phù hợp bộ lọc." />
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <button
                        className="code-link"
                        title="Xem công trình và minh chứng của BM-04"
                        onClick={() => void openDetail(a)}
                      >
                        {a.code}
                      </button>
                    </td>
                    <td>{a.lecturer}</td>
                    <td>{a.task_name}</td>
                    <td>{a.registered_role_label}</td>
                    <td>
                      <Badge status={a.status} />
                    </td>
                    <td>
                      <div className="action-row">
                        <button
                          className="link-button"
                          onClick={() =>
                            openInline(`approvals/${a.id}/pdf/?inline=1`)
                          }
                        >
                          <Eye size={15} /> Xem BM-04
                        </button>
                        <button
                          className="link-button"
                          onClick={() =>
                            void download(
                              `approvals/${a.id}/pdf/`,
                              `${a.code}.pdf`,
                            )
                          }
                        >
                          <Download size={15} /> Tải
                        </button>
                        {a.has_personal_signature && (
                          <span className="signature-mini">
                            <ShieldCheck size={14} /> GV đã ký
                          </span>
                        )}
                        {a.has_signed_pdf && (
                          <>
                            <button
                              className="link-button"
                              onClick={() =>
                                openInline(`approvals/${a.id}/signed/?inline=1`)
                              }
                            >
                              <ShieldCheck size={15} /> Xem bản ký
                            </button>
                            <button
                              className="link-button"
                              onClick={() => void verify(a)}
                            >
                              Kiểm tra chữ ký
                            </button>
                          </>
                        )}
                        {a.has_scan && (
                          <button
                            className="link-button"
                            onClick={() =>
                              openInline(`approvals/${a.id}/scan/?inline=1`)
                            }
                          >
                            Xem scan
                          </button>
                        )}
                        {user.role === "lecturer" &&
                          ["changes", "rejected"].includes(a.status) && (
                            <button
                              className="secondary"
                              onClick={() => void revise(a)}
                            >
                              Tạo phiên bản mới & ký lại
                            </button>
                          )}
                        {canReviewer && a.status === "review" && (
                          <>
                            <button
                              className="link-button"
                              disabled={!a.verification_complete}
                              title={
                                !a.verification_complete
                                  ? "Cần xác minh đủ các mục trước"
                                  : ""
                              }
                              onClick={() => void action(a, "forward")}
                            >
                              Chuyển lãnh đạo ({a.verification_verified}/
                              {a.verification_total})
                            </button>
                            <button
                              className="link-button"
                              onClick={() => void action(a, "changes")}
                            >
                              Trả sửa
                            </button>
                          </>
                        )}
                        {canSigner && a.status === "signer" && (
                          <>
                            <button
                              className="link-button"
                              onClick={() => void action(a, "approve")}
                            >
                              Phê duyệt
                            </button>
                            <button
                              className="link-button"
                              onClick={() => void action(a, "changes")}
                            >
                              Trả sửa
                            </button>
                          </>
                        )}
                        {canSigner && a.status === "print" && (
                          <button
                            className="primary"
                            onClick={() => void sign(a)}
                          >
                            <ShieldCheck size={15} /> Ký số
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Hiển thị {items.length} / {total} hồ sơ · Trang {page}/{pages}
          </span>
          <div>
            <button
              className="secondary"
              disabled={page <= 1}
              onClick={() => void gotoPage(page - 1)}
            >
              <ChevronLeft size={15} /> Trước
            </button>
            <button
              className="secondary"
              disabled={page >= pages}
              onClick={() => void gotoPage(page + 1)}
            >
              Sau <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

function RelatedCheck({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h4>{title}</h4>
      <div className="check-list compact">
        {items.length ? (
          items.map((x) => (
            <label key={x.id}>
              <input
                type="checkbox"
                checked={selected.includes(x.id)}
                onChange={() => onToggle(x.id)}
              />
              <span>{x.label}</span>
            </label>
          ))
        ) : (
          <p className="muted small">Không có dữ liệu.</p>
        )}
      </div>
    </div>
  );
}

function Reports({ tell }: { tell: (m: string, e?: boolean) => void }) {
  const [r, setR] = useState<Report | null>(null),
    [period, setPeriod] = useState("month"),
    [anchor, setAnchor] = useState(new Date().toISOString().slice(0, 10)),
    [from, setFrom] = useState(new Date().toISOString().slice(0, 10)),
    [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  function query() {
    const q = new URLSearchParams({ period });
    if (period === "custom") {
      q.set("from", from);
      q.set("to", to);
    } else q.set("date", anchor);
    return q.toString();
  }
  async function reload() {
    try {
      setR(await api<Report>(`reports/?${query()}`));
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  const list = (values: { label: string; value: number }[]) => (
    <div className="chart-bars">
      {values.length ? (
        values.map((v, i) => (
          <div className="bar-line" key={i}>
            <span>{v.label}</span>
            <div className="bar-track">
              <div
                style={{
                  width: `${Math.max(3, (v.value / Math.max(...values.map((x) => x.value))) * 100)}%`,
                }}
              />
            </div>
            <b>{v.value}</b>
          </div>
        ))
      ) : (
        <Empty text="Chưa có số liệu trong kỳ." />
      )}
    </div>
  );
  if (!r) return <div className="loading-inline">Đang tải báo cáo...</div>;
  return (
    <>
      <div className="page-heading row-head">
        <div>
          <span className="eyebrow blue">BÁO CÁO KHOA HỌC</span>
          <h1>Thống kê toàn trường</h1>
          <p>
            Kỳ thống kê hiện tại: {r.from_date} → {r.to_date}
          </p>
        </div>
        <button
          className="primary"
          onClick={() =>
            void download(
              `reports/export/?${query()}`,
              "bao_cao_khoa_hoc.xlsx",
            ).catch((e) => tell(e.message, true))
          }
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>
      <Card title="Bộ lọc thời gian">
        <div className="form-grid">
          <Field label="Chu kỳ">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
              <option value="custom">Khoảng tùy chọn</option>
            </select>
          </Field>
          {period !== "custom" ? (
            <Field label="Ngày tham chiếu">
              <input
                type="date"
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Từ ngày">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Đến ngày">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </>
          )}
          <div className="field">
            <span>&nbsp;</span>
            <button className="secondary" onClick={() => void reload()}>
              Áp dụng
            </button>
          </div>
        </div>
      </Card>
      <div className="stat-grid">
        <Stat
          icon={<FileCheck2 />}
          title="BM-04 tạo trong kỳ"
          value={r.approvals_created}
        />
        <Stat
          icon={<ClipboardCheck />}
          title="BM-04 đã duyệt"
          value={r.approvals_approved}
        />
        <Stat
          icon={<ShieldCheck />}
          title="BM-04 đã ký số"
          value={r.approvals_signed}
        />
        <Stat
          icon={<CheckCircle2 />}
          title="BM-04 hoàn tất"
          value={r.approvals_completed}
        />
      </div>
      <div className="stat-grid">
        <Stat
          icon={<FilePlus2 />}
          title="Công trình khai báo"
          value={r.works_created}
        />
        <Stat
          icon={<BookOpen />}
          title="Công trình xác minh"
          value={r.works_verified}
        />
        <Stat
          icon={<Users />}
          title="Người dùng có hoạt động"
          value={r.active_users}
        />
        <Stat
          icon={<FileClock />}
          title="BM-04 đang xử lý"
          value={r.pending_approvals}
        />
      </div>
      <div className="two-cols">
        <Card title="Công trình xác minh trong kỳ theo năm công bố">
          {list(
            r.by_year.map((x) => ({
              label: String(x.publication_year),
              value: x.total,
            })),
          )}
        </Card>
        <Card title="Công trình xác minh trong kỳ theo loại">
          {list(
            r.by_type.map((x) => ({
              label: x.work_type__name,
              value: x.total,
            })),
          )}
        </Card>
      </div>
      <div className="two-cols">
        <Card title="Công trình xác minh trong kỳ theo khoa tại thời điểm công bố">
          {list(
            r.by_department.map((x) => ({
              label: x.department_at_publication__name,
              value: x.total,
            })),
          )}
        </Card>
        <Card title="Trạng thái BM-04 hiện tại">
          {list(
            r.approval_status.map((x) => ({
              label: labels[x.status] || x.status,
              value: x.total,
            })),
          )}
        </Card>
      </div>
      <p className="muted small">{r.note}</p>
    </>
  );
}

function Admin({
  user,
  catalog,
  refreshCatalog,
  tell,
}: {
  user: User;
  catalog: Catalog;
  refreshCatalog: () => Promise<void>;
  tell: (m: string, e?: boolean) => void;
}) {
  type AdminUser = {
    id: number;
    username: string;
    role: string;
    is_active: boolean;
    lecturer: string;
  };
  const readOnly = user.role === "viewer_admin";
  const [users, setUsers] = useState<AdminUser[]>([]),
    [lecturers, setLecturers] = useState<Lecturer[]>([]),
    [logs, setLogs] = useState<
      {
        at: string;
        actor: string | null;
        lecturer_id: string | null;
        lecturer: string | null;
        action: string;
        entity: string;
        entity_id: string;
        details: Record<string, unknown>;
      }[]
    >([]);
  const [logLecturer, setLogLecturer] = useState(""),
    [logFrom, setLogFrom] = useState(""),
    [logTo, setLogTo] = useState("");
  const [editing, setEditing] = useState<Lecturer | null>(null),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<number | null>(null),
    [creds, setCreds] = useState<
      { username: string; temporary_password: string }[]
    >([]);
  const [account, setAccount] = useState({ username: "", role: "reviewer" }),
    [department, setDepartment] = useState({
      code: "",
      name: "",
      address: "",
      head_name: "",
      phone: "",
    });
  async function loadLogs() {
    const q = new URLSearchParams();
    if (logLecturer) q.set("lecturer_id", logLecturer);
    if (logFrom) q.set("from", logFrom);
    if (logTo) q.set("to", logTo);
    setLogs(await api<typeof logs>(`admin/audit/?${q.toString()}`));
  }
  async function reload() {
    try {
      const [u, l, a] = await Promise.all([
        api<AdminUser[]>("admin/users/"),
        api<Lecturer[]>("admin/lecturers/"),
        api<typeof logs>("admin/audit/"),
      ]);
      setUsers(u);
      setLecturers(l);
      setLogs(a);
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function importExcel(dry: boolean) {
    if (!file || readOnly) return;
    const fd = new FormData();
    fd.append("file", file);
    if (dry) fd.append("dry_run", "1");
    try {
      const d = await api<{
        valid_rows?: number;
        created?: number;
        credentials?: { username: string; temporary_password: string }[];
      }>("admin/users/import/", "POST", fd);
      if (dry) {
        setPreview(d.valid_rows || 0);
        tell(`Kiểm tra thành công: ${d.valid_rows} dòng hợp lệ.`);
      } else {
        setCreds(d.credentials || []);
        setPreview(null);
        await reload();
        tell(`Đã tạo ${d.created} tài khoản.`);
      }
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  async function createAccount(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    try {
      const d = await api<{ username: string; temporary_password: string }>(
        "admin/users/",
        "POST",
        account,
      );
      setCreds((x) => [
        ...x,
        { username: d.username, temporary_password: d.temporary_password },
      ]);
      setAccount({ username: "", role: "reviewer" });
      await reload();
      tell("Đã tạo tài khoản nghiệp vụ.");
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  async function toggleUser(u: AdminUser) {
    if (readOnly) return;
    try {
      await api(`admin/users/${u.id}/`, "POST", { is_active: !u.is_active });
      await reload();
      tell(u.is_active ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  async function createDepartment(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    try {
      await api("admin/departments/", "POST", department);
      setDepartment({
        code: "",
        name: "",
        address: "",
        head_name: "",
        phone: "",
      });
      await refreshCatalog();
      tell("Đã tạo đơn vị.");
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  async function savePerson() {
    if (!editing || readOnly) return;
    const original = lecturers.find((x) => x.id === editing.id);
    const payload: Record<string, unknown> = { ...editing };
    if (original && original.department_id !== editing.department_id) {
      const effective = await askText(
        "Ngày có hiệu lực chuyển đơn vị (YYYY-MM-DD):",
        new Date().toISOString().slice(0, 10),
        "Chuyển đơn vị",
      );
      if (!effective) return;
      payload.effective_date = effective;
    }
    try {
      await api(`admin/lecturers/${editing.id}/`, "PATCH", payload);
      setEditing(null);
      await reload();
      tell("Đã cập nhật thông tin nhân sự BM-04.");
    } catch (e) {
      tell((e as Error).message, true);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow blue">QUẢN TRỊ</span>
        <h1>Nhân sự & đơn vị theo BM-04</h1>
        <p>
          {readOnly
            ? "Admin xem có quyền xem toàn bộ dữ liệu quản trị nhưng không thể thay đổi."
            : "Admin quản lý tài khoản, thông tin cá nhân, đơn vị công tác và quá trình công tác."}
        </p>
      </div>
      {!readOnly && (
        <>
          <div className="two-cols">
            <Card title="Tạo tài khoản nghiệp vụ">
              <form onSubmit={createAccount} className="form-grid">
                <Field label="Tên đăng nhập">
                  <input
                    required
                    value={account.username}
                    onChange={(e) =>
                      setAccount({ ...account, username: e.target.value })
                    }
                  />
                </Field>
                <Field label="Vai trò">
                  <select
                    value={account.role}
                    onChange={(e) =>
                      setAccount({ ...account, role: e.target.value })
                    }
                  >
                    <option value="reviewer">Cán bộ NCKH</option>
                    <option value="signer">Lãnh đạo ký</option>
                    <option value="admin">Quản trị</option>
                    <option value="viewer_admin">Admin xem</option>
                  </select>
                </Field>
                <button className="primary">Tạo tài khoản</button>
              </form>
            </Card>
            <Card title="Thêm đơn vị">
              <form onSubmit={createDepartment} className="form-grid">
                <Field label="Mã đơn vị">
                  <input
                    required
                    value={department.code}
                    onChange={(e) =>
                      setDepartment({ ...department, code: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tên đơn vị">
                  <input
                    required
                    value={department.name}
                    onChange={(e) =>
                      setDepartment({ ...department, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Địa chỉ">
                  <input
                    value={department.address}
                    onChange={(e) =>
                      setDepartment({ ...department, address: e.target.value })
                    }
                  />
                </Field>
                <Field label="Thủ trưởng đơn vị">
                  <input
                    value={department.head_name}
                    onChange={(e) =>
                      setDepartment({
                        ...department,
                        head_name: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Điện thoại">
                  <input
                    value={department.phone}
                    onChange={(e) =>
                      setDepartment({ ...department, phone: e.target.value })
                    }
                  />
                </Field>
                <button className="primary">Thêm đơn vị</button>
              </form>
            </Card>
          </div>
          <Card title="Nhập danh sách giảng viên từ Excel">
            <div className="action-row import-actions">
              <a
                className="secondary"
                href="/template_import_giang_vien.xlsx"
                download
              >
                <Download size={17} /> Tải template Excel
              </a>
            </div>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
              }}
            />
            <div className="action-row">
              <button
                className="secondary"
                disabled={!file}
                onClick={() => void importExcel(true)}
              >
                Kiểm tra trước
              </button>
              <button
                className="primary"
                disabled={!file || preview === null}
                onClick={() => void importExcel(false)}
              >
                Tạo {preview ?? ""} tài khoản
              </button>
            </div>
          </Card>
        </>
      )}
      {creds.length > 0 && (
        <Card title="Mật khẩu khởi tạo">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Mật khẩu tạm</th>
                </tr>
              </thead>
              <tbody>
                {creds.map((c, i) => (
                  <tr key={i}>
                    <td>{c.username}</td>
                    <td>
                      <code>{c.temporary_password}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card title={`Tài khoản (${users.length})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.lecturer || "—"}</td>
                  <td>
                    {roleLabels[u.role as keyof typeof roleLabels] || u.role}
                  </td>
                  <td>{u.is_active ? "Đang hoạt động" : "Đã khóa"}</td>
                  <td>
                    {!readOnly && (
                      <button
                        className="link-button"
                        onClick={() => void toggleUser(u)}
                      >
                        {u.is_active ? "Khóa" : "Mở khóa"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Thông tin đơn vị phục vụ mục 7 BM-04">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên đơn vị</th>
                <th>Địa chỉ</th>
                <th>Thủ trưởng</th>
                <th>Điện thoại</th>
              </tr>
            </thead>
            <tbody>
              {catalog.departments.map((d) => (
                <tr key={d.id}>
                  <td>{d.code}</td>
                  <td>{d.name}</td>
                  <td>{d.address || "—"}</td>
                  <td>{d.head_name || "—"}</td>
                  <td>{d.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title={`Giảng viên (${lecturers.length})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Họ tên</th>
                <th>Định danh</th>
                <th>Đơn vị</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map((l) => (
                <tr key={l.id}>
                  <td>{l.staff_code}</td>
                  <td>{l.full_name}</td>
                  <td>{l.personal_id || "—"}</td>
                  <td>{l.department}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => setEditing(structuredClone(l))}
                    >
                      {readOnly ? "Xem" : "Sửa BM-04"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {editing && (
        <Card
          title={`${readOnly ? "Xem" : "Cập nhật"} nhân sự — ${editing.full_name}`}
          actions={
            <button className="icon-btn" onClick={() => setEditing(null)}>
              <X />
            </button>
          }
        >
          <div className="form-grid">
            <Field label="Họ và tên">
              <input
                disabled={readOnly}
                value={editing.full_name}
                onChange={(e) =>
                  setEditing({ ...editing, full_name: e.target.value })
                }
              />
            </Field>
            <Field label="Số định danh cá nhân">
              <input
                disabled={readOnly}
                value={editing.personal_id}
                onChange={(e) =>
                  setEditing({ ...editing, personal_id: e.target.value })
                }
              />
            </Field>
            <Field label="Ngày sinh">
              <input
                disabled={readOnly}
                type="date"
                value={editing.date_of_birth}
                onChange={(e) =>
                  setEditing({ ...editing, date_of_birth: e.target.value })
                }
              />
            </Field>
            <Field label="Chức danh nghề nghiệp">
              <input
                disabled={readOnly}
                value={editing.professional_title}
                onChange={(e) =>
                  setEditing({ ...editing, professional_title: e.target.value })
                }
              />
            </Field>
            <Field label="Chức vụ">
              <input
                disabled={readOnly}
                value={editing.position}
                onChange={(e) =>
                  setEditing({ ...editing, position: e.target.value })
                }
              />
            </Field>
            <Field label="Đơn vị hiện tại">
              <select
                disabled={readOnly}
                value={editing.department_id}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    department_id: Number(e.target.value),
                  })
                }
              >
                {catalog.departments.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <h4>9. Quá trình công tác</h4>
          {readOnly ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Từ năm</th>
                    <th>Đến năm</th>
                    <th>Vị trí</th>
                    <th>Đơn vị</th>
                    <th>Địa chỉ</th>
                  </tr>
                </thead>
                <tbody>
                  {(editing.employment || []).map((x, i) => (
                    <tr key={i}>
                      <td>{x.start_year}</td>
                      <td>{x.end_year || "nay"}</td>
                      <td>{x.position}</td>
                      <td>{x.organization}</td>
                      <td>{x.organization_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <EditableEmployment
                rows={editing.employment || []}
                setRows={(v) => setEditing({ ...editing, employment: v })}
              />
              <button
                className="secondary"
                onClick={() =>
                  setEditing({
                    ...editing,
                    employment: [
                      ...(editing.employment || []),
                      {
                        start_year: currentYear,
                        end_year: null,
                        position: "",
                        organization: editing.department,
                        organization_address: "",
                      },
                    ],
                  })
                }
              >
                <Plus size={15} /> Thêm quá trình công tác
              </button>
              <div className="action-row">
                <button className="primary" onClick={() => void savePerson()}>
                  <Save size={17} /> Lưu thông tin nhân sự
                </button>
              </div>
            </>
          )}
        </Card>
      )}
      <Card title="Tra cứu nhật ký theo giảng viên">
        <div className="form-grid">
          <Field label="Giảng viên">
            <select
              value={logLecturer}
              onChange={(e) => setLogLecturer(e.target.value)}
            >
              <option value="">Tất cả giảng viên</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.staff_code} — {l.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Từ ngày">
            <input
              type="date"
              value={logFrom}
              onChange={(e) => setLogFrom(e.target.value)}
            />
          </Field>
          <Field label="Đến ngày">
            <input
              type="date"
              value={logTo}
              onChange={(e) => setLogTo(e.target.value)}
            />
          </Field>
          <div className="field">
            <span>&nbsp;</span>
            <button className="secondary" onClick={() => void loadLogs()}>
              <Search size={15} /> Tra cứu
            </button>
          </div>
        </div>
        {logs.slice(0, 200).map((l, i) => (
          <div className="record" key={i}>
            <div>
              <strong>{l.action}</strong>
              <small>
                {l.lecturer ? `${l.lecturer} · ` : ""}
                {l.actor || "Hệ thống"} · {l.entity} {l.entity_id || ""}
              </small>
            </div>
            <small>{new Date(l.at).toLocaleString("vi-VN")}</small>
          </div>
        ))}
      </Card>
    </>
  );
}

function EditableEmployment({
  rows,
  setRows,
}: {
  rows: EmploymentRecord[];
  setRows: (v: EmploymentRecord[]) => void;
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Từ năm</th>
            <th>Đến năm</th>
            <th>Vị trí</th>
            <th>Đơn vị</th>
            <th>Địa chỉ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>
                <input
                  type="number"
                  value={x.start_year}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, start_year: Number(e.target.value) }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={x.end_year ?? ""}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? {
                              ...r,
                              end_year: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.position}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, position: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.organization}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, organization: e.target.value } : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <input
                  value={x.organization_address}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i
                          ? { ...r, organization_address: e.target.value }
                          : r,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty text="Chưa có quá trình công tác." />
  );
}

function Password({
  onSaved,
  tell,
}: {
  onSaved: (u: User) => void;
  tell: (m: string, e?: boolean) => void;
}) {
  const [cur, setCur] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      tell("Mật khẩu xác nhận chưa khớp.", true);
      return;
    }
    try {
      await api("password/", "POST", {
        current_password: cur,
        new_password: next,
      });
      onSaved(await api<User>("me/"));
      setCur("");
      setNext("");
      setConfirm("");
      tell("Đã đổi mật khẩu.");
    } catch (ex) {
      tell((ex as Error).message, true);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow blue">BẢO MẬT</span>
        <h1>Đổi mật khẩu</h1>
      </div>
      <Card title="Thông tin xác thực">
        <form onSubmit={save} className="password-form">
          <Field label="Mật khẩu hiện tại">
            <input
              type="password"
              required
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
          </Field>
          <Field label="Mật khẩu mới (tối thiểu 12 ký tự)">
            <input
              type="password"
              required
              minLength={12}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Nhập lại mật khẩu mới">
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <button className="primary">Lưu mật khẩu</button>
        </form>
      </Card>
    </>
  );
}
