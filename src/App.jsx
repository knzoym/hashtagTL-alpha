import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { useFiles } from './hooks/useFiles';
import { useEvents } from './hooks/useEvents';
import { useLaneManager } from './hooks/useLaneManager'; // 追加
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';
import MyPage from './views/MyPage';
import Header from './components/Header';

function App() {
  const { files, setFiles, createNewFile, updateFile, renameFile, deleteFile, duplicateFile } = useFiles();
  const { events, setEvents, saveEvent, deleteEvent } = useEvents();

  const [searchTags, setSearchTags] = useState([]);
  const [searchLogic, setSearchLogic] = useState('OR');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState('mypage');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [visibleFileIds, setVisibleFileIds] = useState([]);
  const [cardSize, setCardSize] = useState('small');

  const loadData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/files`).then(res => res.json()),
      fetch(`${API_BASE_URL}/events`).then(res => res.json())
    ]).then(([filesData, eventsData]) => {
      setFiles(filesData || []);
      setEvents(eventsData || []);
      setVisibleFileIds((filesData || []).map(f => f.id));
    }).catch(err => console.error("データ取得エラー:", err));
  };

  useEffect(() => {
    loadData();
  }, []);

  // ロジックをフックから取得
  const { addLane, updateLane, deleteLane, handleMergeFiles, handleMoveEvent, handleRestoreEvent } = useLaneManager(files, events, currentFileId, updateFile, loadData);

  const handleOpenFile = (fileId) => {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      setCurrentFileId(fileId);
      setViewMode(prev => prev === 'mypage' ? 'timeline' : prev);
    }
  };

  const handleSaveEvent = (eventData) => {
    saveEvent(eventData, updateFile);
  };

  const currentFile = files.find(f => f.id === currentFileId);
  
  const displayEvents = currentFileId 
    ? events.filter(e => e.fileId === currentFileId)
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

  const handleAddTimeline = async (tags, title) => {
    const success = await addLane(tags, title);
    if (success) {
      setSearchTags([]);
      setSearchInput('');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {viewMode !== 'mypage' && (
        <Header 
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentFileId={currentFileId}
          files={files}
          handleFileChange={handleFileChange}
          cardSize={cardSize}
          setCardSize={setCardSize}
          searchTags={searchTags}
          setSearchTags={setSearchTags}
          searchLogic={searchLogic}
          setSearchLogic={setSearchLogic}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          addLane={handleAddTimeline} // ラッパー関数を渡す
          visibleFileIds={visibleFileIds}
          setVisibleFileIds={setVisibleFileIds}
          handleMergeFiles={handleMergeFiles}
        />
      )}

      {viewMode === 'mypage' && (
        <MyPage 
          files={files} 
          events={events}
          onOpenFile={handleOpenFile} 
          onOpenAll={handleOpenAll} 
          onCreateFile={createNewFile} 
          onRenameFile={renameFile} 
          onDeleteFile={deleteFile} 
          onMergeFiles={handleMergeFiles} 
          onDuplicateFile={duplicateFile}
        />
      )}
      {viewMode === 'timeline' && (
        <TimelineTab
          currentFileId={currentFileId}
          events={displayEvents} 
          timelines={currentFile?.timelines || []}
          searchTags={searchTags}
          searchLogic={searchLogic}
          searchInput={searchInput}
          cardSize={cardSize}
          onUpdateLane={updateLane}
          onDeleteLane={deleteLane}
          onSaveEvent={handleSaveEvent} 
          onDeleteEvent={deleteEvent}
          onMoveEvent={handleMoveEvent}
          onRestoreEvent={handleRestoreEvent}
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