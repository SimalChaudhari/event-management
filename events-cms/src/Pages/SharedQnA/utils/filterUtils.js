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
 * @param {string|null} statusFilter - Status filter: 'answered', 'approved', 'not_answered', null (all)
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

  const isAscending = voteFilter === 'asc';

  const sortQuestions = (questions) => {
    return [...questions].sort((a, b) => {
      const aPinned = !!a.isPinned;
      const bPinned = !!b.isPinned;

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      const aVotes = a.likesCount || 0;
      const bVotes = b.likesCount || 0;

      if (aVotes !== bVotes) {
        return isAscending ? aVotes - bVotes : bVotes - aVotes;
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (aCreated !== bCreated) {
        return isAscending ? aCreated - bCreated : bCreated - aCreated;
      }

      return 0;
    });
  };

  return [...sortQuestions(filtered), ...sortQuestions(remaining)];
};

