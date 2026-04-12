// import React, { useState, useEffect } from 'react';

// export default function LaneSettingsModal({ initialConfig, onSave, onCancel, onDelete, onChange }) {
//   const [title, setTitle] = useState(initialConfig.title || '');
//   const [tags, setTags] = useState(initialConfig.condition?.tags || []);
//   const [logic, setLogic] = useState(initialConfig.condition?.logic || 'OR');
//   const [tagInput, setTagInput] = useState('');

//   // 編集内容が変わるたびに TimelineTab へプレビュー条件として通知
//   useEffect(() => {
//     onChange({ tags, logic });
//   }, [tags, logic]);

//   const handleAddTag = () => {
//     const trimmed = tagInput.trim();
//     if (trimmed && !tags.find(t => t.text === trimmed)) {
//       setTags([...tags, { text: trimmed }]);
//     }
//     setTagInput('');
//   };

//   const handleRemoveTag = (tagTextToRemove) => {
//     setTags(tags.filter(t => t.text !== tagTextToRemove));
//   };

//   const handleSave = () => {
//     onSave(initialConfig.id, { title, condition: { tags, logic } });
//   };

//   return (
//     <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//       <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
//         <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>年表の設定</h2>
        
//         <div style={{ marginBottom: '20px' }}>
//           <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>タイトル</label>
//           <input 
//             type="text" value={title} onChange={e => setTitle(e.target.value)}
//             style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '2px solid #ccc', borderRadius: '6px', fontSize: '16px' }}
//           />
//         </div>

//         <div style={{ marginBottom: '30px' }}>
//           <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>抽出条件（タグ）</label>
//           <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #ccc', borderRadius: '6px', padding: '5px 10px', marginBottom: '10px' }}>
//             <select 
//               value={logic} onChange={e => setLogic(e.target.value)}
//               style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', outline: 'none' }}
//             >
//               <option value="OR">OR</option>
//               <option value="AND">AND</option>
//             </select>
//             <div style={{ width: '1px', height: '14px', background: '#ccc', margin: '0 10px' }} />
//             <input 
//               type="text" placeholder="タグを入力してEnter" value={tagInput}
//               onChange={e => setTagInput(e.target.value)}
//               onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddTag(); } }}
//               style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px' }}
//             />
//             {tagInput.trim() && (
//               <button onClick={handleAddTag} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>追加</button>
//             )}
//           </div>

//           <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
//             {tags.map((tag, i) => (
//               <span key={`${tag.text}-${i}`} style={{ background: '#e0e0e0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                 <span style={{ fontWeight: 'bold', color: '#666' }}>{logic}</span>
//                 {tag.text}
//                 <button onClick={() => handleRemoveTag(tag.text)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontSize: '14px', color: '#666' }}>×</button>
//               </span>
//             ))}
//             {tags.length === 0 && <span style={{ fontSize: '12px', color: '#888' }}>条件が設定されていません</span>}
//           </div>
//         </div>

//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
//           <button 
//             onClick={() => { if (window.confirm("この年表を削除しますか？\n(イベント自体は削除されません)")) onDelete(initialConfig.id); }}
//             style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
//           >
//             年表を削除
//           </button>
          
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button onClick={onCancel} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>キャンセル</button>
//             <button onClick={handleSave} disabled={!title.trim() || tags.length === 0} style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: (!title.trim() || tags.length === 0) ? 0.5 : 1 }}>
//               保存
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }