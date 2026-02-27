/**
 * Calculate estimated reading time for content
 * @param {string} content - The article content or summary
 * @param {number} wordsPerMinute - Average reading speed (default: 200)
 * @returns {number} Estimated reading time in minutes
 */
function calculateReadingTime(content, wordsPerMinute = 200) {
  if (!content || typeof content !== 'string') {
    return 1;
  }

  // Clean the content and count words
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  if (!cleanContent) {
    return 1;
  }

  const words = cleanContent.split(/\s+/).length;
  
  // Calculate reading time, minimum 1 minute
  const readingTime = Math.max(1, Math.ceil(words / wordsPerMinute));
  
  return readingTime;
}

/**
 * Calculate word count for content
 * @param {string} content - The article content
 * @returns {number} Word count
 */
function calculateWordCount(content) {
  if (!content || typeof content !== 'string') {
    return 0;
  }

  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  if (!cleanContent) {
    return 0;
  }

  return cleanContent.split(/\s+/).length;
}

module.exports = {
  calculateReadingTime,
  calculateWordCount
};
