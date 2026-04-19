import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isEventInTimeline } from '../utils/laneUtils';

const API_BASE_URL = '';

export default function EventModal({ event, isNew, onClose }) {
  const saveEvent = useAppStore(state => state.saveEvent);
  const deleteEvent = useAppStore(state => state.deleteEvent);
  const updateLane = useAppStore(state => state.updateLane);

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ★ ドラッグ移動のためのステートと参照
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const { files, currentFileId } = useAppStore();
  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); // ★ 削除確認用ステート復活

  // ★ ドラッグ開始の処理
  const handleDragMouseDown = (e) => {
    // ボタンをクリックした時はドラッグを開始しない
    if (e.target.tagName.toLowerCase() === 'button') return;
    
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
    document.body.style.userSelect = 'none'; // ドラッグ中のテキスト選択を防ぐ
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
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []); // 依存配列を空にして再登録を防ぐ（より滑らかに動くように）

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
    const cleanTag = newTag.trim().replace(/^#|^\[|\]$/g, '');
    if (cleanTag && !formData.tags.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSave = async () => {
    const y = dateInputs.year || '2000';
    const m = dateInputs.month ? String(dateInputs.month).padStart(2, '0') : '01';
    const d = dateInputs.day ? String(dateInputs.day).padStart(2, '0') : '01';
    const formattedDate = `${y}-${m}-${d}`;

    const hashTags = formData.description?.match(/#[^\s#\[\]]+/g)?.map(t => t.replace('#', '')) || [];
    const bracketTags = formData.description?.match(/\[(.*?)\]/g)?.map(t => t.slice(1, -1)) || [];
    const mergedTags = Array.from(new Set([...formData.tags, ...hashTags, ...bracketTags]));
    
    const eventIdToSave = formData.id || `ev_${Date.now()}`;
    
    await saveEvent({ ...formData, id: eventIdToSave, date: formattedDate, tags: mergedTags });

    if (event._targetLaneId) {
      const targetTimeline = timelines.find(t => t.id === event._targetLaneId);
      if (targetTimeline) {
        const newIncluded = Array.from(new Set([...(targetTimeline.includedEventIds || []), eventIdToSave]));
        const newExcluded = (targetTimeline.excludedEventIds || []).filter(id => String(id) !== String(eventIdToSave));
        updateLane(targetTimeline.id, { includedEventIds: newIncluded, excludedEventIds: newExcluded });
      }
    }

    onClose();
  };

  const handleDelete = async () => {
    await deleteEvent(event.id);
    onClose();
  };

  const handlePaste = (e) => {
    const file = e.clipboardData?.files[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      uploadImage(file);
    }
  };

  const handleDescriptionKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        const text = formData.description;
        const selected = text.substring(start, end);
        const newDesc = text.substring(0, start) + `[${selected}]` + text.substring(end);
        setFormData({ ...formData, description: newDesc });
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1, end + 1);
        }, 0);
      }
    }
  };

  const renderDescription = (text) => {
    if (!text) return <span style={{ color: '#999' }}>説明を入力...</span>;
    const parts = text.split(/(\[.*?\]|#[^\s#\[\]]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return <span key={i} style={{ color: '#3182ce', fontWeight: 'bold' }}>{part.slice(1, -1)}</span>;
      }
      if (part.startsWith('#')) {
        return <span key={i} style={{ color: '#3182ce' }}>{part}</span>;
      }
      return part;
    });
  };

  const fixedTags = [];
  if (event.title) fixedTags.push({ text: event.title, type: 'title' });
  timelines.forEach(tl => {
    if (isEventInTimeline(event, tl)) {
      fixedTags.push({ text: tl.title, type: 'timeline', tlColor: tl.color });
    }
  });

  if (event._targetLaneId && !fixedTags.some(t => t.text === timelines.find(tl => tl.id === event._targetLaneId)?.title)) {
    const targetTl = timelines.find(tl => tl.id === event._targetLaneId);
    if (targetTl) {
      fixedTags.push({ text: `${targetTl.title} (追加予定)`, type: 'timeline', tlColor: targetTl.color });
    }
  }

  return (
    <div 
      ref={modalRef}
      onPaste={handlePaste} 
      onMouseDown={(e) => e.stopPropagation()} 
      style={{ 
        position: 'fixed', top: '10%', left: '50%', // absoluteからfixedに変更し安定化
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`, 
        width: '90%', maxWidth: '400px', backgroundColor: 'white', 
        border: '2px solid #000', borderRadius: '8px', overflow: 'hidden',
        zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
        maxHeight: '85vh', display: 'flex', flexDirection: 'column'
      }}
    >
      {/* ★ モーダルのヘッダー（ドラッグ可能領域） */}
      <div 
        onMouseDown={handleDragMouseDown}
        style={{ 
          padding: '12px 20px', backgroundColor: '#000', color: '#fff', cursor: 'grab', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>EVENT EDITOR</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} // ★ クリックイベントが他に伝わらないようにする
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 5px' }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>画像（貼り付け可）</label>
        <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '150px', backgroundColor: '#f0f0f0', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', cursor: 'pointer', position: 'relative' }}>
          {formData.image ? <img src={`${API_BASE_URL}${formData.image}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" /> : <div style={{ color: '#999' }}>{isUploading ? '...' : '+ 画像'}</div>}
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => uploadImage(e.target.files[0])} style={{ display: 'none' }} />

        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>登録済みのタグ</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {fixedTags.map((tag, i) => (
            <span key={`fixed-${i}`} style={{ 
              background: tag.type === 'title' ? '#fff' : (tag.tlColor || '#e0e0e0'), 
              color: tag.type === 'title' ? '#000' : '#fff',
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
              border: tag.type === 'title' ? '2px solid #ccc' : '2px solid transparent'
            }}>
              {tag.type === 'timeline' && <span style={{ marginRight: '4px' }}>🗓</span>}
              {tag.text}
            </span>
          ))}
          {formData.tags.map(tag => (
            <span key={tag} style={{ background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '15px', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
              [{tag}] <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '5px', cursor: 'pointer', fontSize: '12px' }}>×</button>
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

        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>説明文 (選択＋Ctrl+Qでタグ化)</label>
        {isEditingDesc ? (
          <textarea 
            ref={textareaRef}
            autoFocus
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            onKeyDown={handleDescriptionKeyDown}
            onBlur={() => setIsEditingDesc(false)}
            style={{ width: '100%', height: '80px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '13px' }} 
          />
        ) : (
          <div 
            onClick={() => setIsEditingDesc(true)}
            style={{ 
              width: '100%', minHeight: '80px', marginBottom: '15px', padding: '8px', 
              boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px',
              cursor: 'text', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.5
            }}
          >
            {renderDescription(formData.description)}
          </div>
        )}
        
        {/* ★ 削除ボタンとキャンセル・保存ボタンを復活 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'center' }}>
          <div>
            {event.id && !isNew && (
              isConfirmingDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#ff4444', fontWeight: 'bold' }}>本当に削除しますか？</span>
                  <button onClick={handleDelete} style={{ padding: '6px 12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>はい</button>
                  <button onClick={() => setIsConfirmingDelete(false)} style={{ padding: '6px 12px', background: '#eee', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>やめる</button>
                </div>
              ) : (
                <button onClick={() => setIsConfirmingDelete(true)} style={{ padding: '8px 16px', background: '#fff', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>イベントを削除</button>
              )
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isConfirmingDelete && (
              <>
                <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>キャンセル</button>
                <button onClick={handleSave} style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
              </>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}