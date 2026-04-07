import { create } from 'zustand';
import { api } from '../api';

const generateChicColor = () => `hsl(${Math.floor(Math.random() * 360)}, 35%, 45%)`;

export const useAppStore = create((set, get) => ({
  files: [],
  events: [],
  viewMode: 'mypage',
  currentFileId: null,
  visibleFileIds: [],
  searchTags: [],
  searchLogic: 'OR',
  searchInput: '',
  cardSize: 'small',

  // UI状態の更新
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentFileId: (id) => set({ currentFileId: id }),
  setVisibleFileIds: (ids) => set({ visibleFileIds: ids }),
  setSearchTags: (tags) => set({ searchTags: tags }),
  setSearchLogic: (logic) => set({ searchLogic: logic }),
  setSearchInput: (input) => set({ searchInput: input }),
  setCardSize: (size) => set({ cardSize: size }),

  // データロード
  loadData: async () => {
    try {
      const [files, events] = await Promise.all([api.fetchFiles(), api.fetchEvents()]);
      set({ files: files || [], events: events || [], visibleFileIds: (files || []).map(f => f.id) });
    } catch (err) { console.error("ロードエラー:", err); }
  },

  // ファイル操作
  createNewFile: async () => {
    const newFile = { id: `f_${Date.now()}`, title: '無題のファイル', updatedAt: new Date().toISOString().split('T')[0], timelines: [] };
    const saved = await api.createFile(newFile);
    set(state => ({ files: [...state.files, saved] }));
  },
  renameFile: async (id, title) => {
    const updated = await api.updateFile(id, { title });
    set(state => ({ files: state.files.map(f => f.id === id ? updated : f) }));
  },
  deleteFile: async (id) => {
    await api.deleteFile(id);
    set(state => ({ files: state.files.filter(f => f.id !== id) }));
  },
  duplicateFile: async (id) => {
    const target = get().files.find(f => f.id === id);
    if (!target) return;
    const newFile = { ...target, id: `f_${Date.now()}`, title: `${target.title} のコピー`, updatedAt: new Date().toISOString().split('T')[0] };
    const saved = await api.createFile(newFile);
    set(state => ({ files: [...state.files, saved] }));
  },

  // イベント操作
  saveEvent: async (eventData) => {
    const { events, currentFileId } = get();
    const isExisting = events.some(e => e.id === eventData.id);
    const dataToSave = { ...eventData, fileId: eventData.fileId || currentFileId };
    
    const saved = isExisting ? await api.updateEvent(dataToSave.id, dataToSave) : await api.createEvent(dataToSave);
    set(state => ({
      events: isExisting ? state.events.map(e => e.id === saved.id ? saved : e) : [...state.events, saved]
    }));
  },
  deleteEvent: async (id) => {
    await api.deleteEvent(id);
    set(state => ({ events: state.events.filter(e => e.id !== id) }));
  },

  // レーン操作 (useLaneManagerの移植)
  addLane: async (tags, title) => {
    const { files, currentFileId } = get();
    if (!tags?.length || !currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    if (!currentFile) return false;

    const newTimeline = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title, condition: { tags }, includedEventIds: [], excludedEventIds: [], color: generateChicColor()
    };
    
    const timelines = [...(currentFile.timelines || []), newTimeline];
    const updated = await api.updateFile(currentFileId, { timelines });
    set(state => ({ files: state.files.map(f => f.id === currentFileId ? updated : f) }));
    return true;
  },
  updateLane: async (laneId, updatedData) => {
    const { files, currentFileId } = get();
    if (!currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    const timelines = currentFile.timelines.map(tl => tl.id === laneId ? { ...tl, ...updatedData } : tl);
    const updated = await api.updateFile(currentFileId, { timelines });
    set(state => ({ files: state.files.map(f => f.id === currentFileId ? updated : f) }));
  },
  deleteLane: async (laneId) => {
    const { files, currentFileId } = get();
    if (!currentFileId) return false;
    const currentFile = files.find(f => f.id === currentFileId);
    const timelines = currentFile.timelines.filter(tl => tl.id !== laneId);
    const updated = await api.updateFile(currentFileId, { timelines });
    set(state => ({ files: state.files.map(f => f.id === currentFileId ? updated : f) }));
  },
  handleMoveEvent: async (eventId, sourceLaneId, targetLaneId) => {
    const { files, events, currentFileId } = get();
    if (!currentFileId || sourceLaneId === targetLaneId) return;
    const currentFile = files.find(f => f.id === currentFileId);
    const event = events.find(e => e.id === eventId);
    if (!currentFile || !event) return;

    const eventTags = event.tags || [];
    let timelines = JSON.parse(JSON.stringify(currentFile.timelines));

    const matchesCondition = (tl) => {
      if (!tl.condition?.tags?.length) return false;
      return tl.condition.logic === 'AND' 
        ? tl.condition.tags.every(tag => eventTags.includes(tag.text || tag))
        : tl.condition.tags.some(tag => eventTags.includes(tag.text || tag));
    };

    if (sourceLaneId !== 'INBOX') {
      const sourceTl = timelines.find(tl => tl.id === sourceLaneId);
      if (sourceTl) {
        sourceTl.includedEventIds = sourceTl.includedEventIds.filter(id => id !== eventId);
        if (matchesCondition(sourceTl) && !sourceTl.excludedEventIds.includes(eventId)) {
          sourceTl.excludedEventIds.push(eventId);
        }
      }
    }
    if (targetLaneId !== 'INBOX') {
      const targetTl = timelines.find(tl => tl.id === targetLaneId);
      if (targetTl) {
        targetTl.excludedEventIds = targetTl.excludedEventIds.filter(id => id !== eventId);
        if (!matchesCondition(targetTl) && !targetTl.includedEventIds.includes(eventId)) {
          targetTl.includedEventIds.push(eventId);
        }
      }
    }
    const updated = await api.updateFile(currentFileId, { timelines });
    set(state => ({ files: state.files.map(f => f.id === currentFileId ? updated : f) }));
  },
  handleRestoreEvent: async (eventId, laneId) => {
    const { files, currentFileId } = get();
    if (!currentFileId) return;
    const currentFile = files.find(f => f.id === currentFileId);
    let timelines = JSON.parse(JSON.stringify(currentFile.timelines));
    const targetTl = timelines.find(tl => tl.id === laneId);
    
    if (targetTl) {
      targetTl.excludedEventIds = targetTl.excludedEventIds.filter(id => id !== eventId);
      const updated = await api.updateFile(currentFileId, { timelines });
      set(state => ({ files: state.files.map(f => f.id === currentFileId ? updated : f) }));
    }
  },
  handleMergeFiles: async (selectedFileIds) => {
    const { files, events, loadData } = get();
    const targetFiles = files.filter(f => selectedFileIds.includes(f.id));
    if (targetFiles.length < 2) return;

    const newTitle = window.prompt("統合後の新しいファイル名を入力してください", targetFiles.map(f => f.title).join(' + '));
    if (!newTitle) return;

    const newFile = await api.createFile({ title: newTitle, timelines: [], updatedAt: new Date().toISOString() });
    let mergedTimelines = [];
    const eventIdMap = {};

    for (const file of targetFiles) {
      const targetEvents = events.filter(e => e.fileId === file.id);
      for (const ev of targetEvents) {
        const { id, ...eventData } = ev;
        eventData.fileId = newFile.id;
        const newEvent = await api.createEvent(eventData);
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
    await api.updateFile(newFile.id, { timelines: mergedTimelines });
    await loadData();
  }
}));