import {useState,type FormEvent} from 'react'
import {useNavigate} from 'react-router-dom'
import {api,type User} from '../../api'
import {Card,Field} from '../../components/ui'
import {useApp} from '../../app/AppContext'

export default function PasswordPage(){
 const {tell,setUser,refreshCatalog}=useApp()
 const navigate=useNavigate()
 const [cur,setCur]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('')
 async function save(e:FormEvent){e.preventDefault();if(next!==confirm){tell('Mật khẩu xác nhận chưa khớp.',true);return}try{await api('password/','POST',{current_password:cur,new_password:next});setUser(await api<User>('me/'));await refreshCatalog();setCur('');setNext('');setConfirm('');tell('Đã đổi mật khẩu.');navigate('/profile',{replace:true})}catch(ex){tell((ex as Error).message,true)}}
 return <><div className="page-heading"><span className="eyebrow blue">BẢO MẬT</span><h1>Đổi mật khẩu</h1></div><Card title="Thông tin xác thực"><form onSubmit={save} className="password-form"><Field label="Mật khẩu hiện tại"><input type="password" required value={cur} onChange={e=>setCur(e.target.value)}/></Field><Field label="Mật khẩu mới (tối thiểu 12 ký tự)"><input type="password" required minLength={12} value={next} onChange={e=>setNext(e.target.value)}/></Field><Field label="Nhập lại mật khẩu mới"><input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></Field><button className="primary">Lưu mật khẩu</button></form></Card></>
}
