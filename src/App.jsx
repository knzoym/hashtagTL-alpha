import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { useFiles } from './hooks/useFiles';
import { useEvents } from './hooks/useEvents';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';
import MyPage from './views/MyPage';

function App() {
  const { files, setFiles, createNewFile, updateFile, renameFile, deleteFile, mergeFiles, duplicateFile } = useFiles();
  const { events, setEvents, saveEvent, deleteEvent } = useEvents();

  const [activeTags, setActiveTags] = useState([]);
  const [searchTag, setSearchTag] = useState('');
  const [viewMode, setViewMode] = useState('mypage');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [visibleFileIds, setVisibleFileIds] = useState([]);
  const [cardSize, setCardSize] = useState('small');

  // 初回ロード時にファイルとイベントを両方取得
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/files`).then(res => res.json()),
      fetch(`${API_BASE_URL}/events`).then(res => res.json())
    ]).then(([filesData, eventsData]) => {
      setFiles(filesData || []);
      setEvents(eventsData || []);
      setVisibleFileIds((filesData || []).map(f => f.id));
    }).catch(err => console.error("データ取得エラー:", err));
  }, []);

  // 「すべてを表示」モード時に、選択中のファイルのタグを合成してレーンに反映
  useEffect(() => {
    if (currentFileId === null) {
      const mergedTags = new Set();
      visibleFileIds.forEach(fId => {
        const targetFile = files.find(f => f.id === fId);
        if (targetFile && targetFile.activeTags) {
          targetFile.activeTags.forEach(tag => mergedTags.add(tag));
        }
      });
      setActiveTags(Array.from(mergedTags));
    }
  }, [currentFileId, visibleFileIds, files]);

  const handleOpenFile = (fileId) => {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      setCurrentFileId(fileId);
      setActiveTags(targetFile.activeTags || []);
      setViewMode(prev => prev === 'mypage' ? 'timeline' : prev);
    }
  };

  const handleSaveEvent = (eventData) => {
    saveEvent(eventData, currentFileId, files, updateFile);
  };

  // 開いているファイルを取得
  const currentFile = files.find(f => f.id === currentFileId);
  
  const displayEvents = currentFileId 
    ? events.filter(e => (currentFile?.eventIds || []).includes(e.id))
    : events;

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
          <div style={{ position: 'absolute', top: '20px', left: '25px', right: '25px', zIndex: 2000, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              
              {/* ファイル選択プルダウン */}
              <select 
                value={currentFileId || '__ALL__'} 
                onChange={handleFileChange}
                style={{ fontSize: '20px', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', outline: 'none', backgroundColor: '#fff' }}
              >
                <option value="__ALL__">すべてのイベントを表示</option>
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
              {/* カードサイズ切り替え */}
              <select 
                value={cardSize} 
                onChange={(e) => setCardSize(e.target.value)}
                style={{ padding: '8px 10px', border: '2px solid #000', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <option value="small">サイズ: 小 (タイトルのみ)</option> {/* 新小 */}
                <option value="medium">サイズ: 中</option> {/* 旧小 (新中) */}
                <option value="large">サイズ: 大</option> {/* 現状維持 */}
              </select>
            </div>

            {/* 検索・タグ入力・フィルタ */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="タグで検索" 
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLane()}
                style={{ padding: '10px 18px', border: '2px solid #000', borderRadius: '30px', width: '100%', maxWidth: '240px', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}              />

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
          cardSize={cardSize}
          onSaveEvent={handleSaveEvent} 
          onDeleteEvent={deleteEvent}
          onRemoveLane={removeLane} 
        />
      )}
      {viewMode === 'table' &&(
        <TableTab
          events={displayEvents}
          onSaveEvent={handleSaveEvent}
          onDeleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}

export default App;