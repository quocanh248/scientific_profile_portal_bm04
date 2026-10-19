import {useState,type ReactNode} from 'react'
import {Activity,BookOpen,ChevronRight,FileCheck2,FilePlus2,LayoutDashboard,LockKeyhole,LogOut,Menu,ShieldCheck,Users} from 'lucide-react'
import {NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom'
import {roleLabels} from '../api'
import {DialogHost} from '../dialog'
import {useApp} from '../app/AppContext'
import {metaForPath,routeMeta,type RouteKey} from '../app/routes'

const icons:Record<RouteKey,ReactNode>={
 dashboard:<LayoutDashboard size={19}/>,profile:<BookOpen size={19}/>,works:<FilePlus2 size={19}/>,approvals:<FileCheck2 size={19}/>,signature:<ShieldCheck size={19}/>,reports:<Activity size={19}/>,admin:<Users size={19}/>,password:<LockKeyhole size={19}/>
}

export default function AppLayout(){
 const {user,logout,tell}=useApp()
 const [menu,setMenu]=useState(false)
 const location=useLocation(),navigate=useNavigate()
 if(!user)return null
 const meta=metaForPath(location.pathname)
 async function doLogout(){try{await logout();navigate('/login',{replace:true})}catch(e){tell((e as Error).message,true)}}
 return <div className="shell"><aside className={`sidebar ${menu?'show':''}`}><div className="brand"><div className="brand-logo"><img src="/logo-dhcsnd.jpg" alt="Logo Trường Đại học Cảnh sát nhân dân"/></div><div><strong>HỒ SƠ KHOA HỌC</strong><span>ĐH CẢNH SÁT NHÂN DÂN · BM-04</span></div></div><div className="sidebar-section">KHÔNG GIAN LÀM VIỆC</div><nav>{routeMeta.filter(x=>x.roles.includes(user.role)).map(n=><NavLink key={n.key} to={n.path} end={n.path==='/'} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={()=>setMenu(false)}>{icons[n.key]}<span>{n.label}</span><ChevronRight size={16}/></NavLink>)}</nav><div className="sidebar-bottom"><span className="online-dot"/> Mạng nội bộ · BM-04 V1<br/><small>Kho minh chứng riêng, không public</small></div></aside><div className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMenu(!menu)}><Menu size={22}/></button><div className="breadcrumb">TRANG CHỦ <ChevronRight size={13}/> {meta.label.toUpperCase()}</div><div className="top-user"><div className="avatar">{(user.lecturer?.full_name||user.username).charAt(0).toUpperCase()}</div><div><strong>{user.lecturer?.full_name||user.username}</strong><small>{roleLabels[user.role]}</small></div><button className="icon-btn" onClick={()=>void doLogout()}><LogOut size={19}/></button></div></header><DialogHost/><main className="content">{user.must_change_password&&location.pathname==='/password'&&<div className="alert">Tài khoản mới phải đổi mật khẩu trước khi sử dụng chức năng khác.</div>}<Outlet/></main></div></div>
}
