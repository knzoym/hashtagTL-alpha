export const evaluateSearchMatch = (event, searchTags, searchLogic, searchInput) => {
  const trimmedInput = searchInput.trim().toLowerCase();
  const activeKeywords = [...searchTags];
  
  if (trimmedInput) {
    activeKeywords.push({ text: trimmedInput, logic: searchLogic });
  }

  if (activeKeywords.length === 0) {
    return { isSearchHighlighted: false, isDimmed: false };
  }

  let isHighlighted = false;
  const eventTags = event.tags || [];

  activeKeywords.forEach((kw, index) => {
    const text = kw.text.toLowerCase();
    const match = 
      eventTags.some(t => t.toLowerCase().includes(text)) || 
      event.title?.toLowerCase().includes(text) || 
      event.description?.toLowerCase().includes(text);

    if (index === 0) {
      isHighlighted = match;
    } else {
      isHighlighted = kw.logic === 'AND' ? (isHighlighted && match) : (isHighlighted || match);
    }
  });

  return { 
    isSearchHighlighted: isHighlighted, 
    isDimmed: !isHighlighted 
  };
};