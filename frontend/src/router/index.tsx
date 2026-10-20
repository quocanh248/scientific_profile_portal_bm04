import {Navigate,Route,Routes,useLocation} from 'react-router-dom'
import type {ReactNode} from 'react'
import AppLayout from '../layouts/AppLayout'
import {useApp} from '../app/AppContext'
import type {Role} from '../api'
import DashboardPage from './page'
import LoginPage from './login/page'
import ProfilePage from './profile/page'
import ApprovalsPage from './approvals/page'
import SignaturePage from './signature/page'
import ReportsPage from './reports/page'
import AdminPage from './admin/page'
import PasswordPage from './password/page'

function Protected({children,roles}:{children:ReactNode;roles?:Role[]}){const {user,ready}=useApp(),location=useLocation();if(!ready)return <div className="loading">Đang tải hệ thống...</div>;if(!user)return <Navigate to="/login" replace/>;if(user.must_change_password&&location.pathname!=='/password')return <Navigate to="/password" replace/>;if(roles&&!roles.includes(user.role))return <Navigate to="/" replace/>;return <>{children}</>}

export default function AppRouter(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route element={<Protected><AppLayout/></Protected>}><Route index element={<DashboardPage/>}/><Route path="profile" element={<Protected roles={['lecturer','admin','viewer_admin']}><ProfilePage/></Protected>}/><Route path="works" element={<Navigate to="/profile" replace/>}/><Route path="approvals" element={<Protected roles={['lecturer','reviewer','signer','admin','viewer_admin']}><ApprovalsPage/></Protected>}/><Route path="signature" element={<Protected roles={['lecturer','signer','admin']}><SignaturePage/></Protected>}/><Route path="reports" element={<Protected roles={['reviewer','signer','admin','viewer_admin']}><ReportsPage/></Protected>}/><Route path="admin" element={<Protected roles={['admin','viewer_admin']}><AdminPage/></Protected>}/><Route path="password" element={<PasswordPage/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
