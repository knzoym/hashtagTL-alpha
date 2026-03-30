import { useState, useEffect } from 'react';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';
import MyPage from './views/MyPage';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [files, setFiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [searchTag, setSearchTag] = useState('');
  
  const [viewMode, setViewMode] = useState('mypage');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [visibleFileIds, setVisibleFileIds] = useState([]);

  // 初回ロード時にファイルとイベントを両方取得
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/files`).then(res => res.json()),
      fetch(`${API_BASE_URL}/events`).then(res => res.json())
    ]).then(([filesData, eventsData]) => {
      setFiles(filesData || []);
      setEvents(eventsData || []);
      // 初期状態では全ファイルを可視に設定
      setVisibleFileIds(filesData.map(f => f.id));
    }).catch(err => console.error("データ取得エラー:", err));
  }, []);

  const handleOpenFile = (fileId) => {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      setCurrentFileId(fileId);
      setActiveTags(targetFile.activeTags || []);
      setViewMode(prev => prev === 'mypage' ? 'timeline' : prev);
    }
  };

  const createNewFile = async () => {
    const newFile = {
      id: `f_${Date.now()}`,
      title: '無題の年表',
      updatedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
      eventIds: [],
      activeTags: []
    };

    try {
      const res = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });
      if (res.ok) {
        const savedFile = await res.json();
        setFiles(prev => [...prev, savedFile]);
      }
    } catch (err) {
      console.error("ファイル作成エラー:", err);
    }
  };

// 👇 ここから追加: 共通のファイル更新関数
  const updateFile = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH', // 部分更新にはPATCHを使用
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedFile = await res.json();
        setFiles(prev => prev.map(f => f.id === id ? updatedFile : f));
        return updatedFile;
      }
    } catch (err) {
      console.error("ファイル更新エラー:", err);
    }
  };
  // 👆 ここまで追加

  // 以下、共通関数(updateFile)を使ってスッキリさせた各処理
  const renameFile = async (fileId, newTitle) => {
    await updateFile(fileId, { title: newTitle });
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm("このファイルを削除しますか？（中のイベントデータ自体は削除されません）")) return;
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, { method: 'DELETE' });
    if (res.ok) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const mergeFiles = async (selectedFileIds) => {
    if (selectedFileIds.length < 2) return;

    const targetEventIds = new Set();
    const mergedTags = new Set();
    selectedFileIds.forEach(fId => {
      const f = files.find(file => file.id === fId);
      if (f) {
        (f.eventIds || []).forEach(id => targetEventIds.add(id));
        (f.activeTags || []).forEach(tag => mergedTags.add(tag));
      }
    });

    try {
      const newFile = {
        id: `f_${Date.now()}`,
        title: '統合されたファイル',
        updatedAt: new Date().toISOString().split('T')[0],
        eventIds: Array.from(targetEventIds),
        activeTags: Array.from(mergedTags)
      };
      const res = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });
      if (res.ok) {
        const savedFile = await res.json();
        setFiles(prev => [...prev, savedFile]);
        alert('ファイルを統合しました。');
      }
    } catch (err) {
      console.error("統合エラー:", err);
      alert('統合中にエラーが発生しました。');
    }
  };

  const duplicateFile = async (fileId) => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile) return;

    try {
      const newFile = {
        ...targetFile,
        id: `f_${Date.now()}`,
        title: `${targetFile.title} のコピー`,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      const res = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });
      if (res.ok) {
        const savedFile = await res.json();
        setFiles(prev => [...prev, savedFile]);
      }
    } catch (err) {
      console.error("複製エラー:", err);
      alert('複製中にエラーが発生しました。');
    }
  };

  // 開いているファイルを取得
  const currentFile = files.find(f => f.id === currentFileId);
  
  const displayEvents = (() => {
    if (currentFileId) {
      return events.filter(e => (currentFile?.eventIds || []).includes(e.id));
    } else {
      const allVisibleEventIds = new Set();
      files.forEach(f => {
        if (visibleFileIds.includes(f.id)) {
          f.eventIds?.forEach(id => allVisibleEventIds.add(id));
        }
      });
      return events.filter(e => allVisibleEventIds.has(e.id));
    }
  })();

  const handleFileChange = (e) => {
    const val = e.target.value;
    if (val === '__ALL__') {
      handleOpenAll();
    } else {
      handleOpenFile(val);
    }
  };

  const handleOpenAll = () => {
    setCurrentFileId(null);
    setVisibleFileIds(files.map(f => f.id));
    setViewMode(prev => prev === 'mypage' ? 'timeline' : prev);
  };

  const saveEvent = async (eventData) => {
    const isExisting = events.some(e => e.id === eventData.id);

    try {
      if (isExisting) {
        const res = await fetch(`${API_BASE_URL}/events/${eventData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        if (res.ok) {
          const updated = await res.json();
          setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        if (res.ok) {
          const saved = await res.json();
          setEvents(prev => [...prev, saved]);

          if (currentFileId && currentFileId !== '__ALL__') {
            const currentFile = files.find(f => f.id === currentFileId);
            if (currentFile && !currentFile.eventIds.includes(saved.id)) {
              const updatedEventIds = [...currentFile.eventIds, saved.id];
              await updateFile(currentFileId, { eventIds: updatedEventIds });
            }
          }
        }
      }
    } catch (err) {
      console.error("保存エラー:", err);
      alert('保存に失敗しました。');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("このイベントを完全に削除しますか？")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // 全体のイベントリストから削除
        setEvents(prev => prev.filter(e => e.id !== eventId));
        alert("イベントを削除しました。");
      }
    } catch (err) {
      console.error("削除エラー:", err);
    }
  };

  const addLane = async () => {
    const tag = searchTag.trim().replace('#', '');
    if (tag && !activeTags.includes(tag)) {
      const newActiveTags = [...activeTags, tag];
      setActiveTags(newActiveTags);
      setSearchTag('');
      setViewMode('timeline');

      if (currentFileId) {
        await updateFile(currentFileId, { activeTags: newActiveTags });
      }
    }
  };

  const removeLane = async (tagToRemove) => {
    const newActiveTags = activeTags.filter(t => t !== tagToRemove);
    setActiveTags(newActiveTags);

    if (currentFileId) {
      await updateFile(currentFileId, { activeTags: newActiveTags });
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {viewMode !== 'mypage' && (
        <>
          {/* 左上: コンテキスト（ファイル選択）とビュー切り替え */}
          <div style={{ position: 'absolute', top: '20px', left: '25px', zIndex: 2000, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {/* ファイル選択プルダウン */}
              <select 
                value={currentFileId || '__ALL__'} 
                onChange={handleFileChange}
                style={{ fontSize: '20px', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', outline: 'none', backgroundColor: '#fff' }}
              >
                <option value="__ALL__">すべての年表を表示</option>
                {files.map(f => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>

              {/* ビュー切り替えタブ */}
              <div style={{ display: 'flex', background: '#eee', padding: '3px', borderRadius: '8px', border: '1px solid #000' }}>
                <button 
                  onClick={() => setViewMode('timeline')}
                  style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'timeline' ? '#000' : 'transparent', color: viewMode === 'timeline' ? '#fff' : '#000' }}
                >年表</button>
                <button 
                  onClick={() => setViewMode('table')}
                  style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'table' ? '#000' : 'transparent', color: viewMode === 'table' ? '#fff' : '#000' }}
                >テーブル</button>
              </div>
            </div>

            {/* 検索・タグ入力・フィルタ */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="タグで検索" 
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLane()}
                style={{ padding: '10px 18px', border: '2px solid #000', borderRadius: '30px', width: '240px', outline: 'none', fontSize: '14px' }}
              />

              {searchTag && (
                <button 
                  onClick={addLane} 
                  style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}
                >
                  レーンを追加
                </button>
              )}
              
              {!currentFileId && (
                <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '20px', border: '1px solid #ccc' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>表示対象:</span>
                  {files.map(f => (
                    <label key={f.id} style={{ fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <input 
                        type="checkbox" 
                        checked={visibleFileIds.includes(f.id)} 
                        onChange={() => setVisibleFileIds(prev => prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id])} 
                      />
                      {f.title}
                    </label>
                  ))}
                  {visibleFileIds.length >= 2 && (
                    <>
                      <div style={{ width: '1px', height: '14px', background: '#ccc', margin: '0 5px' }} />
                      <button 
                        onClick={() => mergeFiles(visibleFileIds)}
                        style={{ padding: '4px 8px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        統合
                      </button>
                      <span 
                        title="選択した年表のレーンが統合されます。イベントデータ自体は複製されません。"
                        style={{ cursor: 'help', fontSize: '11px', background: '#ddd', color: '#555', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                      >
                        ?
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右上: マイページへのナビゲーション */}
          <div style={{ position: 'absolute', top: '20px', right: '25px', zIndex: 2000, pointerEvents: 'auto' }}>
            <button 
              onClick={() => setViewMode('mypage')}
              style={{ padding: '8px 20px', background: '#fff', color: '#000', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >マイページ</button>
          </div>
        </>
      )}

      {/* マイページ呼び出し時に onOpenAll も渡す */}
      {viewMode === 'mypage' && (
        <MyPage 
          files={files} 
          onOpenFile={handleOpenFile} 
          onOpenAll={handleOpenAll} 
          onCreateFile={createNewFile} 
          onRenameFile={renameFile} 
          onDeleteFile={deleteFile} 
          onMergeFiles={mergeFiles}
          onDuplicateFile={duplicateFile}
        />
      )}
      {viewMode === 'timeline' && (
        <TimelineTab
          events={displayEvents} 
          activeTags={activeTags} 
          searchTag={searchTag} 
          onSaveEvent={saveEvent} 
          onDeleteEvent={deleteEvent}
          onRemoveLane={removeLane} 
        />
      )}
      {viewMode === 'table' &&(
        <TableTab
          events={displayEvents}
          onSaveEvent={saveEvent}
          onDeleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}

export default App;