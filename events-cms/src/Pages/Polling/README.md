# Polling Admin Panel Documentation

## Overview
The Polling Admin Panel is a comprehensive management system for creating, managing, and analyzing polls for events. It integrates seamlessly with the event management system and provides real-time voting analytics.

## Features

### 1. Poll Management
- **Create Polls**: Create interactive polls with 2-6 options
- **Edit Polls**: Update poll questions, options, and settings
- **Delete Polls**: Remove polls with confirmation
- **Live Toggle**: Enable/disable polls in real-time
- **Timer Configuration**: Set custom timer duration (10-300 seconds)

### 2. Event & Speaker Integration
- **Event Association**: Link polls to specific events
- **Speaker Association**: Optionally assign polls to speakers
- **Multi-Speaker Support**: Same poll can be answered for different speakers

### 3. Results & Analytics
- **Real-time Results**: View live voting statistics
- **Visual Analytics**: Progress bars and percentage displays
- **Voter Details**: See who voted for what option
- **Export Capabilities**: Download results for analysis

### 4. Filtering & Search
- **Event Filtering**: Filter polls by event
- **Speaker Filtering**: Filter by speaker
- **Search**: Search polls by question text
- **Multi-criteria**: Combine filters for precise results

## File Structure

```
src/Pages/Polling/
├── PollsView.jsx          # Main polls listing page
├── AddPollPage.jsx        # Create/Edit poll form
├── ViewPollPage.jsx       # Poll details and results
├── PollResultsPage.jsx    # Comprehensive analytics page
└── README.md              # This file

src/store/
├── actions/
│   └── pollingActions.jsx # Redux actions for polling
├── reducer/
│   └── pollingReducer.jsx # Redux reducer for polling state
└── constants/
    └── actionTypes.jsx    # Action type constants

src/utils/
└── constants.js           # Path constants (POLLING_PATHS)
```

## Usage Guide

### Creating a New Poll

1. Navigate to **Module > Polling** in the admin menu
2. Click **"Create New Poll"** button
3. Fill in the required fields:
   - **Event**: Select the event (required)
   - **Speaker**: Optionally select a speaker
   - **Question**: Enter the poll question (required)
   - **Timer**: Set timer in seconds (10-300, default: 30)
   - **Options**: Add 2-6 options (minimum 2 required)
4. Click **"Create Poll"** to save

### Editing a Poll

1. From the polls list, click the **Edit (pencil)** icon
2. Modify the desired fields
3. Click **"Update Poll"** to save changes

### Viewing Poll Details

1. Click the **View (eye)** icon from the polls list
2. View:
   - Poll question and options
   - Vote distribution with progress bars
   - Event and speaker information
   - Voter details table
3. Toggle live status or edit from this page

### Managing Live Status

- **From List View**: Use the toggle switch to enable/disable
- **From Detail View**: Click the "Live/Go Live" button
- **Live Polls**: Appear as "Live" with green badge
- **Offline Polls**: Appear as "Offline" with grey badge

### Viewing Analytics

1. Navigate to poll results page
2. Select a poll from dropdown
3. Filter by speaker if needed
4. View:
   - Summary cards (Total Polls, Votes, Voters, Speakers)
   - Vote distribution charts
   - Detailed voter information

## API Integration

### Endpoints Used

```javascript
// Get all polls (with filters)
GET /api/events/polls/questions/list?eventId={id}&speakerId={id}

// Get poll by ID
GET /api/events/polls/{pollId}

// Create poll
POST /api/events/polls
{
  "question": "string",
  "eventId": "string",
  "speakerId": "string",
  "timerSeconds": number,
  "options": [{ "optionText": "string" }]
}

// Update poll
PUT /api/events/polls/{pollId}

// Delete poll
DELETE /api/events/polls/{pollId}

// Toggle live status
PUT /api/events/polls/{pollId}/toggle-live

// Get poll results
GET /api/events/polls/votes/{eventId}
```

### Redux Actions

```javascript
import {
  getAllPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  togglePollLive,
  getPollResults,
  clearPollingError
} from '../../store/actions/pollingActions';
```

### Redux State

```javascript
const pollingState = {
  polls: [],              // Array of all polls
  pollById: null,         // Single poll details
  pollResults: null,      // Analytics data
  loading: false,         // Loading state
  error: null            // Error messages
};
```

## Component Props & State

### PollsView.jsx
- **State**: filters (eventId, speakerId, searchQuery), showDeleteModal, selectedPoll
- **Functions**: handleFilter, handleToggleLive, handleDeletePoll

### AddPollPage.jsx
- **Props**: `id` (from URL params for edit mode)
- **State**: formData, formErrors, submitting
- **Validation**: Question, Event, Timer (min 10s), Options (2-6)

### ViewPollPage.jsx
- **Props**: `id` (poll ID from URL)
- **State**: Managed by Redux
- **Features**: Live toggle, view voters, edit link

### PollResultsPage.jsx
- **Props**: `eventId` (from URL params)
- **State**: selectedPoll, selectedSpeaker
- **Features**: Poll selection, speaker filter, analytics

## Styling & UI

### Bootstrap Components Used
- Card, Table, Form, Button, Badge
- ProgressBar, Spinner, Alert, Modal
- Row, Col (Grid system)

### Icons (Feather Icons)
- `icon-bar-chart-2`: Polling/analytics
- `icon-plus`: Create new
- `icon-eye`: View details
- `icon-edit`: Edit poll
- `icon-trash-2`: Delete poll
- `icon-filter`: Apply filters
- `icon-check-circle`: Success/Live status

### Color Scheme
- **Primary**: Poll creation, view actions
- **Success**: Live status, high percentage
- **Info**: Vote counts, medium percentage
- **Warning**: Low percentage, speakers count
- **Danger**: Delete actions, error states
- **Secondary**: Back/cancel buttons

## Best Practices

### 1. Timer Settings
- **Quick Polls**: 10-20 seconds
- **Standard Polls**: 30-60 seconds
- **Complex Polls**: 60-120 seconds

### 2. Option Guidelines
- Keep option text concise (< 50 characters)
- Use 2-4 options for best UX
- Maximum 6 options allowed

### 3. Question Writing
- Be clear and specific
- Avoid double-barreled questions
- Use simple language
- Keep under 200 characters

### 4. Live Management
- Enable live status only when ready to receive votes
- Disable after voting period ends
- Monitor results in real-time

## Troubleshooting

### Common Issues

**1. Poll not appearing**
- Check if poll is set to "Live"
- Verify event association
- Check timer hasn't expired

**2. Results not updating**
- Refresh the results page
- Check network connection
- Verify API endpoint availability

**3. Cannot delete poll**
- Ensure no active voting sessions
- Check admin permissions
- Try disabling live status first

**4. Filters not working**
- Clear filters and reapply
- Check if data exists for filter criteria
- Refresh the page

## Future Enhancements

1. **Export Features**
   - PDF export of results
   - CSV download of voter data
   - Graphical charts export

2. **Advanced Analytics**
   - Time-based voting patterns
   - Demographic analysis
   - Comparison across events

3. **Poll Templates**
   - Save common poll formats
   - Quick poll creation
   - Bulk import/export

4. **Real-time Updates**
   - WebSocket integration
   - Live vote count updates
   - Instant notifications

## Support

For issues or questions:
- Check this documentation
- Review API documentation
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

