import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import EventModal from './EventModal';

export default function Header() {
  const { 
    viewMode, setViewMode, currentFileId, focusedLaneId, setFocusedLaneId,
    setCurrentFileId, files, events, cardSize, setCardSize,
    searchTags, setSearchTags, searchLogic, setSearchLogic,
    searchInput, setSearchInput, addLane, setVisibleFileIds
  } = useAppStore();

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];

  const handleFileChange = (e) => {
    const val = e.target.value;
    if (val === '__ALL__') {
      setCurrentFileId(null);
      setVisibleFileIds(files.map(f => f.id));
    } else {
      setCurrentFileId(val);
    }
    if (viewMode === 'mypage') setViewMode('timeline');
  };

  const handleAddTag = () => {
    const trimmed = searchInput.trim();
    if (trimmed && !searchTags.find(t => t.text === trimmed)) {
      setSearchTags([...searchTags, { text: trimmed, logic: searchLogic }]);
    }
    setSearchInput('');
  };

  const handleRemoveTag = (tagTextToRemove) => setSearchTags(searchTags.filter(t => t.text !== tagTextToRemove));

  const displayEvents = currentFileId ? events.filter(e => e.fileId === currentFileId) : events;
  const trimmedInput = searchInput.trim();
  const previewTags = [...searchTags];
  
  if (trimmedInput && !searchTags.find(t => t.text === trimmedInput)) {
    previewTags.push({ text: trimmedInput, logic: searchLogic });
  }

  const isSearching = previewTags.length > 0;
  let hitCount = 0;
  
  if (isSearching) {
    hitCount = displayEvents.filter(ev => {
      const evTags = [...(ev.tags || []), ev.title || ''];
      timelines.forEach(tl => {
         if (tl.includedEventIds?.includes(ev.id)) evTags.push(tl.title);
      });
      const checkTag = (searchStr) => evTags.some(t => t.toLowerCase().includes(searchStr.toLowerCase()));
      return searchLogic === 'AND' ? previewTags.every(tag => checkTag(tag.text)) : previewTags.some(tag => checkTag(tag.text));
    }).length;
  }

  return (
    <>
      <div style={{ position: 'absolute', top: '20px', left: '25px', right: '25px', zIndex: 2000, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <select 
            value={currentFileId || '__ALL__'} 
            onChange={handleFileChange}
            style={{ fontSize: '20px', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', outline: 'none', backgroundColor: '#fff' }}
          >
            <option value="__ALL__">すべてのイベントを表示</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>

          <div style={{ display: 'flex', background: '#eee', padding: '3px', borderRadius: '8px', border: '1px solid #000' }}>
            <button onClick={() => setViewMode('timeline')} style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'timeline' ? '#000' : 'transparent', color: viewMode === 'timeline' ? '#fff' : '#000' }}>年表</button>
            <button onClick={() => setViewMode('table')} style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'table' ? '#000' : 'transparent', color: viewMode === 'table' ? '#fff' : '#000' }}>テーブル</button>
          </div>
          
          <select value={cardSize} onChange={(e) => setCardSize(e.target.value)} style={{ padding: '8px 10px', border: '2px solid #000', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            <option value="small">サイズ: 小 (タイトルのみ)</option>
            <option value="medium">サイズ: 中</option>
            <option value="large">サイズ: 大</option>
          </select>

          <button 
            onClick={() => setIsCreatingEvent(true)}
            style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            ＋ イベントを新規作成
          </button>
        </div>

        {viewMode === 'table' && currentFileId && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', backgroundColor: 'rgba(255,255,255,0.8)', padding: '4px 8px', borderRadius: '4px' }}>表示する年表:</span>
            <select 
              value={focusedLaneId || ''} 
              onChange={(e) => setFocusedLaneId(e.target.value || null)}
              style={{ fontSize: '14px', padding: '6px 12px', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontWeight: 'bold', backgroundColor: '#fff' }}
            >
              <option value="">すべてのイベント (全表示)</option>
              {timelines.map(tl => (
                <option key={tl.id} value={tl.id}>{tl.title}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'timeline' && !focusedLaneId && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #000', borderRadius: '30px', padding: '4px 10px', gap: '5px' }}>
              <select 
                value={searchLogic} onChange={(e) => setSearchLogic(e.target.value)}
                style={{ fontSize: '12px', padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', outline: 'none' }}
              >
                <option value="OR">OR</option>
                <option value="AND">AND</option>
              </select>
              <div style={{ width: '1px', height: '14px', background: '#ccc' }} />
              <input 
                type="text" placeholder="タグを入力してEnter" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddTag(); } }}
                style={{ border: 'none', outline: 'none', fontSize: '14px', width: '150px' }}
              />
            </div>

            {searchTags.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '20px' }}>
                {searchTags.map((tag, i) => (
                  <span key={`${tag.text}-${i}`} style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => {
                        const newTags = [...searchTags];
                        newTags[i].logic = newTags[i].logic === 'OR' ? 'AND' : 'OR';
                        setSearchTags(newTags);
                      }}
                      style={{ border: 'none', background: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '10px', fontWeight: 'bold' }}
                    >
                      {tag.logic}
                    </button>
                    {tag.text}
                    <button onClick={() => handleRemoveTag(tag.text)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontSize: '12px', color: '#666', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isSearching && (
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: hitCount > 0 ? '#1a365d' : '#ff4444', marginLeft: '5px', marginRight: '5px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '4px 8px', borderRadius: '4px' }}>
                  ヒット: {hitCount}件
                </span>
              )}

              {trimmedInput && (
                <button onClick={handleAddTag} style={{ padding: '6px 12px', background: '#eee', color: '#000', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', border: '1px solid #ccc', fontSize: '12px' }}>
                  ＋ タグを追加
                </button>
              )}
              
              {isSearching && currentFileId && hitCount > 0 && (
                <button onClick={() => {
                  let targetTags = [...searchTags];
                  if (trimmedInput && !searchTags.find(t => t.text === trimmedInput)) {
                    targetTags.push({ text: trimmedInput, logic: searchLogic });
                  }
                  setTimeout(() => {
                    const defaultTitle = targetTags.map(t => (t.text || t)).join(' / ');
                    const title = window.prompt("年表のタイトルを入力してください", defaultTitle);
                    if (title) {
                      addLane(targetTags, title);
                      // ★ 作成完了後に検索状態をリセット
                      setSearchTags([]);
                      setSearchInput('');
                    }
                  }, 0);
                }} style={{ padding: '6px 12px', background: '#000', color: '#fff', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', border: 'none', fontSize: '12px' }}>
                  この条件で年表を作成
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isCreatingEvent && (
        <EventModal 
          event={{ title: '', date: '', tags: [] }} 
          onClose={() => setIsCreatingEvent(false)} 
        />
      )}
    </>
  );
}