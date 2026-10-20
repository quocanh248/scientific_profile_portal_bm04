import {useEffect,useState,type FormEvent} from 'react'
import {Download,Eye,Plus,Save,X} from 'lucide-react'
import {api,download,openInline,type ApiError,type Catalog,type User,type Work} from '../../api'
import {Card,Field,currentYear,evidenceState} from '../../components/ui'

interface Props{
 user:User
 catalog:Catalog
 lecturerId:string
 works:Work[]
 readOnly:boolean
 onChanged:()=>Promise<void>
 tell:(m:string,e?:boolean)=>void
}

const emptyForm=(catalog:Catalog)=>({
 title:'',publication_year:currentYear,work_type_id:catalog.work_types[0]?.id||0,
 doi:'',venue:'',authorship_type:'author',coauthors:''
})

export default function WorksSection({user,catalog,lecturerId,works,readOnly,onChanged,tell}:Props){
 const [adding,setAdding]=useState(false)
 const [selected,setSelected]=useState<Work|null>(null)
 const [form,setForm]=useState(emptyForm(catalog))
 const [edit,setEdit]=useState({title:'',publication_year:currentYear,work_type_id:0,doi:'',venue:''})
 const [validityMode,setValidityMode]=useState<'indefinite'|'fixed'>('indefinite')

 useEffect(()=>{if(catalog.work_types.length&&!form.work_type_id)setForm(x=>({...x,work_type_id:catalog.work_types[0].id}))},[catalog.work_types])
 useEffect(()=>{if(selected)setEdit({title:selected.title,publication_year:selected.publication_year,work_type_id:selected.work_type_id,doi:selected.doi||'',venue:selected.venue||''})},[selected?.id])

 async function create(e:FormEvent){
  e.preventDefault()
  if(readOnly)return
  try{
   const payload={
    ...form,
    ...(user.role==='admin'?{lecturer_id:lecturerId}:{}),
    authors:form.coauthors.split(/[\n,;]/).map(name=>({name:name.trim()})).filter(a=>a.name),
   }
   const w=await api<Work>('works/','POST',payload)
   setAdding(false);setForm(emptyForm(catalog));setSelected(w)
   await onChanged()
   tell('Đã thêm công trình vào Lý lịch BM-04. Công trình chỉ được Phòng NCKH xác minh khi được đưa vào hồ sơ BM-04 và gửi phê duyệt.')
  }catch(e){const err=e as ApiError;tell(err.duplicate?`${err.message} Công trình trùng: ${err.duplicate.title}`:err.message,true)}
 }

 async function saveEdit(){
  if(!selected||readOnly)return
  try{
   const w=await api<Work>(`works/${selected.id}/`,'PATCH',edit)
   setSelected(w);await onChanged();tell('Đã cập nhật công trình khoa học.')
  }catch(e){tell((e as Error).message,true)}
 }

 async function upload(w:Work,file:File|null){
  if(!file||readOnly)return
  const fd=new FormData();fd.append('file',file);fd.append('validity_mode',validityMode)
  try{
   await api(`works/${w.id}/evidence/`,'POST',fd)
   const refreshed=await api<Work>(`works/${w.id}/`);setSelected(refreshed);await onChanged();setValidityMode('indefinite')
   tell('Đã tải minh chứng công trình khoa học.')
  }catch(e){tell((e as Error).message,true)}
 }

 function openWork(w:Work){setSelected(w);setValidityMode('indefinite')}

 return <Card title="10. Các công trình khoa học đã công bố chủ yếu" actions={!readOnly&&<button className="secondary" onClick={()=>setAdding(v=>!v)}><Plus size={15}/> Thêm công trình</button>}>
  <p className="muted small">Công trình được quản lý trực tiếp trong Lý lịch BM-04. Mỗi công trình phải có ít nhất một minh chứng trước khi được chọn để tạo BM-04. Không có bước gửi xác minh riêng sau khi thêm công trình; Phòng NCKH chỉ xác minh khi hồ sơ được tạo tại <strong>In & phê duyệt BM-04</strong>.</p>

  {adding&&<div className="embedded-form"><form onSubmit={create}><div className="form-grid"><Field label="Tên công trình"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="DM nhiệm vụ khoa học"><select required value={form.work_type_id} onChange={e=>setForm({...form,work_type_id:Number(e.target.value)})}>{catalog.work_types.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field><Field label="Năm công bố"><input type="number" required value={form.publication_year} onChange={e=>setForm({...form,publication_year:Number(e.target.value)})}/></Field><Field label="Vai trò của giảng viên"><select value={form.authorship_type} onChange={e=>setForm({...form,authorship_type:e.target.value})}><option value="author">Tác giả</option><option value="coauthor">Đồng tác giả</option></select></Field><Field label="Nơi công bố / tên tạp chí"><input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></Field><Field label="DOI (nếu có)"><input value={form.doi} onChange={e=>setForm({...form,doi:e.target.value})}/></Field></div><Field label="Đồng tác giả khác (mỗi tên một dòng)"><textarea rows={3} value={form.coauthors} onChange={e=>setForm({...form,coauthors:e.target.value})}/></Field><div className="action-row"><button type="button" className="secondary" onClick={()=>setAdding(false)}>Hủy</button><button className="primary"><Save size={15}/> Lưu công trình</button></div></form></div>}

  <div className="table-scroll"><table><thead><tr><th>Tên công trình</th><th>DM nhiệm vụ khoa học</th><th>Vai trò</th><th>Nơi công bố</th><th>Năm</th><th>Minh chứng</th><th></th></tr></thead><tbody>{works.length?works.map(w=><tr key={w.id}><td className="strong">{w.title}</td><td>{w.work_type}</td><td>{w.my_authorship_label||'—'}</td><td>{w.venue||'—'}</td><td>{w.publication_year}</td><td>{(w.evidence||[]).length?<span>{w.evidence.length} tệp</span>:<span className="verification-warning">Chưa có minh chứng</span>}</td><td><button className="link-button" onClick={()=>openWork(w)}>Chi tiết</button></td></tr>):<tr><td colSpan={7}>Chưa có công trình.</td></tr>}</tbody></table></div>

  {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setSelected(null)}}><div className="modal approval-detail-modal"><div className="modal-header"><div><span className="eyebrow blue">MỤC 10 BM-04</span><h2>Chi tiết công trình</h2></div><button className="icon-btn" onClick={()=>setSelected(null)}><X size={20}/></button></div><div className="modal-body">
   <div className="form-grid"><Field label="Tên công trình"><input disabled={readOnly} value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></Field><Field label="DM nhiệm vụ khoa học"><select disabled={readOnly} value={edit.work_type_id} onChange={e=>setEdit({...edit,work_type_id:Number(e.target.value)})}>{catalog.work_types.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field><Field label="Năm công bố"><input disabled={readOnly} type="number" value={edit.publication_year} onChange={e=>setEdit({...edit,publication_year:Number(e.target.value)})}/></Field><Field label="Nơi công bố / tên tạp chí"><input disabled={readOnly} value={edit.venue} onChange={e=>setEdit({...edit,venue:e.target.value})}/></Field><Field label="DOI"><input disabled={readOnly} value={edit.doi} onChange={e=>setEdit({...edit,doi:e.target.value})}/></Field></div>
   <p><strong>Tác giả:</strong> {selected.authors.map(a=>`${a.name} (${a.authorship_label})`).join('; ')}</p>
   {!readOnly&&<div className="action-row"><button className="primary" onClick={()=>void saveEdit()}><Save size={15}/> Lưu thay đổi</button></div>}
   <div className="evidence-section"><div className="evidence-section-title"><strong>Minh chứng công trình khoa học (bắt buộc)</strong><small>Minh chứng này sẽ được snapshot cùng công trình khi tạo BM-04.</small></div><div className="evidence-list">{selected.evidence.length===0?<span className="muted small">Chưa có minh chứng.</span>:selected.evidence.map(ev=>{const st=evidenceState(ev);return <div className="evidence-row evidence-row-rich" key={ev.id}><div className="evidence-main"><span>{ev.original_name}</span><small className={`evidence-validity evidence-${st.key}`}>{st.label}</small></div><div className="mini-actions"><button onClick={()=>openInline(`evidence/${ev.id}/view/`)}><Eye size={14}/> Xem</button><button onClick={()=>void download(`evidence/${ev.id}/download/`,ev.original_name)}><Download size={14}/> Tải</button></div></div>})}</div></div>
   {!readOnly&&<><div className="form-grid"><Field label="Thời hạn hiệu lực"><select value={validityMode} onChange={e=>setValidityMode(e.target.value as 'indefinite'|'fixed')}><option value="indefinite">Vô thời hạn</option><option value="fixed">Có thời hạn</option></select></Field></div>{validityMode==='fixed'&&<p className="verification-warning">Chức năng kiểm tra thời gian hiệu lực đang tạm khóa. Lựa chọn “Có thời hạn” hiện không phát sinh ngày hết hạn, cảnh báo hoặc điều kiện xác minh.</p>}<div className="action-row"><label className="secondary file-button">Tải minh chứng<input hidden type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>void upload(selected,e.target.files?.[0]||null)}/></label></div></>}
   {selected.evidence.length===0&&<p className="verification-warning">Công trình chưa đủ điều kiện để chọn khi tạo BM-04 vì chưa có minh chứng.</p>}
  </div></div></div>}
 </Card>
}
