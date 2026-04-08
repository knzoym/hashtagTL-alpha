import { dateToYearDecimal } from './timelineUtils';

export const TOP_MARGIN = 150;
const PADDING_Y = 4;
const X_GAP = 10;
const Y_GAP = 6;

export const CARD_CONFIG = {
  small: { width: 90, height: 26, padding: '3px', fontSize: '10px', border: '1px', noImage: true },
  medium: { width: 120, height: 75, imgHeight: '50px', padding: '4px', fontSize: '10px', border: '1px' },
  large: { width: 170, height: 130, imgHeight: '95px', padding: '8px', fontSize: '11px', border: '2px' }
};

export const isEventInTimeline = (event, timeline) => {
  if (timeline.includedEventIds?.includes(event.id)) return true;
  if (timeline.excludedEventIds?.includes(event.id)) return false;
  const condition = timeline.condition;
  if (!condition?.tags?.length) return false;
  const eventTags = event.tags || [];
  
  if (condition.logic === 'AND') {
    return condition.tags.every(tagObj => eventTags.includes(typeof tagObj === 'string' ? tagObj : tagObj.text));
  } else {
    return condition.tags.some(tagObj => eventTags.includes(typeof tagObj === 'string' ? tagObj : tagObj.text));
  }
};

const checkCollision = (testY, h, overlappingCards) => {
  return overlappingCards.find(c => (testY < c.y + c.h + Y_GAP) && (testY + h + Y_GAP > c.y));
};

const calculateInboxY = (h, overlappingCards) => {
  const startY = TOP_MARGIN - PADDING_Y - h;
  overlappingCards.sort((a, b) => b.y - a.y);
  let testY = startY;
  while (true) {
    const collider = checkCollision(testY, h, overlappingCards);
    if (!collider) break;
    testY = collider.y - h - Y_GAP;
  }
  return testY;
};

// フォーカス時は専用の領域（Y=0基準）で計算するよう引数を追加
const calculateLaneY = (h, laneId, timelines, laneHeight, overlappingCards, focusedLaneId) => {
  const isFocused = laneId === focusedLaneId;
  const laneIndex = timelines.findIndex(tl => tl.id === laneId);
  
  const areaTop = isFocused ? 0 : TOP_MARGIN + (laneIndex * laneHeight);
  const centerY = areaTop + laneHeight / 2;
  const minY = areaTop + PADDING_Y + (isFocused ? 120 : 0); // フォーカス時はヘッダー被り防止
  const maxY = areaTop + laneHeight - h - PADDING_Y;
  const steps = Math.ceil(laneHeight / (h + Y_GAP)); 

  for (let i = 0; i <= steps; i++) {
    let testY1 = centerY - h / 2 + i * (h + Y_GAP); 
    let testY2 = centerY - h / 2 - i * (h + Y_GAP); 

    if (testY1 >= minY && testY1 <= maxY && !checkCollision(testY1, h, overlappingCards)) return { y: testY1, centerY };
    if (i > 0 && testY2 >= minY && testY2 <= maxY && !checkCollision(testY2, h, overlappingCards)) return { y: testY2, centerY };
  }
  return { y: null, centerY };
};

const generateChips = (overflowQueue, timelines, laneHeight) => {
  // ...省略せずに既存のgenerateChipsの内容を保持...
  const overflowGroups = {};
  overflowQueue.forEach(({ x, laneId }) => {
    if (!overflowGroups[laneId]) overflowGroups[laneId] = [];
    let group = overflowGroups[laneId].find(g => Math.abs(g.x - x) < 22);
    if (group) { group.count++; group.x = (group.x + x) / 2; } 
    else { overflowGroups[laneId].push({ x, count: 1 }); }
  });

  const laneChips = {};
  const chipTrackEnds = {};

  timelines.forEach((tl, index) => {
    const laneId = tl.id;
    if (!overflowGroups[laneId]) return;
    const chipTop = TOP_MARGIN + (index * laneHeight) + laneHeight - 16;
    laneChips[laneId] = [];
    overflowGroups[laneId].sort((a, b) => a.x - b.x).forEach(group => {
      let xPos = group.x;
      const lastXEnd = chipTrackEnds[laneId] || -Infinity;
      if (xPos - 20 < lastXEnd + 4) xPos = lastXEnd + 4 + 20;
      laneChips[laneId].push({ ...group, x: xPos, top: chipTop });
      chipTrackEnds[laneId] = xPos + 20;
    });
  });
  return laneChips;
};

// 引数に focusedLaneId を追加
export const calculateLayouts = (events, timelines, cardSize, yearToXFunc, laneHeight, focusedLaneId = null) => {
  const layoutMap = {};
  const overflowQueue = [];
  const placedCards = {}; 

  const sortedEvents = [...events].sort((a, b) => dateToYearDecimal(a.date) - dateToYearDecimal(b.date));

  sortedEvents.forEach(event => {
    const x = yearToXFunc(dateToYearDecimal(event.date));
    if (isNaN(x)) return;

    const actualConfig = event.image ? (CARD_CONFIG[cardSize] || CARD_CONFIG.medium) : CARD_CONFIG.small;
    const { width: w, height: h } = actualConfig;

    const targetTimelineIds = timelines.filter(tl => isEventInTimeline(event, tl)).map(tl => tl.id);
    const targetLanes = targetTimelineIds.length > 0 ? targetTimelineIds : ['INBOX'];

    targetLanes.forEach(laneId => {
      if (focusedLaneId && laneId !== 'INBOX' && laneId !== focusedLaneId) return;

      if (!placedCards[laneId]) placedCards[laneId] = [];
      const xOverlapping = placedCards[laneId].filter(c => !(x + w / 2 + X_GAP <= c.x - c.w / 2 || x - w / 2 >= c.x + c.w / 2 + X_GAP));

      if (laneId === 'INBOX') {
        if (focusedLaneId) return; // フォーカス時は非表示
        const bestY = calculateInboxY(h, xOverlapping);
        placedCards[laneId].push({ x, y: bestY, w, h });
        layoutMap[`${event.id}-${laneId}`] = { top: bestY + h / 2, actualConfig, isOverflow: false };
      } else {
        const { y: bestY, centerY } = calculateLaneY(h, laneId, timelines, laneHeight, xOverlapping, focusedLaneId);
        if (bestY !== null) {
          placedCards[laneId].push({ x, y: bestY, w, h });
          layoutMap[`${event.id}-${laneId}`] = { top: bestY + h / 2, laneCenterY: centerY, actualConfig, isOverflow: false };
        } else {
          overflowQueue.push({ x, laneId, eventId: event.id });
          layoutMap[`${event.id}-${laneId}`] = { isOverflow: true };
        }
      }
    });
  });

  return { layoutMap, laneChips: generateChips(overflowQueue, timelines, laneHeight) };
};