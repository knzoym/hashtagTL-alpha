export const LANE_HEIGHT = 160;
export const TOP_MARGIN = 150;

export const getEventTop = (event, activeTags) => {
  const laneIndex = (event.tags && activeTags) 
    ? activeTags.findIndex(tag => event.tags.includes(tag)) 
    : -1;
  if (laneIndex === -1) return 60;
  return TOP_MARGIN + (laneIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2);
};