import type {ProfileData} from '../../api'

/**
 * Danh sách trường có thể sửa trên trang hồ sơ.
 * Không đưa minh chứng hay danh sách công trình vào fingerprint: các phần này
 * được lưu qua API riêng và refresh của chúng không được làm mất nội dung nhập dở.
 */
const editableRows = <T extends {id?:number;verification_evidence?:unknown}>(rows:T[]) =>
 rows.map(({verification_evidence: _evidence, ...fields}) => fields)

export function editableSnapshot(data:ProfileData){
 const {verification_evidence: _evidence,...science}=data.science
 return {
  science,
  education:editableRows(data.education),
  employment:editableRows(data.employment),
  ip_records:editableRows(data.ip_records),
  practical_applications:editableRows(data.practical_applications),
  research_tasks:editableRows(data.research_tasks),
  awards:editableRows(data.awards),
 }
}

export function profileHasUnsavedChanges(local:ProfileData, saved:ProfileData){
 return JSON.stringify(editableSnapshot(local))!==JSON.stringify(editableSnapshot(saved))
}

/**
 * Khi lưu công trình hoặc gắn minh chứng, chỉ đồng bộ metadata thực sự đã
 * thay đổi ở server. Giữ nguyên các trường editable trong bản nháp của người dùng.
 * Dòng vừa nhập chưa lưu (chưa có id) được giữ nguyên, dòng đã lưu nhận trạng
 * thái minh chứng mới theo khóa id.
 */
export function mergeRelatedProfileData(local:ProfileData, remote:ProfileData):ProfileData{
 if(local.lecturer.id!==remote.lecturer.id)return local
 const mergeEvidence=<T extends {id?:number;verification_evidence?:unknown}>(localRows:T[],remoteRows:T[]):T[]=>{
  const remoteById=new Map(remoteRows.filter(x=>x.id!=null).map(x=>[x.id,x]))
  return localRows.map(x=>{
   const incoming=x.id!=null?remoteById.get(x.id):undefined
   return incoming?{...x,verification_evidence:incoming.verification_evidence}:x
  })
 }
 return {
  ...local,
  my_works:remote.my_works,
  verified_works:remote.verified_works,
  science:{...local.science,verification_evidence:remote.science.verification_evidence},
  education:mergeEvidence(local.education,remote.education),
  employment:mergeEvidence(local.employment,remote.employment),
  ip_records:mergeEvidence(local.ip_records,remote.ip_records),
  practical_applications:mergeEvidence(local.practical_applications,remote.practical_applications),
  research_tasks:mergeEvidence(local.research_tasks,remote.research_tasks),
  awards:mergeEvidence(local.awards,remote.awards),
 }
}
