// Chạy với Node.js 22+: node --experimental-strip-types frontend/tests/profile_draft_preservation.test.mjs
import assert from 'node:assert/strict'
import {mergeRelatedProfileData,profileHasUnsavedChanges,editableSnapshot} from '../src/router/profile/draftProtection.ts'

const blank=()=>({
 lecturer:{id:'GV-001'},
 science:{academic_rank:'',academic_rank_year:null,academic_degree:'Cử nhân',academic_degree_year:null,talent_category:'none',other_achievements:'',verification_evidence:[]},
 education:[{id:1,level:'Đại học',institution:'Trường A',specialization:'',graduation_year:2020,verification_evidence:[{id:1}]}],
 employment:[{id:2,start_year:2022,end_year:null,position:'Giảng viên',organization:'Đơn vị A',organization_address:'',verification_evidence:[]}],
 ip_records:[{id:3,title_content:'VB A',grant_year:2021,verification_evidence:[]}],
 practical_applications:[{id:4,work_name:'Dự án A',application_detail:'',start_date:'',end_date:'',verification_evidence:[]}],
 research_tasks:[{id:5,name:'NV A',participation_role:'lead',start_date:'',end_date:'',program_name:'',status:'ongoing',verification_evidence:[]}],
 awards:[{id:6,description:'Giải thưởng A',award_year:2022,verification_evidence:[]}],
 my_works:[],verified_works:[],
})
const server=blank()
const draft=structuredClone(server)
draft.science.academic_degree='Tiến sĩ'
draft.education[0].institution='Trường B'
draft.education.push({level:'Thạc sĩ',institution:'Trường C',graduation_year:2026})
draft.employment[0].position='Giảng viên chính'
draft.ip_records[0].title_content='VB B'
draft.practical_applications[0].work_name='Dự án B'
draft.research_tasks[0].name='NV B'
draft.awards[0].description='Giải thưởng B'
assert.equal(profileHasUnsavedChanges(draft,server),true,'Nhận biết dữ liệu đang nhập chưa lưu')

// Mô phỏng thao tác lưu thêm công trình (API POST works/ thành công),
// sau đó GET profile/ trả về thông tin cũ của các mục chưa lưu.
const afterCreate=structuredClone(server)
afterCreate.my_works=[{id:'WNEW',title:'Công trình mới',evidence:[]}]
const preserved=mergeRelatedProfileData(draft,afterCreate)
for(const key of ['science','education','employment','ip_records','practical_applications','research_tasks','awards']){
 assert.deepEqual(editableSnapshot(preserved)[key],editableSnapshot(draft)[key],`Giữ nguyên dữ liệu mục ${key}`)
}
assert.equal(preserved.my_works[0].title,'Công trình mới')
assert.equal(profileHasUnsavedChanges(preserved,server),true)

// Mô phỏng upload minh chứng và làm mới riêng trạng thái minh chứng
const withEvidence=structuredClone(afterCreate)
withEvidence.education[0].verification_evidence=[{id:999,original_name:'bang-tot-nghiep.pdf'}]
withEvidence.science.verification_evidence=[{id:998}]
const refreshed=mergeRelatedProfileData(preserved,withEvidence)
assert.equal(refreshed.education[0].verification_evidence[0].id,999)
assert.equal(refreshed.education[1].institution,'Trường C','Dòng chưa được lưu vẫn còn')
assert.equal(refreshed.science.academic_degree,'Tiến sĩ')
assert.equal(refreshed.science.verification_evidence[0].id,998)
assert.equal(profileHasUnsavedChanges(refreshed,server),true)

// Không được gắn nhầm dữ liệu giữa hai giảng viên.
const other=structuredClone(afterCreate);other.lecturer.id='GV-002'
assert.equal(mergeRelatedProfileData(refreshed,other),refreshed)
// Thay đổi công trình/minh chứng không làm hiển thị cảnh báo 'chưa lưu' giả.
assert.equal(profileHasUnsavedChanges(mergeRelatedProfileData(server,withEvidence),server),false)

console.log('PASS: 15 nhóm kiểm tra bảo vệ bản nháp, minh chứng và công trình.')
