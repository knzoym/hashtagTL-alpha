import { useState, useRef, useEffect, useCallback } from 'react';

export function usePanZoom({ 
  initialCenterX = 1950, initialZoom = 15, initialPanY = 0, initialLaneHeight = 160, 
  minLaneHeight = 60, focusedLaneId = null, containerHeight = 800 
}) {
  const containerRef = useRef(null);
  const stageXRef = useRef(null);
  const stageEventsXRef = useRef(null);
  const stageYRef = useRef(null);
  const bgRef = useRef(null);

  const [viewState, setViewState] = useState({ 
    centerX: initialCenterX, zoom: initialZoom, panY: initialPanY, laneHeight: initialLaneHeight,
    focusPanY: 0, focusLaneHeight: containerHeight || 800 
  });

  const isPanning = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPanY = useRef(initialPanY);
  const currentFocusPanY = useRef(0);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const isAltPressedRef = useRef(false);
  const zoomTimeout = useRef(null);

  useEffect(() => {
    currentPanY.current = viewState.panY;
    currentFocusPanY.current = viewState.focusPanY;
  }, [viewState.panY, viewState.focusPanY]);

  const focusedLaneIdRef = useRef(focusedLaneId);
  const containerHeightRef = useRef(containerHeight);

  useEffect(() => { 
    if (focusedLaneId && !focusedLaneIdRef.current) {
      setViewState(prev => ({ ...prev, focusPanY: 0, focusLaneHeight: containerHeightRef.current || 800 }));
    }
    focusedLaneIdRef.current = focusedLaneId; 
  }, [focusedLaneId]);
  
  useEffect(() => { containerHeightRef.current = containerHeight; }, [containerHeight]);

  const getPoint = useCallback((e) => {
    if (e.touches?.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseDown = useCallback((e, preventPan = false) => {
    if ((e.type.includes('mouse') && e.button !== 0) || preventPan || isAltPressedRef.current) return;
    isPanning.current = true;
    startPos.current = getPoint(e);
    dragOffset.current = { dx: 0, dy: 0 };
    
    // 操作開始時にアニメーションを殺す
    document.body.classList.add('is-panning');

    [stageXRef, stageEventsXRef, stageYRef, bgRef].forEach(ref => {
      if (ref?.current) ref.current.style.transition = 'none';
    });
  }, [getPoint]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const pos = getPoint(e);
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;
    dragOffset.current = { dx, dy };

    if (stageXRef.current) stageXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (stageEventsXRef.current) stageEventsXRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    
    const isFoc = focusedLaneIdRef.current;
    if (isFoc) {
      if (stageYRef.current) stageYRef.current.style.transform = `translate3d(0, ${currentFocusPanY.current + dy}px, 0)`;
      if (bgRef.current) bgRef.current.style.transform = 'translate3d(0, 0, 0)';
    } else {
      const newY = currentPanY.current + dy;
      if (stageYRef.current) stageYRef.current.style.transform = `translate3d(0, ${newY}px, 0)`;
      if (bgRef.current) bgRef.current.style.transform = `translate3d(0, ${newY}px, 0)`;
    }
  }, [getPoint]);

  const handleMouseUp = useCallback((e) => {
    if (!isPanning.current) return;
    isPanning.current = false;
    document.body.classList.remove('is-panning');

    const { dx, dy } = dragOffset.current;
    dragOffset.current = { dx: 0, dy: 0 };

    setViewState(prev => {
      const isFoc = focusedLaneIdRef.current;
      return {
        ...prev,
        centerX: prev.centerX - (dx / prev.zoom),
        panY: isFoc ? prev.panY : prev.panY + dy,
        focusPanY: isFoc ? prev.focusPanY + dy : prev.focusPanY
      };
    });
    
    [stageXRef, stageEventsXRef].forEach(ref => { if (ref?.current) ref.current.style.transform = 'translate3d(0,0,0)'; });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (!document.body.classList.contains('is-zooming')) document.body.classList.add('is-zooming');
      clearTimeout(zoomTimeout.current);
      zoomTimeout.current = setTimeout(() => document.body.classList.remove('is-zooming'), 150);

      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const rect = container.getBoundingClientRect();

      setViewState(prev => {
        if (e.ctrlKey || e.metaKey) {
          const isFoc = focusedLaneIdRef.current;
          if (isFoc) {
            const cursorY = e.clientY - rect.top;
            const cH = containerHeightRef.current || 800;
            const currentH = prev.focusLaneHeight || cH;
            const newH = Math.min(Math.max(currentH * factor, cH), cH * 10);
            const newFocusPanY = cursorY - (cursorY - prev.focusPanY) * (newH / currentH);
            return { ...prev, focusLaneHeight: newH, focusPanY: newFocusPanY };
          } else {
            return { ...prev, laneHeight: Math.min(Math.max(prev.laneHeight * factor, minLaneHeight), 600) };
          }
        } else {
          const cursorX = e.clientX - rect.left;
          const newZoom = Math.min(Math.max(prev.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.1), 3000);
          const w = rect.width || 1200;
          const yearAtCursor = (cursorX - w / 2) / prev.zoom + prev.centerX;
          const newCenterX = yearAtCursor - (cursorX - w / 2) / newZoom;
          return { ...prev, zoom: newZoom, centerX: newCenterX };
        }
      });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [minLaneHeight]);

  return { viewState, containerRef, stageXRef, stageEventsXRef, stageYRef, bgRef, handleMouseDown, handleMouseMove, handleMouseUp };
}