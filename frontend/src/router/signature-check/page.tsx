import {useState} from 'react'
import {AlertTriangle,CheckCircle2,FileSearch,ShieldAlert,Upload,XCircle} from 'lucide-react'
import {api,type UploadedSignatureCheck} from '../../api'
import {Card} from '../../components/ui'
import {useApp} from '../../app/AppContext'

function verdictClass(v:UploadedSignatureCheck['verdict']){
  if(v==='valid_internal')return 'signature-check-ok'
  if(v==='external_pdf_signature_detected'||v==='scan_record_found'||v==='scan_personal_signature_only'||v==='scan_unverifiable')return 'signature-check-warn'
  return 'signature-check-bad'
}
function VerdictIcon({v}:{v:UploadedSignatureCheck['verdict']}){
  if(v==='valid_internal')return <CheckCircle2 size={22}/>
  if(v==='external_pdf_signature_detected'||v==='scan_record_found'||v==='scan_personal_signature_only'||v==='scan_unverifiable')return <AlertTriangle size={22}/>
  if(v==='invalid_internal')return <ShieldAlert size={22}/>
  return <XCircle size={22}/>
}
function sizefmt(n:number){if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024/1024).toFixed(2)} MB`}

export default function SignatureCheckPage(){
  const {tell}=useApp()
  const [file,setFile]=useState<File|null>(null)
  const [result,setResult]=useState<UploadedSignatureCheck|null>(null)
  const [busy,setBusy]=useState(false)
  const [verificationCode,setVerificationCode]=useState('')

  async function verify(){
    if(!file){tell('Hãy chọn tệp PDF/PNG/JPG cần kiểm tra.',true);return}
    const fd=new FormData();fd.append('file',file);if(verificationCode.trim())fd.append('verification_code',verificationCode.trim())
    setBusy(true);setResult(null)
    try{setResult(await api<UploadedSignatureCheck>('signing/verify-upload/','POST',fd))}
    catch(e){tell((e as Error).message,true)}
    finally{setBusy(false)}
  }

  return <><div className="page-heading"><span className="eyebrow blue">XÁC MINH TỆP</span><h1>Tra cứu tính hợp lệ BM-04</h1><p>Kiểm tra mật mã của PDF gốc; tra cứu nguồn gốc hồ sơ in/scan qua QR hoặc mã xác thực.</p></div><Card title="Tải lên BM-04 cần kiểm tra">
    <p className="muted small">Tải lên PDF gốc, PDF scan hoặc ảnh PNG/JPG (tối đa 20 MB). Hệ thống kiểm tra chữ ký mật mã của PDF gốc, hoặc đọc QR/mã xác thực trên bản scan để tìm hồ sơ phát hành. Tệp kiểm tra không được lưu lại.</p>
    <div className="form-grid"><label className="field"><span>Mã xác thực trên BM-04 (không bắt buộc)</span><input value={verificationCode} onChange={e=>{setVerificationCode(e.target.value);setResult(null)}} placeholder="Ví dụ: SIG-U-20261027-A1B2C3D4E5F6" /></label></div><p className="muted small">Với ảnh/scan cũ thiếu QR hoặc chất lượng kém, nhập mã SIG-U/SIG-P in ở phần chữ ký để tra cứu chính xác hơn.</p><div className="signature-upload-row">
      <label className="secondary file-button"><Upload size={16}/> Chọn tệp<input hidden type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null)}}/></label>
      <span className="signature-file-name">{file?`${file.name} · ${sizefmt(file.size)}`:'Chưa chọn tệp'}</span>
      <button className="primary" type="button" disabled={!file||busy} onClick={()=>void verify()}><FileSearch size={16}/>{busy?'Đang kiểm tra...':'Kiểm tra BM-04'}</button>
    </div>

    {result&&<div className={`signature-check-result ${verdictClass(result.verdict)}`}>
      <div className="signature-check-head"><VerdictIcon v={result.verdict}/><div><strong>{result.summary}</strong><small>{result.explanation}</small></div></div>
      <div className="signature-check-grid">
        <div><span>Tệp</span><strong>{result.file_name}</strong></div>
        <div><span>Loại</span><strong>{result.file_kind.toUpperCase()}</strong></div>
        <div><span>SHA-256</span><code>{result.sha256}</code></div>
        <div><span>Kết luận</span><strong>{result.cryptographic&&result.valid===true?'Chữ ký PDF gốc xác thực mật mã':result.verdict==='scan_record_found'?'Đã tìm thấy bản gốc đã duyệt (scan chưa xác thực)':result.verdict==='scan_personal_signature_only'?'Tìm thấy chữ ký cá nhân, chưa duyệt hoàn tất':result.valid===false?'Không có chữ ký số được xác thực':'Chưa đủ căn cứ xác thực'}</strong></div>
      </div>
      {(result.queried_codes||[]).length>0&&<div className="signature-check-note"><strong>Mã tra cứu:</strong> {result.queried_codes?.join(', ')}</div>}
      {(result.scan_records||[]).length>0&&<div className="signature-check-list"><h4>Hồ sơ gốc đối chiếu trong hệ thống</h4>{result.scan_records?.map(x=><div className="signature-check-signature" key={x.verification_code}><div><strong>{x.approval_code} — {x.lecturer}</strong><small>{x.signature_role_label} · Người ký: {x.signer}</small><small>Ngày ký: {new Date(x.signed_at).toLocaleString('vi-VN')}</small></div><div><strong>{x.verification_code}</strong><small>{x.source_signature_valid?'Chữ ký trên bản gốc xác minh thành công':'Không xác minh được chữ ký bản gốc'}</small><small>{x.approval_completed?'BM-04 đã được ký hoàn tất':'Chưa xác nhận hoàn tất phê duyệt'}</small></div></div>)}</div>}
      {result.scan_records&&<div className="signature-check-note"><strong>Giới hạn kiểm tra:</strong> Mã tra cứu đúng không có nghĩa bản scan đã được đối chiếu từng dòng với bản gốc. Cần sử dụng PDF gốc đã ký để xác minh tính toàn vẹn nội dung bằng mật mã.</div>}
      {result.internal_signatures.length>0&&<div className="signature-check-list"><h4>Chữ ký nội bộ đối chiếu được</h4>{result.internal_signatures.map(x=><div className="signature-check-signature" key={x.verification_code}><div><strong>{x.signer}</strong><small>{x.signature_role_label} · {x.position||'Không ghi chức vụ'}</small></div><div><strong>{x.verification_code}</strong><small>Serial {x.certificate_serial} · {x.algorithm}</small></div></div>)}</div>}
      {result.embedded_pdf_signature?.detected&&<div className="signature-check-note"><strong>PDF có {result.embedded_pdf_signature.count} cấu trúc chữ ký nhúng.</strong>{result.embedded_pdf_signature.subfilters.length>0&&<span> SubFilter: {result.embedded_pdf_signature.subfilters.join(', ')}.</span>}<br/>V8.1 chưa xác minh chuỗi chứng thư của nhà cung cấp bên ngoài, OCSP/CRL hoặc timestamp nên không ghi nhận là “hợp lệ” chỉ dựa vào dấu hiệu này.</div>}
    </div>}
  </Card></>
}
