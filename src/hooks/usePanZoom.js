import { useState, useEffect, useCallback, useRef } from 'react';

export function usePanZoom({ minLaneHeight = 225, focusedLaneId, containerHeight }) {
  const containerRef = useRef(null);
  const stageXRef = useRef(null);
  const stageEventsXRef = useRef(null);
  const stageYRef = useRef(null);
  const bgRef = useRef(null);
  
  const zoomTimeout = useRef(null);

  const [viewState, setViewState] = useState({
    centerX: 2000,
    zoom: 100,
    panY: 0,
    laneHeight: minLaneHeight,
    focusPanY: 0,
    focusLaneHeight: containerHeight || 800
  });

  const updateViewState = useCallback((updates) => {
    setViewState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      // ホイール中はアニメーションを一時停止してガタつきを防ぐ
      document.body.classList.add('is-zooming');
      clearTimeout(zoomTimeout.current);
      zoomTimeout.current = setTimeout(() => {
        document.body.classList.remove('is-zooming');
      }, 150);

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      setViewState(prev => {
        const rect = container.getBoundingClientRect();
        const screenCenterY = rect.height / 2;
        const screenCenterX = rect.width / 2;

        if (e.ctrlKey) {
          // ■ Ctrl + Wheel: 縦ズーム（画面中央基準）
          if (focusedLaneId) {
            // 詳細モード: focusLaneHeight を拡縮
            const newFocusLaneHeight = Math.max(containerHeight * 0.1, prev.focusLaneHeight * zoomFactor);
            const logicalY = (screenCenterY - prev.focusPanY) / prev.focusLaneHeight;
            const newFocusPanY = screenCenterY - (logicalY * newFocusLaneHeight);
            return { ...prev, focusLaneHeight: newFocusLaneHeight, focusPanY: newFocusPanY };
          } else {
            // 俯瞰モード: 各レーンの高さを拡縮
            const newLaneHeight = Math.max(minLaneHeight * 0.5, prev.laneHeight * zoomFactor);
            const logicalY = (screenCenterY - prev.panY) / prev.laneHeight;
            const newPanY = screenCenterY - (logicalY * newLaneHeight);
            return { ...prev, laneHeight: newLaneHeight, panY: newPanY };
          }
        } else {
          // ■ Wheel alone: 横ズーム（画面中央基準）
          const newZoom = Math.max(1, prev.zoom * zoomFactor);
          // 画面中央の年代がズレないように centerX を調整
          return { ...prev, zoom: newZoom };
        }
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [focusedLaneId, containerHeight, minLaneHeight]);

  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e, isDraggingEvent) => {
    if (isDraggingEvent || e.button !== 0) return;
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    document.body.classList.add('is-panning');
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setViewState(prev => {
      if (focusedLaneId) {
        return { ...prev, centerX: prev.centerX - dx / prev.zoom, focusPanY: prev.focusPanY + dy };
      } else {
        return { ...prev, centerX: prev.centerX - dx / prev.zoom, panY: prev.panY + dy };
      }
    });
  }, [isPanning, focusedLaneId]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    document.body.classList.remove('is-panning');
    document.body.style.cursor = '';
  }, []);

  return {
    viewState, setViewState: updateViewState,
    containerRef, stageXRef, stageEventsXRef, stageYRef, bgRef,
    handleMouseDown, handleMouseMove, handleMouseUp
  };
}