import type {ReactNode} from 'react'
import {FileText} from 'lucide-react'
import {labels,type EvidenceDocument} from '../api'

export const currentYear=new Date().getFullYear()
export function datefmt(s?:string|null){return s?new Date(s).toLocaleDateString('vi-VN'):'—'}
export function evidenceState(ev:EvidenceDocument){
 if(ev.validity_mode==='fixed')return {key:'fixed-disabled',label:'Có thời hạn · đang tạm khóa kiểm tra hiệu lực',invalid:false}
 return {key:'indefinite',label:'∞ Vô thời hạn',invalid:false}
}

export function Badge({status}:{status:string}){return <span className={`badge badge-${status}`}>{labels[status]||status}</span>}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
export function Card({title,actions,children}:{title?:string;actions?:ReactNode;children:ReactNode}){return <section className="card"><div className="card-header">{title&&<h3>{title}</h3>}{actions}</div>{children}</section>}
export function Empty({text}:{text:string}){return <div className="empty"><FileText size={30}/><p>{text}</p></div>}
export function Stat({icon,title,value}:{icon:ReactNode;title:string;value:string|number}){return <div className="stat"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>}
export function yearInput(value:number|null|undefined,onChange:(n:number|null)=>void){return <input type="number" min="1900" max={currentYear+2} value={value??''} onChange={e=>onChange(e.target.value?Number(e.target.value):null)}/>}
