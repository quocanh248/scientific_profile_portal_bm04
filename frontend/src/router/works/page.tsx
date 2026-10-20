import {Navigate} from 'react-router-dom'

/**
 * V8: Công trình khoa học đã được chuyển vào Mục 10 của /profile.
 * Giữ file route legacy để các bookmark/source cũ không lỗi, nhưng không còn
 * màn hình xác minh công trình độc lập.
 */
export default function WorksLegacyPage(){
 return <Navigate to="/profile" replace/>
}
