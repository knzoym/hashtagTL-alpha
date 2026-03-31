import { useState } from 'react';
import { TOP_MARGIN } from '../utils/laneUtils';

export function useDragAndDrop(containerRef, events, activeTags, onSaveEvent, panY, laneHeight) {
  const [draggingData, setDraggingData] = useState({ eventId: null, fromTag: null });

  const handleDragStart = (eventId, fromTag) => {
    setDraggingData({ eventId, fromTag });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggingData.eventId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top - panY;

    const relativeY = y - TOP_MARGIN;
    const laneIndex = Math.floor(relativeY / laneHeight);
    
    const targetEvent = events.find(ev => ev.id === draggingData.eventId);
    if (!targetEvent) return;

    let newTags = [...(targetEvent.tags || [])];

    if (relativeY < 0) {
      // INBOXへのドロップ: ドラッグ元のタグのみ削除
      if (draggingData.fromTag) {
        newTags = newTags.filter(t => t !== draggingData.fromTag);
      }
    } else if (laneIndex >= 0 && laneIndex < activeTags.length) {
      // 特定レーンへのドロップ
      const newTag = activeTags[laneIndex];
      
      if (draggingData.fromTag) {
        if (e.altKey) {
          // Alt + ドロップ: 元のタグを残し、移動先のタグを追加
          if (!newTags.includes(newTag)) newTags.push(newTag);
        } else {
          // 通常のドロップ: 元のタグを外し、移動先のタグを追加
          newTags = newTags.filter(t => t !== draggingData.fromTag);
          if (!newTags.includes(newTag)) newTags.push(newTag);
        }
      } else {
        // INBOXからの移動: 移動先のタグを追加
        if (!newTags.includes(newTag)) newTags.push(newTag);
      }
    }

    onSaveEvent({ ...targetEvent, tags: newTags });
    setDraggingData({ eventId: null, fromTag: null });
  };

  return { draggingData, handleDragStart, handleDrop };
}