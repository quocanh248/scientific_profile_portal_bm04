import {useEffect,useState} from 'react'
import {BookOpen,CheckCircle2,ClipboardCheck,Download,FileCheck2,FileClock,FilePlus2,ShieldCheck,Users} from 'lucide-react'
import {download,type Report,api,labels} from '../../api'
import {Card,Empty,Field,Stat} from '../../components/ui'
import {useApp} from '../../app/AppContext'

export default function ReportsPage(){
 const {tell}=useApp()
 const [r,setR]=useState<Report|null>(null),[period,setPeriod]=useState('month'),[anchor,setAnchor]=useState(new Date().toISOString().slice(0,10)),[from,setFrom]=useState(new Date().toISOString().slice(0,10)),[to,setTo]=useState(new Date().toISOString().slice(0,10))
 function query(){const q=new URLSearchParams({period});if(period==='custom'){q.set('from',from);q.set('to',to)}else q.set('date',anchor);return q.toString()}
 async function reload(){try{setR(await api<Report>(`reports/?${query()}`))}catch(e){tell((e as Error).message,true)}}
 useEffect(()=>{void reload()},[])
 const list=(values:{label:string;value:number}[])=><div className="chart-bars">{values.length?values.map((v,i)=><div className="bar-line" key={i}><span>{v.label}</span><div className="bar-track"><div style={{width:`${Math.max(3,v.value/Math.max(...values.map(x=>x.value))*100)}%`}}/></div><b>{v.value}</b></div>):<Empty text="Chưa có số liệu trong kỳ."/>}</div>
 if(!r)return <div className="loading-inline">Đang tải báo cáo...</div>
 return <><div className="page-heading row-head"><div><span className="eyebrow blue">BÁO CÁO KHOA HỌC</span><h1>Thống kê toàn trường</h1><p>Kỳ thống kê hiện tại: {r.from_date} → {r.to_date}</p></div><button className="primary" onClick={()=>void download(`reports/export/?${query()}`,'bao_cao_khoa_hoc.xlsx').catch(e=>tell(e.message,true))}><Download size={18}/> Xuất Excel</button></div>
 <Card title="Bộ lọc thời gian"><div className="form-grid"><Field label="Chu kỳ"><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="day">Ngày</option><option value="week">Tuần</option><option value="month">Tháng</option><option value="year">Năm</option><option value="custom">Khoảng tùy chọn</option></select></Field>{period!=='custom'?<Field label="Ngày tham chiếu"><input type="date" value={anchor} onChange={e=>setAnchor(e.target.value)}/></Field>:<><Field label="Từ ngày"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field><Field label="Đến ngày"><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></Field></>}<div className="field"><span>&nbsp;</span><button className="secondary" onClick={()=>void reload()}>Áp dụng</button></div></div></Card>
 <div className="stat-grid"><Stat icon={<FileCheck2/>} title="BM-04 tạo trong kỳ" value={r.approvals_created}/><Stat icon={<ClipboardCheck/>} title="BM-04 đã duyệt" value={r.approvals_approved}/><Stat icon={<ShieldCheck/>} title="BM-04 đã ký số" value={r.approvals_signed}/><Stat icon={<CheckCircle2/>} title="BM-04 hoàn tất" value={r.approvals_completed}/></div>
 <div className="stat-grid"><Stat icon={<FilePlus2/>} title="Công trình khai báo" value={r.works_created}/><Stat icon={<BookOpen/>} title="Công trình xác minh" value={r.works_verified}/><Stat icon={<Users/>} title="Người dùng có hoạt động" value={r.active_users}/><Stat icon={<FileClock/>} title="BM-04 đang xử lý" value={r.pending_approvals}/></div>
 <div className="two-cols"><Card title="Công trình xác minh trong kỳ theo năm công bố">{list(r.by_year.map(x=>({label:String(x.publication_year),value:x.total})))}</Card><Card title="Công trình xác minh trong kỳ theo loại">{list(r.by_type.map(x=>({label:x.work_type__name,value:x.total})))}</Card></div><div className="two-cols"><Card title="Công trình xác minh trong kỳ theo khoa tại thời điểm công bố">{list(r.by_department.map(x=>({label:x.department_at_publication__name,value:x.total})))}</Card><Card title="Trạng thái BM-04 hiện tại">{list(r.approval_status.map(x=>({label:labels[x.status]||x.status,value:x.total})))}</Card></div><p className="muted small">{r.note}</p></>
}

