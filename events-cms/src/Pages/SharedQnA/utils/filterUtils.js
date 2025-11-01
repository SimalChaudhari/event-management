/**
 * Filter Utilities
 * 
 * Reusable filter functions for Q&A questions
 */

/**
 * Apply filters to questions list
 * Shows filtered questions first, then remaining questions
 * 
 * @param {Array} allQuestions - All questions to filter
 * @param {string|null} voteFilter - Vote filter: 'desc' (high to low), 'asc' (low to high), null (unsorted)
 * @param {string|null} statusFilter - Status filter: 'answering', 'answered', 'not_answered', null (all)
 * @returns {Array} - Filtered and sorted questions array
 */
export const applyFiltersToQuestions = (allQuestions, voteFilter, statusFilter) => {
  let filtered = [...allQuestions];
  let remaining = [];

  // Apply status filter
  if (statusFilter) {
    const statusFiltered = filtered.filter(q => q.status === statusFilter);
    const statusRemaining = filtered.filter(q => q.status !== statusFilter);
    filtered = statusFiltered;
    remaining = statusRemaining;
  }

  // Apply vote sorting
  const sortByVotes = (questions) => {
    if (voteFilter === 'desc') {
      // Descending: high to low (2, 1, 0)
      return [...questions].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else if (voteFilter === 'asc') {
      // Ascending: low to high (0, 1, 2)
      return [...questions].sort((a, b) => (a.likesCount || 0) - (b.likesCount || 0));
    }
    return questions;
  };

  // Combine filtered first, then remaining
  return [...sortByVotes(filtered), ...sortByVotes(remaining)];
};

