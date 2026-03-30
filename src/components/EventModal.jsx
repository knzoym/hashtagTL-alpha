import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export default function EventModal({ event, onSave, onCancel }) {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ドラッグ移動用のロジック ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleDragMouseDown = (e) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [offset]);
  // ------------------------------

  const parseDate = (dateStr) => {
    if (!dateStr) return { year: '', month: '', day: '' };
    const parts = dateStr.split('-');
    return {
      year: parts[0] || '',
      month: parts[1] || '',
      day: parts[2] || ''
    };
  };

  const [dateInputs, setDateInputs] = useState(parseDate(event.date));
  const [formData, setFormData] = useState({ 
    ...event,
    title: event.title || '',
    description: event.description || '',
    url: event.url || '',
    image: event.image || '',
    tags: event.tags || []
  });
  
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const stopWheel = (e) => e.stopPropagation();
    modal.addEventListener('wheel', stopWheel);
    return () => modal.removeEventListener('wheel', stopWheel);
  }, []);

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
    const y = dateInputs.year || '2000';
    const m = dateInputs.month ? String(dateInputs.month).padStart(2, '0') : '01';
    const d = dateInputs.day ? String(dateInputs.day).padStart(2, '0') : '01';
    const formattedDate = `${y}-${m}-${d}`;

    const descTags = formData.description?.match(/#[^\s#]+/g)?.map(t => t.replace('#', '')) || [];
    const mergedTags = Array.from(new Set([...formData.tags, ...descTags]));
    
    onSave({ ...formData, date: formattedDate, tags: mergedTags });
  };

  const handlePaste = (e) => {
    const file = e.clipboardData?.files[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      uploadImage(file);
    }
  };

  return (
    <div 
      ref={modalRef}
      onPaste={handlePaste} 
      onMouseDown={(e) => e.stopPropagation()} 
      style={{ 
        position: 'absolute', 
        top: '50px', 
        left: '50%', 
        // transformにoffsetを適用して動かす
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`, 
        width: '380px', 
        backgroundColor: 'white', 
        border: '2px solid #000', 
        zIndex: 200, 
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
        maxHeight: '85vh', 
        overflowY: 'auto' 
      }}
    >
      {/* ドラッグハンドル（ヘッダー） */}
      <div 
        onMouseDown={handleDragMouseDown}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#000', 
          color: '#fff', 
          cursor: 'move', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>EVENT EDITOR</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>×</button>
      </div>

      <div style={{ padding: '20px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>画像（貼り付け可）</label>
        <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '150px', backgroundColor: '#f0f0f0', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', cursor: 'pointer', position: 'relative' }}>
          {formData.image ? <img src={`${API_BASE_URL}${formData.image}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#999' }}>{isUploading ? '...' : '+ 画像'}</div>}
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => uploadImage(e.target.files[0])} style={{ display: 'none' }} />

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

        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>タイトル</label>
        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
        
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>日付</label>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
          <input type="number" value={dateInputs.year} onChange={e => setDateInputs({...dateInputs, year: e.target.value})} placeholder="年" style={{ width: '80px', padding: '8px', boxSizing: 'border-box' }} />
          <span style={{ fontSize: '12px' }}>年</span>
          <input type="number" value={dateInputs.month} onChange={e => setDateInputs({...dateInputs, month: e.target.value})} placeholder="月" style={{ width: '60px', padding: '8px', boxSizing: 'border-box' }} min="1" max="12" />
          <span style={{ fontSize: '12px' }}>月</span>
          <input type="number" value={dateInputs.day} onChange={e => setDateInputs({...dateInputs, day: e.target.value})} placeholder="日" style={{ width: '60px', padding: '8px', boxSizing: 'border-box' }} min="1" max="31" />
          <span style={{ fontSize: '12px' }}>日</span>
        </div>

        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>説明文</label>
        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: '60px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>キャンセル</button>
          <button onClick={handleSave} style={{ background: '#000', color: '#fff', padding: '8px 15px', cursor: 'pointer', border: 'none' }}>保存</button>
        </div>
      </div>
    </div>
  );
}