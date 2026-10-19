import {BrowserRouter} from 'react-router-dom'
import {AppProvider} from './app/AppContext'
import AppRouter from './router'

export default function App(){return <BrowserRouter><AppProvider><AppRouter/></AppProvider></BrowserRouter>}
