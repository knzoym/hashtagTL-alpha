export const LANE_HEIGHT = 160;
export const TOP_MARGIN = 150;

// rowIndex (0=上段, 1=下段) を受け取り、レーン内でのY座標を計算する
export const getEventTop = (event, activeTags, rowIndex = 0) => {
  const laneIndex = (event.tags && activeTags) 
    ? activeTags.findIndex(tag => event.tags.includes(tag)) 
    : -1;
    
  if (laneIndex === -1) {
    // INBOXの場合も段数に応じて下にずらす
    return 60 + (rowIndex * 85); 
  }
  
  // レーンのど真ん中のY座標
  const laneCenterY = TOP_MARGIN + (laneIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2);
  
  // 2段配置のオフセット (上段: 中心から-38px, 下段: 中心から+38px)
  // 3段目以降にあふれた場合はさらに外側へ
  const offsets = [-38, 38, -114, 114, -190, 190]; 
  const yOffset = offsets[rowIndex] !== undefined ? offsets[rowIndex] : 0;
  
  return laneCenterY + yOffset;
};