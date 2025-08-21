# Event Search API Documentation

This document describes the comprehensive search functionality available for events in the system.

## Overview

The system provides multiple search endpoints for different use cases:
1. **Simple Search** - Basic keyword-based search
2. **Global Search** - Advanced search with multiple filters
3. **Quick Search** - Fast search for immediate results
4. **Event Controller Search** - Search integrated with event endpoints

## Base URL

All search endpoints are prefixed with `/api/`

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 1. Simple Search Endpoint

### Endpoint: `GET /api/search/events`

Basic keyword-based search for events.

#### Query Parameters:
- `q` (required): Search query string (2-500 characters)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20, max: 100)

#### Example Request:
```bash
GET /api/search/events?q=conference&page=1&limit=10
```

#### Example Response:
```json
{
  "success": true,
  "message": "Events search completed successfully",
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Tech Conference 2024",
        "description": "Annual technology conference",
        "startDate": "2024-06-15T00:00:00.000Z",
        "endDate": "2024-06-17T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "18:00",
        "location": "San Francisco",
        "venue": "Convention Center",
        "country": "USA",
        "type": "conference",
        "price": 299,
        "currency": "USD",
        "images": ["path/to/image1.jpg"],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false,
    "query": "conference"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## 2. Global Search Endpoint

### Endpoint: `GET /api/search/global`

Advanced search with comprehensive filtering options.

#### Query Parameters:

##### Search Filters:
- `keyword` (optional): General search term
- `location` (optional): Event location
- `venue` (optional): Event venue
- `country` (optional): Event country
- `type` (optional): Event type (conference, workshop, seminar, etc.)
- `category` (optional): Event category name

##### Date Filters:
- `startDate` (optional): Start date (YYYY-MM-DD format)
- `endDate` (optional): End date (YYYY-MM-DD format)
- `include` (optional): Date filter type
  - `upcoming`: Only future events
  - `ongoing`: Currently running events
  - `past`: Past events
  - `all`: All events (default)

##### Price Filters:
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `currency` (optional): Currency code

##### Pagination & Sorting:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sortBy` (optional): Sort field
  - `name`: Event name
  - `startDate`: Start date (default)
  - `endDate`: End date
  - `price`: Price
  - `createdAt`: Creation date
- `sortOrder` (optional): Sort direction
  - `ASC`: Ascending (default)
  - `DESC`: Descending

#### Example Request:
```bash
GET /api/search/global?keyword=tech&location=San Francisco&type=conference&startDate=2024-06-01&minPrice=100&maxPrice=500&sortBy=startDate&sortOrder=ASC&page=1&limit=20
```

#### Example Response:
```json
{
  "success": true,
  "message": "Global search completed successfully",
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Tech Conference 2024",
        "description": "Annual technology conference",
        "startDate": "2024-06-15T00:00:00.000Z",
        "endDate": "2024-06-17T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "18:00",
        "location": "San Francisco",
        "venue": "Convention Center",
        "country": "USA",
        "type": "conference",
        "price": 299,
        "currency": "USD",
        "images": ["path/to/image1.jpg"],
        "color": "#3B82F6",
        "speakersData": [
          {
            "id": "speaker-uuid",
            "name": "John Doe",
            "email": "john@example.com",
            "profilePicture": "path/to/profile.jpg"
          }
        ],
        "categoriesData": [
          {
            "id": "category-uuid",
            "name": "Technology"
          }
        ],
        "exhibitorsData": {
          "exhibitorDescription": "Leading tech companies",
          "exhibitors": []
        },
        "attendanceCount": 150,
        "hasSurvey": false,
        "isFavorite": false,
        "isRegistered": false,
        "searchFields": ["name", "description", "location"],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false,
    "filters": {
      "keyword": "tech",
      "location": "San Francisco",
      "type": "conference",
      "startDate": "2024-06-01",
      "minPrice": 100,
      "maxPrice": 500,
      "sortBy": "startDate",
      "sortOrder": "ASC",
      "include": "all"
    },
    "metadata": {
      "timestamp": "2024-01-15T10:00:00.000Z",
      "searchTime": 45,
      "totalResults": 15
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## 3. Quick Search Endpoint

### Endpoint: `GET /api/search/quick`

Fast search for immediate results, limited to 10 upcoming events.

#### Query Parameters:
- `q` (required): Search query string (2+ characters)

#### Example Request:
```bash
GET /api/search/quick?q=workshop
```

#### Example Response:
```json
{
  "success": true,
  "message": "Quick search completed successfully",
  "data": {
    "results": [...],
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false,
    "filters": {
      "keyword": "workshop",
      "include": "upcoming"
    },
    "metadata": {
      "timestamp": "2024-01-15T10:00:00.000Z",
      "searchTime": 12,
      "totalResults": 8
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## 4. Event Controller Search Endpoints

### Endpoint: `GET /api/events/search/global`

Global search integrated with event endpoints.

#### Query Parameters: Same as Global Search above

#### Example Request:
```bash
GET /api/events/search/global?keyword=conference&location=New York&type=workshop
```

### Endpoint: `GET /api/events/search/quick`

Quick search integrated with event endpoints.

#### Query Parameters:
- `q` (required): Search query string

#### Example Request:
```bash
GET /api/events/search/quick?q=seminar
```

## Search Features

### 1. Text Search
- **Case-insensitive**: All text searches are case-insensitive
- **Partial matching**: Uses LIKE queries for partial text matching
- **Multiple fields**: Searches across name, description, venue, location, country, etc.

### 2. Advanced Filtering
- **Date ranges**: Filter by start/end dates
- **Price ranges**: Filter by minimum and maximum prices
- **Event types**: Filter by specific event types
- **Categories**: Filter by event categories
- **Location-based**: Filter by location, venue, or country

### 3. Sorting Options
- **Multiple fields**: Sort by name, dates, price, or creation date
- **Direction**: Ascending or descending order
- **Default**: Sorts by start date in ascending order

### 4. Pagination
- **Configurable limits**: 1-100 results per page
- **Page navigation**: Previous/next page indicators
- **Total counts**: Total results and pages information

### 5. Enhanced Results
- **User context**: Includes favorite status and registration status for authenticated users
- **Related data**: Speakers, categories, exhibitors, and attendance counts
- **Search highlighting**: Shows which fields matched the search query
- **Event colors**: Color coding based on event type

## Error Handling

### Common Error Responses:

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Query parameter 'q' is required",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

## Usage Examples

### 1. Find all conferences in a specific city
```bash
GET /api/search/global?type=conference&location=San Francisco
```

### 2. Search for free events
```bash
GET /api/search/global?maxPrice=0
```

### 3. Find upcoming workshops
```bash
GET /api/search/global?type=workshop&include=upcoming
```

### 4. Search by date range
```bash
GET /api/search/global?startDate=2024-06-01&endDate=2024-12-31
```

### 5. Find events by category
```bash
GET /api/search/global?category=Technology
```

### 6. Quick search for immediate results
```bash
GET /api/search/quick?q=AI
```

## Performance Notes

- **Indexing**: Ensure database indexes are created on searchable fields
- **Pagination**: Use pagination for large result sets
- **Filtering**: Apply specific filters to reduce result set size
- **Caching**: Consider implementing caching for frequently searched terms

## Rate Limiting

- **Authentication required**: All endpoints require valid JWT tokens
- **Role-based access**: Different user roles have access to different search features
- **Query validation**: Input validation prevents malicious queries

## Best Practices

1. **Use appropriate endpoints**: Choose the right search endpoint for your use case
2. **Implement pagination**: Always implement pagination for large result sets
3. **Apply filters**: Use specific filters to get relevant results
4. **Handle errors**: Implement proper error handling for failed searches
5. **Cache results**: Cache frequently searched results when possible
6. **Validate input**: Validate search parameters on the client side
