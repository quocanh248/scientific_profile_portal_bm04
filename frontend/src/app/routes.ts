import type {Role} from '../api'

export type RouteKey='dashboard'|'profile'|'works'|'approvals'|'signature'|'reports'|'admin'|'password'
export type RouteMeta={key:RouteKey;path:string;label:string;roles:Role[]}
export const routeMeta:RouteMeta[]=[
 {key:'dashboard',path:'/',label:'Tổng quan',roles:['lecturer','reviewer','signer','admin','viewer_admin']},
 {key:'profile',path:'/profile',label:'Lý lịch BM-04',roles:['lecturer','admin','viewer_admin']},
 {key:'works',path:'/works',label:'Công trình khoa học',roles:['lecturer','reviewer','admin','signer','viewer_admin']},
 {key:'approvals',path:'/approvals',label:'In & phê duyệt BM-04',roles:['lecturer','reviewer','signer','admin','viewer_admin']},
 {key:'signature',path:'/signature',label:'Quản lý chữ ký',roles:['lecturer','signer','admin']},
 {key:'reports',path:'/reports',label:'Thống kê báo cáo',roles:['reviewer','signer','admin','viewer_admin']},
 {key:'admin',path:'/admin',label:'Quản trị nhân sự',roles:['admin','viewer_admin']},
 {key:'password',path:'/password',label:'Đổi mật khẩu',roles:['lecturer','reviewer','signer','admin','viewer_admin']},
]
export function metaForPath(pathname:string){return routeMeta.find(r=>r.path===pathname)||routeMeta[0]}
