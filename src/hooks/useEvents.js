import { useState } from 'react';
import { API_BASE_URL } from '../config';

export const useEvents = () => {
  const [events, setEvents] = useState([]);

  // イベント保存時に現在のファイルへ紐付ける処理も巻き取ります
  const saveEvent = async (eventData, currentFileId, files, updateFile) => {
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