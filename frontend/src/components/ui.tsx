import type {ReactNode} from 'react'
import {FileText} from 'lucide-react'
import {labels,type EvidenceDocument} from '../api'

export const currentYear=new Date().getFullYear()
export function datefmt(s?:string|null){return s?new Date(s).toLocaleDateString('vi-VN'):'—'}
export function evidenceState(ev:EvidenceDocument){
 if(ev.validity_mode!=='fixed')return {key:'indefinite',label:'∞ Vô thời hạn',invalid:false}
 if(ev.valid_from){const start=new Date(`${ev.valid_from}T00:00:00`);const now=new Date();now.setHours(0,0,0,0);if(now<start)return {key:'not-yet-valid',label:`Chưa có hiệu lực · từ ${datefmt(ev.valid_from)}`,invalid:true}}
 if(!ev.valid_until)return {key:'expired',label:'Thiếu ngày hết hiệu lực',invalid:true}
 const end=new Date(`${ev.valid_until}T00:00:00`),now=new Date();now.setHours(0,0,0,0);const days=Math.ceil((end.getTime()-now.getTime())/86400000)
 if(days<0)return {key:'expired',label:`✕ Hết hiệu lực · ${datefmt(ev.valid_until)}`,invalid:true}
 if(days<=30)return {key:'expiring',label:`⚠ Sắp hết hiệu lực · còn ${days} ngày`,invalid:false}
 return {key:'valid',label:`✓ Còn hiệu lực · đến ${datefmt(ev.valid_until)}`,invalid:false}
}
export function Badge({status}:{status:string}){return <span className={`badge badge-${status}`}>{labels[status]||status}</span>}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
export function Card({title,actions,children}:{title?:string;actions?:ReactNode;children:ReactNode}){return <section className="card"><div className="card-header">{title&&<h3>{title}</h3>}{actions}</div>{children}</section>}
export function Empty({text}:{text:string}){return <div className="empty"><FileText size={30}/><p>{text}</p></div>}
export function Stat({icon,title,value}:{icon:ReactNode;title:string;value:string|number}){return <div className="stat"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>}
export function yearInput(value:number|null|undefined,onChange:(n:number|null)=>void){return <input type="number" min="1900" max={currentYear+2} value={value??''} onChange={e=>onChange(e.target.value?Number(e.target.value):null)}/>}
