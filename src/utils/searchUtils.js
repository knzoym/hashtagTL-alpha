export const evaluateSearchMatch = (event, searchTags, searchLogic, searchInput) => {
  const previewTags = [...searchTags];
  const trimmedInput = (searchInput || '').trim();
  
  if (trimmedInput && !previewTags.find(t => t.text === trimmedInput)) {
    previewTags.push({ text: trimmedInput, logic: searchLogic });
  }
  
  if (previewTags.length === 0) return { isSearchHighlighted: false, isDimmed: false };

  const evTags = event.tags || [];
  const checkTag = (searchStr) => {
    const lowerSearch = searchStr.toLowerCase();
    return evTags.some(t => t.toLowerCase().includes(lowerSearch));
  };

  let isMatch = false;
  if (searchLogic === 'AND') {
    isMatch = previewTags.every(tag => checkTag(tag.text));
  } else {
    isMatch = previewTags.some(tag => checkTag(tag.text));
  }

  return { isSearchHighlighted: isMatch, isDimmed: !isMatch };
};