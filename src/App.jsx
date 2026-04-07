import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';
import MyPage from './views/MyPage';
import Header from './components/Header';

function App() {
  const loadData = useAppStore(state => state.loadData);
  const viewMode = useAppStore(state => state.viewMode);
  const currentFileId = useAppStore(state => state.currentFileId);
  const setViewMode = useAppStore(state => state.setViewMode);
  const setCurrentFileId = useAppStore(state => state.setCurrentFileId);
  const setVisibleFileIds = useAppStore(state => state.setVisibleFileIds);
  const files = useAppStore(state => state.files);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenFile = (fileId) => {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      setCurrentFileId(fileId);
      setViewMode(viewMode === 'mypage' ? 'timeline' : viewMode);
    }
  };

  const handleOpenAll = () => {
    setCurrentFileId(null);
    setVisibleFileIds(files.map(f => f.id));
    setViewMode(viewMode === 'mypage' ? 'timeline' : viewMode);
  };

  const handleFileChange = (e) => {
    const val = e.target.value;
    if (val === '__ALL__') handleOpenAll();
    else handleOpenFile(val);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {viewMode !== 'mypage' && (
        <Header />
      )}

      {viewMode === 'mypage' && (
        <MyPage 
          onOpenFile={handleOpenFile} 
          onOpenAll={handleOpenAll} 
        />
      )}
      
      {viewMode === 'timeline' && <TimelineTab />}
      {viewMode === 'table' && <TableTab />}
      
    </div>
  );
}

export default App;