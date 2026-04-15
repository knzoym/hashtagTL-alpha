import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TOP_MARGIN } from '../utils/laneUtils';

export function useDragAndDrop(containerRef, viewState, timelines, laneRowMap, laneRanges) {
  const { focusedLaneId, updateLane } = useAppStore(); // ★ updateLaneを直接取得
  
  const [draggingData, setDraggingData] = useState(null); 
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState(null); 

  const handleDragStart = useCallback((e, eventObj, sourceLaneId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingData({ 
      eventId: eventObj.id, 
      sourceLaneId: sourceLaneId || 'INBOX', 
      event: eventObj,
      offsetX,
      offsetY,
      actualConfig: { width: rect.width, height: rect.height }
    });
    setDragPos({ x: e.clientX, y: e.clientY });
    setDropTarget(null);

    document.body.classList.add('is-dragging');
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!draggingData) return;
    setDragPos({ x: e.clientX, y: e.clientY });

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const yInContainer = e.clientY - rect.top;
    const xInContainer = e.clientX - rect.left;

    let targetLaneId = 'INBOX';
    let actionText = '未分類に戻す';

    if (focusedLaneId) {
      if (yInContainer > 150) { 
        targetLaneId = focusedLaneId;
        actionText = draggingData.sourceLaneId === targetLaneId ? '移動なし（元の場所）' : 'この年表に追加';
      } else {
        targetLaneId = 'INBOX';
        actionText = draggingData.sourceLaneId === 'INBOX' ? '移動なし（元の場所）' : '未分類に戻す';
      }
    } else {
      const canvasY = yInContainer - viewState.panY;
      const yearToX = (y) => (y - viewState.centerX) * viewState.zoom + rect.width / 2;
      
      let hoveredTl = null;
      
      for (const tl of timelines) {
        const rowIndex = laneRowMap?.[tl.id] ?? timelines.indexOf(tl);
        const laneTop = TOP_MARGIN + rowIndex * viewState.laneHeight;
        const laneBottom = laneTop + viewState.laneHeight;
        
        const range = laneRanges?.[tl.id];
        const startX = range ? yearToX(range.minYear) - 180 : -Infinity;
        const endX = range ? yearToX(range.maxYear) + 120 : Infinity;

        if (canvasY >= laneTop && canvasY <= laneBottom && xInContainer >= startX && xInContainer <= endX) {
          hoveredTl = tl;
          break;
        }
      }

      if (hoveredTl) {
        targetLaneId = hoveredTl.id;
        if (draggingData.sourceLaneId === 'INBOX') {
          actionText = `「${hoveredTl.title}」に追加`;
        } else if (draggingData.sourceLaneId === targetLaneId) {
          actionText = '移動なし（元の場所）';
        } else {
          actionText = `「${hoveredTl.title}」へ移動`;
        }
      } else {
        targetLaneId = 'INBOX';
        actionText = draggingData.sourceLaneId === 'INBOX' ? '移動なし（元の場所）' : '未分類に戻す';
      }
    }

    setDropTarget(targetLaneId ? { laneId: targetLaneId, actionText } : null);
  }, [draggingData, containerRef, viewState.panY, viewState.laneHeight, viewState.centerX, viewState.zoom, timelines, laneRowMap, laneRanges, focusedLaneId]);

  const handleDragEnd = useCallback(() => {
    if (!draggingData) return;
    
    if (dropTarget && dropTarget.laneId && dropTarget.laneId !== draggingData.sourceLaneId) {
      const { eventId, sourceLaneId } = draggingData;
      const targetId = dropTarget.laneId;

      // ★ 元の年表から削除された場合、確実に「除外リスト」に追加する
      if (sourceLaneId !== 'INBOX') {
        const sourceTimeline = timelines.find(t => t.id === sourceLaneId);
        if (sourceTimeline) {
          const newIncluded = (sourceTimeline.includedEventIds || []).filter(id => String(id) !== String(eventId));
          const newExcluded = Array.from(new Set([...(sourceTimeline.excludedEventIds || []), eventId]));
          updateLane(sourceLaneId, { includedEventIds: newIncluded, excludedEventIds: newExcluded });
        }
      }

      // ★ 新しい年表に追加された場合、ピン留めしつつ「除外リスト」から外す
      if (targetId !== 'INBOX') {
        const targetTimeline = timelines.find(t => t.id === targetId);
        if (targetTimeline) {
          const newIncluded = Array.from(new Set([...(targetTimeline.includedEventIds || []), eventId]));
          const newExcluded = (targetTimeline.excludedEventIds || []).filter(id => String(id) !== String(eventId));
          updateLane(targetId, { includedEventIds: newIncluded, excludedEventIds: newExcluded });
        }
      }
    }

    setDraggingData(null);
    setDropTarget(null);
    document.body.classList.remove('is-dragging');
  }, [draggingData, dropTarget, timelines, updateLane]);

  return { draggingData, dragPos, dropTarget, handleDragStart, handleDragMove, handleDragEnd };
}