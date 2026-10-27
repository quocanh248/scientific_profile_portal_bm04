import {useEffect,useState} from 'react'
import {Search} from 'lucide-react'
import {api,type AuditEntry} from '../../api'
import {Card,Field} from '../../components/ui'
import {useApp} from '../../app/AppContext'

type LecturerChoice={id:string;staff_code:string;full_name:string}
export default function ActivityPage(){
 const {tell}=useApp()
 const [people,setPeople]=useState<LecturerChoice[]>([])
 const [items,setItems]=useState<AuditEntry[]>([])
 const [who,setWho]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('')
 const [loading,setLoading]=useState(false)
 async function load(){
   const params=new URLSearchParams({limit:'500'})
   if(who)params.set('lecturer_id',who)
   if(from)params.set('from',from)
   if(to)params.set('to',to)
   setLoading(true)
   try{setItems(await api<AuditEntry[]>(`admin/audit/?${params.toString()}`))}
   catch(e){tell((e as Error).message,true)}finally{setLoading(false)}
 }
 useEffect(()=>{void api<LecturerChoice[]>('admin/audit/lecturers/').then(setPeople).catch(e=>tell((e as Error).message,true));void load()},[])
 return <><div className="page-heading"><span className="eyebrow blue">GIÁM SÁT HOẠT ĐỘNG</span><h1>Nhật ký thao tác giảng viên</h1><p>Hiển thị các thao tác bằng tiếng Việt, có thời gian, người thực hiện, đối tượng liên quan và nội dung thay đổi; dữ liệu nhật ký gốc không bị sửa.</p></div>
 <Card title="Tra cứu quá trình thao tác"><div className="form-grid">
 <Field label="Giảng viên"><select value={who} onChange={e=>setWho(e.target.value)}><option value="">Tất cả giảng viên</option>{people.map(x=><option value={x.id} key={x.id}>{x.staff_code} — {x.full_name}</option>)}</select></Field>
 <Field label="Từ ngày"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field>
 <Field label="Đến ngày"><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></Field>
 <div className="field"><span>&nbsp;</span><button className="primary" type="button" onClick={()=>void load()} disabled={loading}><Search size={15}/>{loading?'Đang tra cứu':'Tra cứu'}</button></div>
 </div><p className="muted small">Hiển thị tối đa 500 thao tác gần nhất phù hợp bộ lọc. Các thao tác cũ chỉ lưu mã kỹ thuật sẽ được diễn giải từ dữ liệu sẵn có; không tự suy đoán nội dung đã thay đổi.</p>
 {items.length===0?<p className="muted">Chưa có nhật ký trong khoảng đã chọn.</p>:items.map((l,i)=><div className="record" key={`${l.at}-${i}`}><div><strong>{l.action_label||l.action}</strong><small>{l.description}</small><small>Đối tượng: {l.entity_label||l.entity}{l.entity_id?` · Mã ${l.entity_id}`:''}</small>{(l.changes||[]).map((c,j)=><small key={j}>• {c}</small>)}</div><small>{new Date(l.at).toLocaleString('vi-VN')}</small></div>)}
 </Card></>
}
