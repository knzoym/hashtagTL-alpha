import React, { useState } from 'react';

export default function MyPage({ files = [], events = [], onOpenFile, onOpenAll, onCreateFile, onRenameFile, onDeleteFile, onMergeFiles, onDuplicateFile }) {
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]
    );
  };

  const handleRename = (file) => {
    const newTitle = window.prompt("新しいファイル名を入力してください", file.title);
    if (newTitle && newTitle !== file.title) {
      onRenameFile(file.id, newTitle);
    }
  };

  const handleDelete = (file) => {
    if (window.confirm("このファイルを削除しますか？（中のイベントデータ自体は削除されません）")) {
      onDeleteFile(file.id);
    }
  };

  const handleMerge = () => {
    onMergeFiles(selectedFileIds);
    setSelectedFileIds([]); // 実行後にチェックボックスの選択を解除
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>マイページ</h1>
        
        {/* 右上のアクション領域に「すべてを表示」を追加 */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={onOpenAll} style={{ padding: '10px 20px', background: '#fff', color: '#000', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            すべての年表を表示
          </button>
          <button onClick={onCreateFile} style={{ padding: '10px 20px', background: '#000', color: '#fff', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            年表を追加
          </button>
        </div>
      </div>

      {selectedFileIds.length > 1 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{selectedFileIds.length}件の年表を選択中</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleMerge} 
              style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              統合
            </button>
            <span 
              title="選択した年表（レーン）とイベントデータをすべて複製し、一つにまとめた新しいファイルを作成します。"
              style={{ cursor: 'help', fontSize: '12px', background: '#ccc', color: '#333', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
            >
              ?
            </span>
          </div>
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
                年表（レーン）数: {file.timelines?.length || 0} / 
                イベント数: {events.filter(e => e.fileId === file.id).length}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => onOpenFile(file.id)} style={{ padding: '6px 12px', cursor: 'pointer' }}>開く</button>
              <button onClick={() => handleRename(file)} style={{ padding: '6px 12px', cursor: 'pointer' }}>名前変更</button>
              <button onClick={() => onDuplicateFile(file.id)} style={{ padding: '6px 12px', cursor: 'pointer' }}>複製</button>
              <button onClick={() => handleDeleteFile(file.id)} style={{ padding: '6px 12px', color: 'red', cursor: 'pointer' }}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}