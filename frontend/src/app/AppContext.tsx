import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react'
import {api,type Catalog,type User} from '../api'
import {showMessage} from '../dialog'

export type AppContextValue={
 user:User|null
 ready:boolean
 catalog:Catalog
 tell:(message:string,error?:boolean)=>void
 login:(username:string,password:string)=>Promise<User>
 logout:()=>Promise<void>
 refreshUser:()=>Promise<User|null>
 refreshCatalog:()=>Promise<Catalog>
 setUser:(user:User|null)=>void
}

const AppContext=createContext<AppContextValue|null>(null)
const emptyCatalog:Catalog={departments:[],work_types:[],talent_categories:[],registered_roles:[]}

export function AppProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null)
 const [ready,setReady]=useState(false)
 const [catalog,setCatalog]=useState<Catalog>(emptyCatalog)
 function tell(message:string,error=false){void showMessage(message,error)}
 async function refreshCatalog(){const c=await api<Catalog>('catalogs/');setCatalog(c);return c}
 async function refreshUser(){try{await api('csrf/');const u=await api<User>('me/');setUser(u);return u}catch{setUser(null);return null}}
 async function bootstrap(){try{const u=await refreshUser();if(u)await refreshCatalog()}finally{setReady(true)}}
 useEffect(()=>{void bootstrap()},[])
 async function login(username:string,password:string){await api('csrf/');const u=await api<User>('login/','POST',{username,password});setUser(u);await refreshCatalog();return u}
 async function logout(){await api('logout/','POST');setUser(null)}
 const value=useMemo<AppContextValue>(()=>({user,ready,catalog,tell,login,logout,refreshUser,refreshCatalog,setUser}),[user,ready,catalog])
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp():AppContextValue{const value=useContext<AppContextValue|null>(AppContext);if(!value)throw new Error('useApp phải được dùng bên trong AppProvider');return value}
