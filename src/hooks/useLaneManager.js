import { API_BASE_URL } from '../config';

export function useLaneManager(files, events, currentFileId, updateFile, loadData) {
  
  const generateChicColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 35%, 45%)`;
  };

  const addLane = async (tags, title) => {
    if (!tags || tags.length === 0 || !currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return false;

    const newTimeline = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      condition: { tags: tags },
      includedEventIds: [],
      excludedEventIds: [],
      color: generateChicColor() // ★カラーを追加
    };

    const newTimelines = [...(currentFile.timelines || []), newTimeline];
    await updateFile(currentFileId, { timelines: newTimelines });
    return true; 
  };

  // 年表の更新
  const updateLane = async (laneId, updatedData) => {
    if (!currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return false;

    const newTimelines = currentFile.timelines.map(tl => 
      tl.id === laneId ? { ...tl, ...updatedData } : tl
    );

    await updateFile(currentFileId, { timelines: newTimelines });
    return true;
  };

  // 年表の削除
  const deleteLane = async (laneId) => {
    if (!currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return false;

    const newTimelines = currentFile.timelines.filter(tl => tl.id !== laneId);

    await updateFile(currentFileId, { timelines: newTimelines });
    return true;
  };

  const handleMergeFiles = async (selectedFileIds) => {
    const targetFiles = files.filter(f => selectedFileIds.includes(f.id));
    if (targetFiles.length < 2) return;

    const newTitle = window.prompt("統合後の新しいファイル名を入力してください", targetFiles.map(f => f.title).join(' + '));
    if (!newTitle) return;

    try {
      const fileRes = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, timelines: [], updatedAt: new Date().toISOString() })
      });
      const newFile = await fileRes.json();
      
      let mergedTimelines = [];
      const eventIdMap = {};

      for (const file of targetFiles) {
        const targetEvents = events.filter(e => e.fileId === file.id);
        for (const ev of targetEvents) {
          const { id, ...eventData } = ev;
          eventData.fileId = newFile.id;
          
          const evRes = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
          });
          const newEvent = await evRes.json();
          eventIdMap[id] = newEvent.id;
        }

        if (file.timelines) {
          const updatedTimelines = file.timelines.map(tl => ({
            ...tl,
            id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            includedEventIds: tl.includedEventIds.map(oldId => eventIdMap[oldId]).filter(Boolean),
            excludedEventIds: tl.excludedEventIds.map(oldId => eventIdMap[oldId]).filter(Boolean)
          }));
          mergedTimelines = [...mergedTimelines, ...updatedTimelines];
        }
      }

      await updateFile(newFile.id, { timelines: mergedTimelines });
      loadData();
    } catch (err) {
      console.error("統合エラー:", err);
      alert("ファイルの統合中にエラーが発生しました。");
    }
  };

  const handleMoveEvent = async (eventId, sourceLaneId, targetLaneId) => {
    if (!currentFileId || sourceLaneId === targetLaneId) return;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return;

    const event = events.find(e => e.id === eventId);
    const eventTags = event?.tags || [];
    let newTimelines = JSON.parse(JSON.stringify(currentFile.timelines));

    const matchesCondition = (tl) => {
      if (!tl.condition || !tl.condition.tags || tl.condition.tags.length === 0) return false;
      if (tl.condition.logic === 'AND') {
        return tl.condition.tags.every(tag => eventTags.includes(tag));
      } else {
        return tl.condition.tags.some(tag => eventTags.includes(tag));
      }
    };

    if (sourceLaneId !== 'INBOX') {
      const sourceTl = newTimelines.find(tl => tl.id === sourceLaneId);
      if (sourceTl) {
        sourceTl.includedEventIds = sourceTl.includedEventIds.filter(id => id !== eventId);
        if (matchesCondition(sourceTl)) {
          if (!sourceTl.excludedEventIds.includes(eventId)) {
            sourceTl.excludedEventIds.push(eventId);
          }
        }
      }
    }

    if (targetLaneId !== 'INBOX') {
      const targetTl = newTimelines.find(tl => tl.id === targetLaneId);
      if (targetTl) {
        targetTl.excludedEventIds = targetTl.excludedEventIds.filter(id => id !== eventId);
        if (!matchesCondition(targetTl)) {
          if (!targetTl.includedEventIds.includes(eventId)) {
            targetTl.includedEventIds.push(eventId);
          }
        }
      }
    }

    await updateFile(currentFileId, { timelines: newTimelines });
  };

  const handleRestoreEvent = async (eventId, laneId) => {
    if (!currentFileId) return;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return;

    let newTimelines = JSON.parse(JSON.stringify(currentFile.timelines));
    const targetTl = newTimelines.find(tl => tl.id === laneId);
    
    if (targetTl) {
      targetTl.excludedEventIds = targetTl.excludedEventIds.filter(id => id !== eventId);
      await updateFile(currentFileId, { timelines: newTimelines });
    }
  };

  return { 
    addLane, 
    updateLane,
    deleteLane,
    handleMergeFiles, 
    handleMoveEvent, 
    handleRestoreEvent 
  };
}