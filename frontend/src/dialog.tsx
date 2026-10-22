import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

type Kind = "message" | "confirm" | "text" | "password";
type Request = {
  kind: Kind;
  title: string;
  message?: string;
  defaultValue?: string;
  error?: boolean;
  resolve: (value: string | boolean | null) => void;
};
const EVENT = "bm04-dialog";
function emit(req: Omit<Request, "resolve">) {
  return new Promise<string | boolean | null>((resolve) =>
    window.dispatchEvent(
      new CustomEvent(EVENT, { detail: { ...req, resolve } }),
    ),
  );
}
export function showMessage(
  message: string,
  error = false,
  title = error ? "Có lỗi xảy ra" : "Thông báo",
) {
  return emit({ kind: "message", title, message, error });
}
export async function askConfirm(message: string, title = "Xác nhận") {
  return (await emit({ kind: "confirm", title, message })) === true;
}
export async function askText(
  message: string,
  defaultValue = "",
  title = "Nhập thông tin",
) {
  const v = await emit({ kind: "text", title, message, defaultValue });
  return typeof v === "string" ? v : null;
}
export async function askPassword(message: string, title = "Xác nhận ký số") {
  const v = await emit({ kind: "password", title, message });
  return typeof v === "string" ? v : null;
}

export function DialogHost() {
  const [req, setReq] = useState<Request | null>(null),
    [value, setValue] = useState(""),
    [show, setShow] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<Request>).detail;
      setReq(d);
      setValue(d.defaultValue || "");
      setShow(false);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  if (!req) return null;
  function done(v: string | boolean | null) {
    req?.resolve(v);
    setReq(null);
    setValue("");
    setShow(false);
  }
  return (
    <div className="modal-backdrop dialog-backdrop">
      <div className="modal dialog-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <span className="eyebrow blue">HỆ THỐNG BM-04</span>
            <h2>{req.title}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={() => done(req.kind === "message" ? true : null)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className={req.error ? "dialog-error" : ""}>{req.message}</p>
          {req.kind === "text" && (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") done(value);
              }}
            />
          )}
          {req.kind === "password" && (
            <div className="password-modal-field">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                name="bm04-signing-confirm-password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                spellCheck={false}
                onPaste={(e) => {
                  e.preventDefault();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && value) {
                    done(value);
                  }
                }}
              />

              <button
                type="button"
                className="icon-btn"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {req.kind !== "message" && (
            <button className="secondary" onClick={() => done(null)}>
              Hủy
            </button>
          )}
          <button
            className="primary"
            disabled={
              (req.kind === "password" || req.kind === "text") && !value.trim()
            }
            onClick={() =>
              done(
                req.kind === "message" || req.kind === "confirm" ? true : value,
              )
            }
          >
            {req.kind === "message"
              ? "Đóng"
              : req.kind === "confirm"
                ? "Xác nhận"
                : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}
