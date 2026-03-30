import React, { useState } from 'react';

// API実装までのダミーデータ
const DUMMY_FILES = [
  { id: 'f1', title: 'プライベート用', updatedAt: '2026-03-29', eventCount: 15 },
  { id: 'f2', title: '仕事用', updatedAt: '2026-03-30', eventCount: 42 },
  { id: 'f3', title: '旅行の記録', updatedAt: '2026-03-25', eventCount: 8 },
];

export default function MyPage({ onOpenFile }) {
  const [files, setFiles] = useState(DUMMY_FILES);
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>マイページ</h1>
        <button style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          新規ファイル作成
        </button>
      </div>

      {selectedFileIds.length > 1 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{selectedFileIds.length}件のファイルを選択中</span>
          <button style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            選択したファイルを統合して新規作成
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {files.map(file => (
          <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
            <input 
              type="checkbox" 
              checked={selectedFileIds.includes(file.id)} 
              onChange={() => toggleSelect(file.id)}
              style={{ marginRight: '20px', transform: 'scale(1.5)' }} 
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{file.title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                更新日: {file.updatedAt} | イベント数: {file.eventCount}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => onOpenFile(file.id)} style={{ padding: '6px 12px', cursor: 'pointer' }}>開く</button>
              <button style={{ padding: '6px 12px', cursor: 'pointer' }}>名前変更</button>
              <button style={{ padding: '6px 12px', cursor: 'pointer' }}>複製</button>
              <button style={{ padding: '6px 12px', color: 'red', cursor: 'pointer' }}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}