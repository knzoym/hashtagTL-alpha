import { useState } from 'react';
import { API_BASE_URL } from '../config';

export const useEvents = () => {
  const [events, setEvents] = useState([]);

  const saveEvent = async (eventData, currentFileId) => {
    // 既存イベントかどうかの判定
    const isExisting = events.some(e => e.id === eventData.id);

    // 新規かつfileIdがない場合は、現在開いているファイルIDを付与
    const dataToSave = {
      ...eventData,
      fileId: eventData.fileId || currentFileId 
    };

    try {
      if (isExisting) {
        const res = await fetch(`${API_BASE_URL}/events/${dataToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        if (res.ok) {
          const updated = await res.json();
          setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        if (res.ok) {
          const saved = await res.json();
          setEvents(prev => [...prev, saved]);
          // ※ファイル側の eventIds 更新処理は不要になったため削除
        }
      }
    } catch (err) {
      console.error("保存エラー:", err);
      alert('保存に失敗しました。');
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (err) {
      console.error("削除エラー:", err);
    }
  };

  return { events, setEvents, saveEvent, deleteEvent };
};