import {useEffect,useState} from 'react'
import {ShieldCheck,Upload} from 'lucide-react'
import {api,type SigningIdentity} from '../../api'
import {Card,Field,datefmt} from '../../components/ui'
import {useApp} from '../../app/AppContext'

export default function SignaturePage(){
 const {user:currentUser,tell}=useApp()
 const user=currentUser!
 const [identity,setIdentity]=useState<SigningIdentity|null>(null)
 const [sigName,setSigName]=useState('')
 const [sigPosition,setSigPosition]=useState('')
 const [loading,setLoading]=useState(true)
 async function loadIdentity(){try{const x=await api<SigningIdentity>('signing/identity/');setIdentity(x);setSigName(x.display_name||user.lecturer?.full_name||user.username);setSigPosition(x.position||user.lecturer?.professional_title||user.lecturer?.position||'')}catch(e){tell((e as Error).message,true)}finally{setLoading(false)}}
 useEffect(()=>{void loadIdentity()},[])
 async function uploadSignature(file:File|null){if(!file)return;const fd=new FormData();fd.append('file',file);fd.append('display_name',sigName);fd.append('position',sigPosition);try{const x=await api<SigningIdentity>('signing/identity/','POST',fd);setIdentity(x);tell('Đã lưu ảnh chữ ký và cấp/cập nhật chứng thư ký số nội bộ.')}catch(e){tell((e as Error).message,true)}}
 if(loading)return <div className="loading-inline">Đang tải thông tin chữ ký...</div>
 return <><div className="page-heading"><span className="eyebrow blue">CHỮ KÝ SỐ NỘI BỘ</span><h1>Quản lý chữ ký</h1><p>Quản lý danh tính ký số, chứng thư nội bộ và ảnh chữ ký sử dụng trên biểu mẫu BM-04.</p></div><Card title="Danh tính người ký"><div className="form-grid"><Field label="Họ tên hiển thị dưới chữ ký"><input value={sigName} onChange={e=>setSigName(e.target.value)}/></Field><Field label="Chức vụ / chức danh người ký"><input value={sigPosition} onChange={e=>setSigPosition(e.target.value)}/></Field></div><div className="signature-status"><ShieldCheck size={18}/><span>{identity?.provisioned?`Đã cấp chứng thư · Serial ${identity.certificate_serial||'—'}`:'Chưa được cấp chứng thư'}</span><span>{identity?.has_signature_image?'Đã có ảnh chữ ký':'Chưa có ảnh chữ ký'}</span></div></Card><Card title="Thông tin chứng thư"><div className="record"><div><strong>Serial chứng thư</strong><small>{identity?.certificate_serial||'—'}</small></div></div><div className="record"><div><strong>Hiệu lực từ</strong><small>{datefmt(identity?.valid_from)}</small></div></div><div className="record"><div><strong>Hiệu lực đến</strong><small>{datefmt(identity?.valid_to)}</small></div></div></Card><Card title="Ảnh chữ ký"><p className="muted small">Ảnh PNG/JPG chỉ là phần hiển thị trực quan trên BM-04. Chữ ký mật mã được tạo bằng khóa riêng và chứng thư nội bộ.</p><label className="secondary file-button"><Upload size={16}/> {identity?.has_signature_image?'Cập nhật ảnh chữ ký':'Tải ảnh chữ ký'}<input hidden type="file" accept=".png,.jpg,.jpeg" onChange={e=>void uploadSignature(e.target.files?.[0]||null)}/></label></Card></>
}
