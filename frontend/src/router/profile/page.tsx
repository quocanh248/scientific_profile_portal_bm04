import {useEffect,useState} from 'react'
import {Plus,Save} from 'lucide-react'
import {api,type Lecturer,type ProfileData} from '../../api'
import {Card,Field,currentYear,yearInput} from '../../components/ui'
import {useApp} from '../../app/AppContext'
import EvidenceSection from './EvidenceSection'
import {EditableAwards,EditableEducation,EditableEmployment,EditableIP,EditablePractical,EditableTasks} from './components'
import WorksSection from './WorksSection'
import {askConfirm} from '../../dialog'
import {editableSnapshot, mergeRelatedProfileData,profileHasUnsavedChanges} from './draftProtection'
import {updateProfileDirty} from './draftNavigationGuard'
export default function ProfilePage(){
 const {user:currentUser,catalog,tell}=useApp()
 const user=currentUser!
 const [data,setData]=useState<ProfileData|null>(null),[baseline,setBaseline]=useState<ProfileData|null>(null),[saving,setSaving]=useState(false),[lecturers,setLecturers]=useState<Lecturer[]>([]),[targetId,setTargetId]=useState('')
 const readOnly=user.role==='viewer_admin',isAdminView=user.role==='admin'||user.role==='viewer_admin'
 async function load(id?:string){
  try{
   const suffix=isAdminView?`?lecturer_id=${id||targetId}`:''
   if(isAdminView&&!id&&!targetId)return
   const loaded=await api<ProfileData>(`profile/${suffix}`)
   setData(loaded)
   setBaseline(loaded)
  }catch(e){tell((e as Error).message,true)}
 }
 // Không được tải lại toàn bộ hồ sơ rồi setData(remote) sau khi lưu công trình!
 // API công trình/minh chứng là độc lập, trong khi các phần khác có thể đang nhập dở.
 async function refreshRelated(lecturerId:string){
  try{
   const suffix=isAdminView?`?lecturer_id=${lecturerId}`:''
   const remote=await api<ProfileData>(`profile/${suffix}`)
   setData(prev=>prev?mergeRelatedProfileData(prev,remote):prev)
  }catch(e){tell(`Đã thực hiện thao tác nhưng chưa cập nhật được danh sách trên màn hình: ${(e as Error).message}`,true)}
 }
 const dirty=!!data&&!!baseline&&profileHasUnsavedChanges(data,baseline)
 useEffect(()=>{
  updateProfileDirty(dirty)
  return()=>updateProfileDirty(false)
 },[dirty])
 useEffect(()=>{
  if(!dirty)return
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''}
  window.addEventListener('beforeunload',warn)
  return()=>window.removeEventListener('beforeunload',warn)
 },[dirty])
 useEffect(()=>{void (async()=>{if(isAdminView){try{const ls=await api<Lecturer[]>('admin/lecturers/');setLecturers(ls);const first=ls[0]?.id||'';setTargetId(first);if(first)await load(first)}catch(e){tell((e as Error).message,true)}}else await load()})()},[user.role])
 function mutate<K extends keyof ProfileData>(key:K,value:ProfileData[K]){if(data)setData({...data,[key]:value})}
 async function save(){
  if(!data||readOnly||saving)return
  setSaving(true)
  try{
   const payload={...(user.role==='admin'?{lecturer_id:targetId}:{}),...editableSnapshot(data)}
   const updated=await api<ProfileData>('profile/','PATCH',payload)
   // Đã khóa tương tác toàn bộ form trong lúc gửi PATCH để tránh mất thay đổi
   // phát sinh giữa khi đang lưu và khi nhận phản hồi từ server.
   setData(updated)
   setBaseline(updated)
   tell(user.role==='admin'?'Admin đã cập nhật lý lịch khoa học của giảng viên.':'Đã lưu dữ liệu khoa học BM-04.')
  }catch(e){tell((e as Error).message,true)}finally{setSaving(false)}
 }
 async function changeTarget(id:string){
  if(id===targetId)return
  if(dirty&&!await askConfirm('Có thông tin lý lịch chưa lưu. Nếu đổi giảng viên, phần nhập dở sẽ bị mất. Bạn có muốn tiếp tục?','Dữ liệu chưa lưu'))return
  setTargetId(id);setData(null);setBaseline(null)
  if(id)await load(id)
 }
 if(isAdminView&&lecturers.length===0)return <div className="loading-inline">Chưa có giảng viên để quản lý.</div>
 if(!data)return <div className="loading-inline">Đang tải lý lịch BM-04...</div>
 const l=data.lecturer,s=data.science
 return <><div className="page-heading"><span className="eyebrow blue">BIỂU MẪU BM-04</span><h1>Lý lịch khoa học</h1><p>{readOnly?'Admin xem có thể xem toàn bộ lý lịch nhưng không được chỉnh sửa.':user.role==='admin'?'Admin có toàn quyền cập nhật dữ liệu khoa học thay cho giảng viên.':'Thông tin nhân sự cơ bản do Admin quản lý. Giảng viên tự cập nhật quá trình công tác và thông tin khoa học.'}</p></div>
 {isAdminView&&<Card title={readOnly?'Chọn giảng viên để xem':'Chọn giảng viên để thao tác'}><Field label="Giảng viên"><select value={targetId} onChange={e=>void changeTarget(e.target.value)}>{lecturers.map(x=><option key={x.id} value={x.id}>{x.staff_code} — {x.full_name} — {x.department}</option>)}</select></Field></Card>}
 {!readOnly&&<div className={dirty?'profile-draft-notice':'profile-draft-notice profile-draft-saved'} role="status">
  <span>{dirty?'Có thay đổi lý lịch chưa lưu. Lưu công trình khoa học hoặc tải minh chứng không đồng nghĩa đã lưu những mục này.':'Các mục thông tin lý lịch hiện không có thay đổi chưa lưu.'}</span>
  {dirty&&<button className="primary" disabled={saving} onClick={()=>void save()}><Save size={15}/>{saving?'Đang lưu...':'Lưu thay đổi lý lịch'}</button>}
 </div>}
 <fieldset className="profile-edit-fieldset" disabled={saving}>
 <div className="bm04-note"><strong>BM-04</strong> gồm thông tin cá nhân, đào tạo, quá trình công tác, tối đa 05 công trình tiêu biểu, sở hữu trí tuệ, ứng dụng thực tiễn, nhiệm vụ KH,CN&ĐMST, giải thưởng và thành tựu khác.</div>
 <Card title="1–7. Thông tin nhân sự & đơn vị công tác (quản lý tại mục Quản trị nhân sự)"><div className="form-grid"><Field label="Họ và tên"><input disabled value={l.full_name}/></Field><Field label="Số định danh cá nhân"><input disabled value={l.personal_id||'—'}/></Field><Field label="Ngày sinh"><input disabled value={l.date_of_birth||'—'}/></Field><Field label="Giới tính"><input disabled value={l.gender_label||'—'}/></Field><Field label="Chức danh nghề nghiệp"><input disabled value={l.professional_title||'—'}/></Field><Field label="Chức vụ"><input disabled value={l.position||'—'}/></Field><Field label="Địa chỉ nhà riêng"><input disabled value={l.home_address||'—'}/></Field><Field label="Điện thoại"><input disabled value={l.phone||'—'}/></Field><Field label="E-mail"><input disabled value={l.email||'—'}/></Field><Field label="Tên đơn vị"><input disabled value={data.organization.name}/></Field><Field label="Địa chỉ đơn vị"><input disabled value={data.organization.address||'—'}/></Field><Field label="Thủ trưởng / điện thoại"><input disabled value={`${data.organization.head_name||'—'} / ${data.organization.phone||'—'}`}/></Field></div></Card>
 <Card title="3 & 5. Học hàm, học vị và nhóm nhân tài"><div className="form-grid"><Field label="Học hàm (nếu có)"><input value={s.academic_rank} onChange={e=>mutate('science',{...s,academic_rank:e.target.value})}/></Field><Field label="Năm được bổ nhiệm học hàm">{yearInput(s.academic_rank_year,n=>mutate('science',{...s,academic_rank_year:n}))}</Field><Field label="Học vị (nếu có)"><input value={s.academic_degree} onChange={e=>mutate('science',{...s,academic_degree:e.target.value})}/></Field><Field label="Năm được công nhận học vị">{yearInput(s.academic_degree_year,n=>mutate('science',{...s,academic_degree_year:n}))}</Field><Field label="Phân loại"><select value={s.talent_category} onChange={e=>mutate('science',{...s,talent_category:e.target.value})}>{catalog.talent_categories.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field></div></Card>
 <Card title="8. Quá trình đào tạo" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('education',[...data.education,{level:'',institution:'',specialization:'',graduation_year:currentYear}])}><Plus size={15}/> Thêm dòng</button>}><EditableEducation rows={data.education} setRows={v=>mutate('education',v)}/><EvidenceSection user={user} lecturerId={l.id} section="education" items={data.education.map(x=>({id:x.id,label:`${x.level||'Bậc đào tạo'} — ${x.institution||'Nơi đào tạo'} (${x.graduation_year||''})`,evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <Card title="9. Quá trình công tác" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('employment',[...data.employment,{start_year:currentYear,end_year:null,position:'',organization:data.organization.name||'',organization_address:data.organization.address||''}])}><Plus size={15}/> Thêm quá trình công tác</button>}><p className="muted small">Giảng viên tự cập nhật quá trình công tác. Minh chứng không bắt buộc; có thể đính kèm quyết định tuyển dụng, điều động, bổ nhiệm hoặc tài liệu liên quan.</p><EditableEmployment rows={data.employment} setRows={v=>mutate('employment',v)}/><EvidenceSection user={user} lecturerId={l.id} section="employment" items={data.employment.map(x=>({id:x.id,label:`${x.start_year}-${x.end_year||'nay'} · ${x.position} · ${x.organization}`,evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <WorksSection user={user} catalog={catalog} lecturerId={l.id} works={data.my_works} readOnly={readOnly} onChanged={()=>refreshRelated(l.id)} tell={tell}/>
 <Card title="11. Văn bằng bảo hộ quyền sở hữu trí tuệ" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('ip_records',[...data.ip_records,{title_content:'',grant_year:currentYear}])}><Plus size={15}/> Thêm</button>}><EditableIP rows={data.ip_records} setRows={v=>mutate('ip_records',v)}/><EvidenceSection user={user} lecturerId={l.id} section="ip" items={data.ip_records.map(x=>({id:x.id,label:`${x.title_content} (${x.grant_year})`,evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <Card title="12. Công trình được áp dụng trong thực tiễn" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('practical_applications',[...data.practical_applications,{work_name:'',application_detail:'',start_date:'',end_date:''}])}><Plus size={15}/> Thêm</button>}><EditablePractical rows={data.practical_applications} setRows={v=>mutate('practical_applications',v)}/><EvidenceSection user={user} lecturerId={l.id} section="practical" items={data.practical_applications.map(x=>({id:x.id,label:x.work_name||'Công trình áp dụng thực tiễn',evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <Card title="13. Nhiệm vụ KH, CN&ĐMST đã và đang chủ trì hoặc tham gia" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('research_tasks',[...data.research_tasks,{name:'',participation_role:'participant',start_date:'',end_date:'',program_name:'',status:'ongoing'}])}><Plus size={15}/> Thêm</button>}><EditableTasks rows={data.research_tasks} setRows={v=>mutate('research_tasks',v)}/><EvidenceSection user={user} lecturerId={l.id} section="task" items={data.research_tasks.map(x=>({id:x.id,label:x.name||'Nhiệm vụ KH,CN&ĐMST',evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <Card title="14. Giải thưởng" actions={!readOnly&&<button className="secondary" onClick={()=>mutate('awards',[...data.awards,{description:'',award_year:currentYear}])}><Plus size={15}/> Thêm</button>}><EditableAwards rows={data.awards} setRows={v=>mutate('awards',v)}/><EvidenceSection user={user} lecturerId={l.id} section="award" items={data.awards.map(x=>({id:x.id,label:`${x.description} (${x.award_year})`,evidence:x.verification_evidence}))} onChanged={()=>refreshRelated(l.id)} tell={tell}/></Card>
 <Card title="15. Thành tựu hoạt động KH&CN và sản xuất kinh doanh khác"><textarea rows={5} value={s.other_achievements} onChange={e=>mutate('science',{...s,other_achievements:e.target.value})}/><EvidenceSection user={user} lecturerId={l.id} section="achievement" items={[{id:'science',label:'Thành tựu hoạt động KH&CN và sản xuất kinh doanh khác',evidence:s.verification_evidence}]} onChanged={()=>refreshRelated(l.id)} tell={tell}/><div className="action-row">{!readOnly&&<button className="primary" onClick={()=>void save()} disabled={saving}><Save size={17}/> {saving?'Đang lưu...':'Lưu lý lịch BM-04'}</button>}</div></Card></fieldset></>
}
