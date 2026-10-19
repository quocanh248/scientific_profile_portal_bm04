import {useState,type FormEvent} from 'react'
import {CheckCircle2,ChevronRight,LockKeyhole} from 'lucide-react'
import {Navigate,useNavigate} from 'react-router-dom'
import {Field} from '../../components/ui'
import {useApp} from '../../app/AppContext'

export default function LoginPage(){
 const {user,login}=useApp(),navigate=useNavigate()
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
 if(user)return <Navigate to="/" replace/>
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError('');try{await login(username,password);navigate('/',{replace:true})}catch(ex){setError((ex as Error).message)}finally{setLoading(false)}}
 return <div className="login-page"><div className="login-left"><div className="login-brand"><img className="login-brand-logo" src="/logo-dhcsnd.jpg" alt="Logo Trường Đại học Cảnh sát nhân dân"/><span>TRƯỜNG ĐẠI HỌC CẢNH SÁT NHÂN DÂN<br/>HỆ THỐNG QUẢN LÝ LÝ LỊCH KHOA HỌC BM-04</span></div><div className="login-hero"><span className="eyebrow">NỀN TẢNG QUẢN LÝ TẬP TRUNG</span><h1>Hồ sơ khoa học.<br/><em>Xác minh và phê duyệt.</em></h1><p>Quản lý dữ liệu theo biểu mẫu BM-04, công trình khoa học, minh chứng và quy trình ký xác nhận trong mạng nội bộ.</p><div className="login-features"><span><CheckCircle2 size={18}/> Dữ liệu đúng cấu trúc BM-04</span><span><CheckCircle2 size={18}/> Minh chứng gắn theo từng dữ liệu</span><span><CheckCircle2 size={18}/> Xem PDF trực tiếp & ký số nội bộ</span></div></div><div className="login-footer">DÀNH CHO NGƯỜI DÙNG ĐƯỢC CẤP QUYỀN</div></div><div className="login-right"><div className="login-card"><span className="login-icon"><LockKeyhole size={26}/></span><div className="eyebrow blue">CHÀO MỪNG TRỞ LẠI</div><h2>Đăng nhập hệ thống</h2><form onSubmit={submit}><Field label="Tên đăng nhập"><input value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username"/></Field><Field label="Mật khẩu"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></Field>{error&&<p className="error-text">{error}</p>}<button className="primary full" disabled={loading}>{loading?'Đang xác thực...':'Đăng nhập'} <ChevronRight size={18}/></button></form></div></div></div>
}

