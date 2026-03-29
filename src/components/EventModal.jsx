import { useState } from 'react';

export default function EventModal({ event, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...event });

  const handleSave = () => {
    // 説明文から#タグを抽出
    const tags = formData.description?.match(/#[^\s#]+/g)?.map(t => t.replace('#', '')) || [];
    onSave({ ...formData, tags: Array.from(new Set(tags)) });
  };

  return (
    <div style={{
      position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
      width: '320px', padding: '20px', backgroundColor: 'white',
      border: '2px solid #000', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ marginTop: 0 }}>イベント編集</h3>
      <label style={{ fontSize: '12px' }}>日付</label>
      <input 
        type="date" 
        value={formData.date} 
        onChange={e => setFormData({...formData, date: e.target.value})} 
        style={{ width: '100%', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} 
      />
      <label style={{ fontSize: '12px' }}>タイトル</label>
      <input 
        type="text" 
        value={formData.title} 
        onChange={e => setFormData({...formData, title: e.target.value})} 
        style={{ width: '100%', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} 
      />
      <label style={{ fontSize: '12px' }}>説明（#タグで自動登録）</label>
      <textarea 
        value={formData.description} 
        onChange={e => setFormData({...formData, description: e.target.value})} 
        style={{ width: '100%', height: '80px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} 
      />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 15px', cursor: 'pointer' }}>キャンセル</button>
        <button onClick={handleSave} style={{ padding: '8px 15px', cursor: 'pointer', background: '#000', color: '#fff' }}>保存</button>
      </div>
    </div>
  );
}