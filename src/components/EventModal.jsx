import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export default function EventModal({ event, onSave, onCancel }) {
  const fileInputRef = useRef(null);
  const modalRef = useRef(null); // モーダル全体への参照
  const [formData, setFormData] = useState({ 
    ...event,
    url: event.url || '',
    image: event.image || ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // --- 画像アップロードの共通処理 ---
  const uploadImage = async (file) => {
    // 画像ファイル以外は弾く
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();
      // アップロードされた画像のパス（/images/xxx.jpg）をセット
      setFormData(prev => ({ ...prev, image: result.imagePath }));
    } catch (err) {
      console.error("アップロードエラー:", err);
      alert('画像のアップロードに失敗しました。サーバーが起動しているか確認してください。');
    } finally {
      setIsUploading(false);
    }
  };

  // --- ファイル選択時のハンドラ ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file);
    }
    // 同じファイルを連続で選べるようにリセット
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ペースト（Ctrl+V）時のハンドラ ---
  useEffect(() => {
    const handlePaste = (e) => {
      // 入力フィールド（タイトルや説明）でペーストした時は、画像の貼り付け処理を行わない
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        // ペーストされたデータがファイル（画像）の場合
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            // クリップボード上の画像データを共通処理に渡す
            uploadImage(file);
            e.preventDefault(); // ブラウザ標準のペースト動作を止める
            break; // 最初の1枚だけ処理
          }
        }
      }
    };

    // モーダルが表示されている間、ドキュメント全体でペーストイベントを監視
    document.addEventListener('paste', handlePaste);
    return () => {
      // モーダルが閉じる時に監視を解除
      document.removeEventListener('paste', handlePaste);
    };
  }, []); // 最初のレンダリング時のみ実行

  const handleSave = () => {
    const tags = formData.description?.match(/#[^\s#]+/g)?.map(t => t.replace('#', '')) || [];
    onSave({ ...formData, tags: Array.from(new Set(tags)) });
  };

  return (
    <div 
      ref={modalRef}
      style={{
        position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
        width: '360px', padding: '20px', backgroundColor: 'white',
        border: '2px solid #000', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        maxHeight: '85vh', overflowY: 'auto', outline: 'none' // ペーストイベント用
      }}
      tabIndex={-1} // ペーストイベントを受け取れるようにする
    >
      <h3 style={{ marginTop: 0 }}>イベント編集</h3>

      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>画像（PCから選択、またはCtrl+Vで貼り付け）</label>
      <div 
        onClick={() => fileInputRef.current.click()}
        style={{ 
          width: '100%', height: '180px', backgroundColor: '#f0f0f0', 
          marginBottom: '15px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', border: '1px dashed #ccc', cursor: 'pointer',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {formData.image ? (
          <>
            <img src={`${API_BASE_URL}${formData.image}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="preview" />
            <button 
              onClick={(e) => { e.stopPropagation(); setFormData({...formData, image: ''}); }}
              style={{ position: 'absolute', top: 5, right: 5, background: '#fff', border: '1px solid #000', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' }}
            >削除</button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '10px' }}>
            {isUploading ? 'アップロード中...' : '+ 画像を選択\n(またはここに画像を貼り付け)'}
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />

      <label style={{ fontSize: '11px' }}>日付</label>
      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
      
      <label style={{ fontSize: '11px' }}>タイトル</label>
      <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />

      <label style={{ fontSize: '11px' }}>詳細URL</label>
      <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
      
      <label style={{ fontSize: '11px' }}>説明（#タグで自動登録）</label>
      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', height: '80px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box' }} />
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 15px', cursor: 'pointer' }}>キャンセル</button>
        <button onClick={handleSave} style={{ padding: '8px 15px', cursor: 'pointer', background: '#000', color: '#fff' }}>保存</button>
      </div>
    </div>
  );
}