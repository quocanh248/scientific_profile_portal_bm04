export type Role = 'lecturer'|'reviewer'|'signer'|'admin'|'viewer_admin'
export interface EvidenceDocument {id:number;section:string;section_label?:string;entity_id:string;original_name:string;mime_type:string;sha256:string;size:number;created_at?:string;uploaded_by?:string;validity_mode:'indefinite'|'fixed';validity_mode_label?:string;valid_from:string|null;valid_until:string|null;validity_status?:string;days_remaining?:number|null;links?:{section:string;section_label?:string;entity_id:string}[]}
export interface Lecturer {
 id:string;staff_code:string;full_name:string;personal_id:string;date_of_birth:string;gender:string;gender_label:string;
 professional_title:string;position:string;home_address:string;phone:string;email:string;
 department_id:number;department:string;status:string;username:string;
 employment?:EmploymentRecord[]
}
export interface User {id:number;username:string;role:Role;must_change_password:boolean;lecturer:Lecturer|null}
export interface Science {
 academic_rank:string;academic_rank_year:number|null;academic_degree:string;academic_degree_year:number|null;
 talent_category:string;other_achievements:string;verification_evidence?:EvidenceDocument[]
}
export interface EducationRecord {id?:number;level:string;institution:string;specialization:string;graduation_year:number;verification_evidence?:EvidenceDocument[]}
export interface EmploymentRecord {id?:number;start_year:number;end_year:number|null;position:string;organization:string;organization_address:string;verification_evidence?:EvidenceDocument[]}
export interface IPRecord {id?:number;title_content:string;grant_year:number;verification_evidence?:EvidenceDocument[]}
export interface PracticalRecord {id?:number;work_name:string;application_detail:string;start_date:string;end_date:string;verification_evidence?:EvidenceDocument[]}
export interface TaskRecord {id?:number;name:string;participation_role:'lead'|'participant';start_date:string;end_date:string;program_name:string;status:'accepted'|'ongoing';verification_evidence?:EvidenceDocument[]}
export interface AwardRecord {id?:number;description:string;award_year:number;verification_evidence?:EvidenceDocument[]}
export interface Catalog {
 departments:{id:number;code:string;name:string;address:string;head_name:string;phone:string}[];
 work_types:{id:number;code:string;name:string}[];
 talent_categories:{value:string;label:string}[];
 registered_roles:{value:string;label:string}[]
}
export interface WorkAuthor {id:number;name:string;lecturer_id:string|null;author_order:number;authorship_type:'author'|'coauthor';authorship_label:string;role_note:string}
export interface Work {id:string;title:string;work_type_id:number;work_type:string;publication_year:number;doi:string;venue:string;status:string;created_by_id:number;created_at:string;authors:WorkAuthor[];evidence:EvidenceDocument[];verification_evidence?:EvidenceDocument[];my_authorship_type?:string;my_authorship_label?:string}
export interface ProfileData {
 lecturer:Lecturer;organization:{id:number;name:string;address:string;head_name:string;phone:string};science:Science;
 education:EducationRecord[];employment:EmploymentRecord[];ip_records:IPRecord[];practical_applications:PracticalRecord[];
 research_tasks:TaskRecord[];awards:AwardRecord[];my_works:Work[];verified_works:Work[]
}
export interface Approval {id:string;code:string;version:number;parent_approval_id:string|null;form_code:string;form_version:string;lecturer_id:string;lecturer:string;task_name:string;registered_role:string;registered_role_label:string;registered_role_other:string;status:string;comment:string;submitted_at:string;has_scan:boolean;has_signed_pdf:boolean;has_personal_signature:boolean;has_unit_signature:boolean;verification_total:number;verification_verified:number;verification_complete:boolean;approved_at:string|null;completed_at:string|null}
export interface ApprovalPage {results:Approval[];count:number;page:number;pages:number;page_size:number}
export interface ApprovalVerificationItem {id:number;section:string;section_label:string;entity_id:string;label:string;status:string;evidence_required:boolean;evidence:EvidenceDocument[];reused:boolean;comment:string;reviewer:string|null;reviewed_at:string|null}
export interface ApprovalDetail extends Approval {lecturer_code:string;lecturer_department:string;snapshot:Record<string,unknown>;linked_works:Work[];verification_items:ApprovalVerificationItem[];lecturer_logs:{at:string;actor:string|null;action:string;entity:string;entity_id:string;details:Record<string,unknown>}[];events:{action:string;note:string;actor:string;at:string}[]}
export interface NotificationItem {id:number;title:string;body:string;created_at:string;read:boolean}
export interface Report {period:string;from_date:string;to_date:string;total_lecturers:number;total_works:number;pending_works:number;pending_approvals:number;approvals_created:number;approvals_approved:number;approvals_signed:number;approvals_completed:number;works_created:number;works_verified:number;active_users:number;approval_status:{status:string;total:number}[];by_year:{publication_year:number;total:number}[];by_type:{work_type__name:string;total:number}[];by_department:{department_at_publication__name:string;total:number}[];note:string}
export interface SigningIdentity {user_id:number;username:string;provisioned:boolean;display_name?:string;position?:string;certificate_serial?:string;valid_from?:string;valid_to?:string;has_signature_image:boolean;is_active?:boolean}
export interface SignatureVerificationItem {valid:boolean;signature_role:'personal'|'unit';signature_role_label:string;verification_code:string;signer:string;position:string;certificate_serial:string;signed_at:string;signed_pdf_sha256:string;algorithm:string}
export interface SignatureVerification {valid:boolean;verification_code:string;signer:string;position:string;certificate_serial:string;signed_at:string;signed_pdf_sha256:string;algorithm:string;signatures:SignatureVerificationItem[]}

function cookie(name:string):string {return decodeURIComponent(document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.split('=').slice(1).join('=')||'')}
export class ApiError extends Error {status:number;duplicate?:{id:string;title:string;status:string};constructor(message:string,status:number,duplicate?:{id:string;title:string;status:string}){super(message);this.status=status;this.duplicate=duplicate}}

async function parseError(response:Response){let e:{error?:string;duplicate?:{id:string;title:string;status:string}}={};try{e=await response.json()}catch{};return new ApiError(e.error||`Lỗi máy chủ (${response.status})`,response.status,e.duplicate)}

export async function api<T>(path:string, method='GET', data?:unknown):Promise<T>{
 const isForm=data instanceof FormData
 const response=await fetch(`/api/${path.replace(/^\//,'')}`,{method,credentials:'same-origin',headers:{...(data&&!isForm?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRFToken':cookie('csrftoken')}: {})},body:data?(isForm?data:JSON.stringify(data)):undefined})
 if(!response.ok)throw await parseError(response)
 return response.json() as Promise<T>
}

export async function download(path:string,filename:string){
 const response=await fetch(`/api/${path}`,{credentials:'same-origin'});if(!response.ok)throw await parseError(response)
 saveBlob(await response.blob(),filename)
}
export async function downloadPost(path:string,filename:string,data:unknown){
 const response=await fetch(`/api/${path}`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRFToken':cookie('csrftoken')},body:JSON.stringify(data)})
 if(!response.ok)throw await parseError(response)
 saveBlob(await response.blob(),filename)
}
export function openInline(path:string){window.open(`/api/${path.replace(/^\//,'')}`,'_blank','noopener,noreferrer')}
function saveBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}

export const labels:Record<string,string>={
 draft:'Bản nháp',pending:'Chờ xác minh',changes:'Cần bổ sung',verified:'Đã xác minh',rejected:'Từ chối',snapshot:'Theo bản BM-04 đã chốt',
 review:'Chờ NCKH',signer:'Chờ lãnh đạo',print:'Chờ ký số nội bộ',signed:'Chờ lưu scan (legacy)',completed:'Hoàn tất',
 lead:'Chủ nhiệm',secretary:'Thư ký',other:'Chức danh khác',
 author:'Tác giả',coauthor:'Đồng tác giả',accepted:'Đã nghiệm thu',ongoing:'Chưa nghiệm thu',participant:'Tham gia'
}

export const roleLabels:Record<Role,string>={lecturer:'Giảng viên',reviewer:'Cán bộ NCKH',signer:'Lãnh đạo ký',admin:'Quản trị',viewer_admin:'Admin xem'}
