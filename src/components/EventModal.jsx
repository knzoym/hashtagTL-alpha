import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export default function EventModal({ event, onSave, onCancel }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ 
    ...event,
    url: event.url || '',
    image: event.image || '',
    tags: event.tags || []
  });
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 画像アップロード・ペースト処理 (共通)
  const uploadImage = async (file) => {
    setIsUploading(true);
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: data });
      const result = await res.json();
      setFormData(prev => ({ ...prev, image: result.imagePath }));
    } catch (err) { alert('アップロード失敗'); } finally { setIsUploading(false); }
  };

  const handleAddTag = () => {
    const cleanTag = newTag.trim().replace('#', '');
    if (cleanTag && !formData.tags.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSave = () => {
    // 保存直前に説明文からもハッシュタグを拾って統合する
    const descTags = formData.description?.match(/#[^\s#]+/g)?.map(t => t.replace('#', '')) || [];
    const mergedTags = Array.from(new Set([...formData.tags, ...descTags]));
    onSave({ ...formData, tags: mergedTags });
  };

  return (
    <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', width: '380px', padding: '20px', backgroundColor: 'white', border: '2px solid #000', zIndex: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>イベント編集</h3>

      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>画像（貼り付け可）</label>
      <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '150px', backgroundColor: '#f0f0f0', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', cursor: 'pointer', position: 'relative' }}>
        {formData.image ? <img src={`${API_BASE_URL}${formData.image}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#999' }}>{isUploading ? '...' : '+ 画像'}</div>}
      </div>
      <input type="file" ref={fileInputRef} onChange={(e) => uploadImage(e.target.files[0])} style={{ display: 'none' }} />

      {/* タグ管理欄 */}
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>登録済みのタグ</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '5px 0 10px' }}>
        {formData.tags.map(tag => (
          <span key={tag} style={{ background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '15px', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
            #{tag} <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '5px', cursor: 'pointer', fontSize: '12px' }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="新しいタグ" style={{ flex: 1, padding: '5px' }} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
        <button onClick={handleAddTag} style={{ padding: '5px 10px', background: '#eee', border: '1px solid #000', cursor: 'pointer' }}>追加</button>
      </div>

      <label style={{ fontSize: '11px' }}>タイトル</label>
      <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
      
      <label style={{ fontSize: '11px' }}>説明文</label>
      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: '60px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} />
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel}>キャンセル</button>
        <button onClick={handleSave} style={{ background: '#000', color: '#fff', padding: '8px 15px', cursor: 'pointer' }}>保存</button>
      </div>
    </div>
  );
}