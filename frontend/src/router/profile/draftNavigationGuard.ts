/**
 * Chỉ giữ cờ cảnh báo trong bộ nhớ của tab hiện tại, KHÔNG lưu thông tin
 * hồ sơ cá nhân vào localStorage/sessionStorage.
 */
let profileDirty=false
export function updateProfileDirty(value:boolean){profileDirty=value}
export function isProfileDirty(){return profileDirty}
