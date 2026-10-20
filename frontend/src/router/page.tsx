import {useEffect,useState} from 'react'
import {Activity,BookOpen,ClipboardCheck,FileCheck2,ShieldAlert} from 'lucide-react'
import {useNavigate} from 'react-router-dom'
import {api,type Approval,type NotificationItem,type Report,type Work} from '../api'
import {Badge,Card,Empty,Stat,datefmt} from '../components/ui'
import {useApp} from '../app/AppContext'

export default function DashboardPage(){
 const {user:currentUser,tell}=useApp(),navigate=useNavigate()
 const user=currentUser!
 const [works,setWorks]=useState<Work[]>([]),[approvals,setApprovals]=useState<Approval[]>([]),[reports,setReports]=useState<Report|null>(null),[notes,setNotes]=useState<NotificationItem[]>([])
 async function loadNotes(){if(user.role==='admin')setNotes(await api<NotificationItem[]>('notifications/'))}
 useEffect(()=>{void (async()=>{try{const [w,a]=await Promise.all([api<Work[]>('works/'),api<Approval[]>('approvals/')]);setWorks(w);setApprovals(a);if(user.role!=='lecturer')setReports(await api<Report>('reports/'));await loadNotes()}catch(e){tell((e as Error).message,true)}})()},[user.role])
 async function markNotes(){try{await api('notifications/read/','POST',{});await loadNotes()}catch(e){tell((e as Error).message,true)}}
 const mine=user.lecturer?.id
 const mineWorks=user.role==='lecturer'?works.filter(w=>w.authors.some(a=>a.lecturer_id===mine)):[]
 const totalWorks=user.role==='lecturer'?mineWorks.length:reports?.total_works||0
 const missingEvidence=user.role==='lecturer'?mineWorks.filter(w=>(w.evidence||[]).length===0).length:0
 return <><div className="page-heading"><span className="eyebrow blue">TỔNG QUAN</span><h1>Xin chào, {user.lecturer?.full_name||user.username}</h1><p>Hệ thống hiện sử dụng cấu trúc lý lịch khoa học BM-04. Công trình khoa học được cập nhật trực tiếp trong Lý lịch BM-04.</p></div><div className="stat-grid"><Stat icon={<BookOpen/>} title="Công trình trong lý lịch" value={totalWorks}/><Stat icon={<ShieldAlert/>} title={user.role==='lecturer'?'Công trình thiếu minh chứng':'BM-04 chờ NCKH'} value={user.role==='lecturer'?missingEvidence:approvals.filter(a=>a.status==='review').length}/><Stat icon={<FileCheck2/>} title="BM-04 hoàn tất" value={approvals.filter(a=>a.status==='completed').length}/><Stat icon={<ClipboardCheck/>} title="BM-04 đang xử lý" value={approvals.filter(a=>!['completed','rejected','changes'].includes(a.status)).length}/></div><div className="two-cols"><Card title="Thao tác nhanh"><div className="quick-grid"><button onClick={()=>navigate(user.role==='lecturer'?'/profile':'/approvals')}><BookOpen/> {user.role==='lecturer'?'Cập nhật lý lịch & công trình':'Xác minh BM-04'}</button><button onClick={()=>navigate('/approvals')}><FileCheck2/> In & phê duyệt BM-04</button><button onClick={()=>navigate(user.role==='lecturer'?'/signature':'/reports')}><Activity/> {user.role==='lecturer'?'Quản lý chữ ký':'Xem báo cáo'}</button><button onClick={()=>navigate('/password')}><Activity/> Đổi mật khẩu</button></div></Card><Card title="Yêu cầu BM-04 gần đây">{approvals.length===0?<Empty text="Chưa có yêu cầu nào."/>:approvals.slice(0,5).map(a=><div className="record" key={a.id}><div><strong>{a.code}</strong><small>{a.task_name} · {datefmt(a.submitted_at)}</small></div><Badge status={a.status}/></div>)}</Card></div>
 {user.role==='admin'&&<Card title={`Thông báo cập nhật công trình (${notes.filter(n=>!n.read).length} chưa đọc)`} actions={notes.some(n=>!n.read)?<button className="secondary" onClick={()=>void markNotes()}>Đánh dấu đã đọc</button>:undefined}>{notes.length?notes.slice(0,12).map(n=><div className={`record ${n.read?'muted':''}`} key={n.id}><div><strong>{n.title}</strong><small>{n.body}</small></div><small>{datefmt(n.created_at)}</small></div>):<Empty text="Chưa có thông báo cập nhật công trình."/>}</Card>}</>
}
