# Event Name Filter - Reusable Implementation

## Overview
The event name filter has been implemented as a reusable hook (`useEventFilter`) that can be easily applied to any event listing page. It provides exact event name filtering through a dropdown interface.

## Implementation

### 1. Reusable Hook: `useEventFilter`
Location: `src/hooks/useEventFilter.js`

```javascript
import useEventFilter from '../hooks/useEventFilter';

// Usage in component
const {
    selectedEventId,
    allEvents,
    loadingDropdowns,
    activeFilters,
    applyFilters,
    clearFilters,
    handleEventChange
} = useEventFilter(eventAction, initialFilters);
```

**Parameters:**
- `eventAction`: The Redux action to call for loading events (e.g., `eventList`, `upcomingEventList`)
- `initialFilters`: Object with initial filter values (optional)

**Returns:**
- `selectedEventId`: Currently selected event ID
- `allEvents`: Array of all events for dropdown
- `loadingDropdowns`: Boolean indicating if dropdown data is loading
- `activeFilters`: Object with currently active filters
- `applyFilters`: Function to apply filters
- `clearFilters`: Function to clear all filters
- `handleEventChange`: Function to handle event selection change

### 2. Filter Component Integration
Location: `src/components/common/FilterComponent.jsx`

```jsx
<FilterComponent
    events={allEvents}
    loadingDropdowns={loadingDropdowns}
    selectedEventId={selectedEventId}
    onEventChange={handleEventChange}
    onApplyFilters={applyFilters}
    onClearFilters={clearFilters}
    activeFilters={activeFilters}
    showUserFilter={false}
    showEventFilter={true}
/>
```

## Current Implementations

### 1. All Events Page
Location: `src/Pages/Events/all-events/EventView.jsx`

```javascript
// Uses eventList action for all events
const {
    selectedEventId,
    allEvents,
    loadingDropdowns,
    activeFilters,
    applyFilters,
    clearFilters,
    handleEventChange
} = useEventFilter(eventList);
```

### 2. Upcoming Events Page
Location: `src/Pages/Events/upcoming-events/UpcomingEvents.jsx`

```javascript
// Uses upcomingEventList action with upcoming filter
const {
    selectedEventId,
    allEvents,
    loadingDropdowns,
    activeFilters,
    applyFilters,
    clearFilters,
    handleEventChange
} = useEventFilter(upcomingEventList, { upcoming: true });
```

## Backend API Support

### Event Actions Updated
Both `eventList` and `upcomingEventList` actions now support filters:

```javascript
// All events with filter
dispatch(eventList({ eventName: 'Conference 2024' }));

// Upcoming events with filter
dispatch(upcomingEventList({ eventName: 'Conference 2024' }));
```

### API Endpoints
```
GET /api/events                                    // All events
GET /api/events?eventName=Conference%202024        // Filtered by exact name
GET /api/events?upcoming=true                      // Upcoming events only
GET /api/events?upcoming=true&eventName=Summit     // Upcoming events filtered by name
```

## How It Works

### 1. Filter Application Process
1. User selects event from dropdown
2. `handleEventChange` updates selected event ID
3. User clicks "Apply" button
4. `applyFilters` finds selected event by ID and gets exact name
5. Filter object is built with exact event name
6. Appropriate action is dispatched with filters
7. Backend performs exact name matching
8. UI updates with filtered results

### 2. Backend Filtering
```sql
-- Exact name matching
WHERE event.name = 'Conference 2024'
```

### 3. Clear Filters
1. User clicks "Clear" button
2. `clearFilters` resets all filter state
3. Appropriate action is dispatched without filters
4. UI shows all events (or all upcoming events)

## Usage in New Pages

To add the filter to a new event listing page:

```javascript
import useEventFilter from '../hooks/useEventFilter';
import FilterComponent from '../components/common/FilterComponent';

const MyEventPage = () => {
    const {
        selectedEventId,
        allEvents,
        loadingDropdowns,
        activeFilters,
        applyFilters,
        clearFilters,
        handleEventChange
    } = useEventFilter(myEventAction, { myFilter: 'value' });

    return (
        <>
            <FilterComponent
                events={allEvents}
                loadingDropdowns={loadingDropdowns}
                selectedEventId={selectedEventId}
                onEventChange={handleEventChange}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
            />
            {/* Your event listing content */}
        </>
    );
};
```

## Features

### ✅ Implemented Features
- **Exact Name Matching**: Filter by exact event name (case-sensitive)
- **Dropdown Interface**: User-friendly event selection
- **Loading States**: Shows loading during data fetch
- **Active Filter Display**: Visual feedback for applied filters
- **Clear Functionality**: Easy filter removal
- **Reusable Hook**: Can be applied to any event listing page
- **Error Handling**: Graceful handling of API errors
- **Responsive Design**: Works on all screen sizes

### 🎯 Filter Behavior
- **Exact Matching**: Only shows events with the exact selected name
- **Case Sensitive**: "Conference 2024" ≠ "conference 2024"
- **Combinable**: Can be combined with other filters (upcoming, keyword, etc.)
- **Persistent State**: Maintains filter state during component lifecycle

### 📱 UI Features
- **Filter Badge**: Shows number of active filters
- **Clear Button**: Only appears when filters are active
- **Loading Indicators**: Shows loading state during operations
- **Dropdown Styling**: Consistent with application design
- **Error Feedback**: Toast notifications for errors

## Testing

Both pages now have the filter functionality:
1. Navigate to "All Events" page - filter shows all events
2. Navigate to "Upcoming Events" page - filter shows only upcoming events
3. Select an event from dropdown and click "Apply"
4. Verify only events with that exact name are shown
5. Click "Clear" to remove filter and show all events again

## Future Enhancements

Potential improvements:
- **Multiple Event Selection**: Allow filtering by multiple events
- **Partial Name Matching**: Option for contains/starts with filtering
- **Date Range Integration**: Combine with date range filters
- **Export Functionality**: Export filtered results
- **Saved Filters**: Save and recall filter combinations
