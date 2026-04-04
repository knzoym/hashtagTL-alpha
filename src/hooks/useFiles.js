import { useState } from 'react';
import { API_BASE_URL } from '../config';

export const useFiles = () => {
  const [files, setFiles] = useState([]);

  const updateFile = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE_URL}/files/${id}`, {
        method: 'PATCH',
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

  const createNewFile = async () => {
    const newFile = {
      id: `f_${Date.now()}`,
      title: '無題の年表',
      updatedAt: new Date().toISOString().split('T')[0],
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

  return { files, setFiles, createNewFile, updateFile, renameFile, deleteFile, mergeFiles, duplicateFile };
};