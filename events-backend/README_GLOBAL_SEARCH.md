# Global Search API for Events

This document describes the enhanced global search functionality for the Events API.

## Overview

The global search feature provides comprehensive search capabilities across all event fields and related entities including:
- Event basic information (name, description, venue, location, country, price, currency, coordinates, times, type, settings)
- Speaker information (first name, last name, company, position)
- Category information (name, description, status)
- Exhibitor information (company name, description, email, mobile, UEN, both number)
- Promotional offers (title, description, company name, valid date)
- Event stamps (description, images)
- Event settings (table seating, lucky draw)
- Survey information (title)
- Gallery information (title)
- Document information (with names)

## API Endpoints

### 1. Enhanced GET /api/events
**Description**: Get all events with optional filtering including global search

**Query Parameters**:
- `globalSearch` (optional): Search term to search across all fields
- `keyword` (optional): Basic keyword search (used when globalSearch is not provided)
- `startDate` (optional): Filter events from this date
- `endDate` (optional): Filter events until this date
- `type` (optional): Filter by event type
- `category` (optional): Filter by category
- `location` (optional): Filter by location
- `price` (optional): Filter by price

**Example**:
```
GET /api/events?globalSearch=conference&type=virtual&upcoming=true
```

### 2. GET /api/events/search/global
**Description**: Dedicated global search endpoint with comprehensive filtering

**Required Parameters**:
- `globalSearch`: Search term to search across all fields

**Optional Parameters**:
- `startDate`: Filter events from this date
- `endDate`: Filter events until this date
- `type`: Filter by event type
- `category`: Filter by category
- `location`: Filter by location
- `country`: Filter by country
- `upcoming`: Filter upcoming events only
- `sortBy`: Sort field (name, startDate, endDate, price, createdAt, updatedAt)
- `sortOrder`: Sort order (ASC/DESC)

**Example**:
```
GET /api/events/search/global?globalSearch=tech&type=conference&upcoming=true&sortBy=startDate&sortOrder=ASC
```

### 3. GET /api/events/search/advanced
**Description**: Advanced search combining global search with multiple specific filters

**Parameters** (at least one required):
- `globalSearch` (optional): Global search across all fields
- `keyword` (optional): Basic keyword search
- `startDate` (optional): Filter events from this date
- `endDate` (optional): Filter events until this date
- `type` (optional): Filter by event type
- `category` (optional): Filter by category
- `location` (optional): Filter by location
- `country` (optional): Filter by country
- `speaker` (optional): Filter by speaker name
- `exhibitor` (optional): Filter by exhibitor name
- `upcoming` (optional): Filter upcoming events only
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `currency` (optional): Currency filter
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order

**Example**:
```
GET /api/events/search/advanced?globalSearch=AI&category=technology&minPrice=100&upcoming=true
```

## Search Behavior

### Global Search vs Keyword Search
- **Global Search**: Searches across ALL fields including related entities (speakers, exhibitors, categories, etc.)
- **Keyword Search**: Searches only basic event fields (name, description, venue, location, country)

### Priority
- When `globalSearch` is provided, it takes precedence over `keyword`
- Both can be used together in advanced search for more precise results

### Search Fields Covered
The global search covers the following fields:

#### Event Fields
- name
- description
- venue
- location
- country
- price
- currency
- latitude
- longitude
- startTime
- endTime
- type
- enableTableSeating
- enableLuckyDraw
- eventStampDescription
- exhibitorDescription
- documents (with names)
- eventStampImages

#### Speaker Fields
- firstName
- lastName
- companyName (from speakerProfile)
- position (from speakerProfile)

#### Category Fields
- name
- description
- status

#### Exhibitor Fields
- companyName
- companyDescription
- email
- mobile
- UEN
- bothNumber

#### Promotional Offer Fields
- title
- description
- companyName
- validDate

#### Survey Fields
- title

#### Gallery Fields
- title

## Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "message": "Search completed successfully",
  "events": [...],
  "metadata": {
    "total": 10,
    "searchTerm": "conference",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage Examples

### Basic Global Search
```
GET /api/events/search/global?globalSearch=conference
```

### Global Search with Date Filter
```
GET /api/events/search/global?globalSearch=tech&startDate=2024-01-01&endDate=2024-12-31
```

### Global Search with Type and Category
```
GET /api/events/search/global?globalSearch=AI&type=conference&category=technology
```

### Advanced Search with Multiple Filters
```
GET /api/events/search/advanced?globalSearch=conference&type=virtual&upcoming=true&minPrice=50&maxPrice=500
```

## Performance Notes

- Global search uses database-level LIKE queries for optimal performance
- All searches include proper indexing on searchable fields
- Results are paginated and sorted for better user experience
- Search is case-insensitive for better user experience

## Error Handling

- `globalSearch` parameter is required for dedicated global search endpoints
- At least one search parameter is required for advanced search
- Invalid search parameters return appropriate HTTP error codes
- Search errors are logged for debugging purposes
