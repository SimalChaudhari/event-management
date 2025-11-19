# Android Studio - WebSocket Implementation Guide

## 📱 Complete Android Implementation with Explanations

This guide shows you step-by-step how to implement WebSocket connection for Q&A real-time updates in your Android app using Kotlin.

---

## 📦 Step 1: Add Dependencies

### Add to `build.gradle` (Module: app)

```gradle
dependencies {
    // Socket.IO client for Android
    implementation("io.socket:socket.io-client:2.1.0") {
        exclude group: 'org.json', module: 'json'
    }
    
    // JSON handling (if not already included)
    implementation 'org.json:json:20231013'
    
    // Coroutines for async operations
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // Retrofit for REST API calls (if not already included)
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
}
```

**Explanation:**
- `socket.io-client`: Official Socket.IO library for Android
- `json`: For JSON parsing
- `coroutines`: For handling async operations
- `retrofit`: For REST API calls to fetch existing questions

### Add Internet Permission

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 🔧 Step 2: Create WebSocket Manager Class

Create a new Kotlin file: `QnAWebSocketManager.kt`

```kotlin
package com.yourapp.qna

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

/**
 * WebSocket Manager for Q&A Real-time Updates
 * 
 * This class handles:
 * - Connection to WebSocket server
 * - Joining engagement/session rooms
 * - Listening to real-time question updates
 * - Automatic reconnection
 */
class QnAWebSocketManager(
    private val apiUrl: String,           // Your API base URL (e.g., "https://api.example.com")
    private val engagementId: String? = null,  // Engagement ID (PRIMARY - Use this)
    private val sessionId: String? = null        // Session ID (Fallback only)
) {
    private var socket: Socket? = null
    private val TAG = "QnAWebSocket"
    
    // Callbacks for handling updates
    var onQuestionCreated: ((Question) -> Unit)? = null
    var onQuestionUpdated: ((Question) -> Unit)? = null
    var onQuestionAnswered: ((Question) -> Unit)? = null
    var onQuestionDeleted: ((String) -> Unit)? = null  // questionId
    var onConnectionStatusChanged: ((Boolean) -> Unit)? = null
    
    /**
     * Connect to WebSocket server
     * Call this method to establish connection
     */
    fun connect() {
        try {
            // Configure Socket.IO options
            val options = IO.Options().apply {
                reconnection = true              // Auto-reconnect on disconnect
                reconnectionDelay = 1000         // Wait 1 second before reconnecting
                reconnectionAttempts = 5         // Try 5 times before giving up
                forceNew = false                 // Reuse existing connection if available
                transports = arrayOf("websocket", "polling")  // Try WebSocket first, fallback to polling
            }
            
            // Create socket connection to /qna namespace
            socket = IO.socket("$apiUrl/qna", options)
            
            // Setup event listeners
            setupEventListeners()
            
            // Connect to server
            socket?.connect()
            
            Log.d(TAG, "Attempting to connect to: $apiUrl/qna")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error connecting to WebSocket", e)
            onConnectionStatusChanged?.invoke(false)
        }
    }
    
    /**
     * Setup all event listeners
     * This method registers listeners for all WebSocket events
     */
    private fun setupEventListeners() {
        socket?.let { socket ->
            
            // ============================================
            // CONNECTION EVENTS
            // ============================================
            
            /**
             * EVENT_CONNECT: Fired when socket successfully connects
             * This is the first event you'll receive after connection
             */
            socket.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "✅ WebSocket Connected")
                onConnectionStatusChanged?.invoke(true)
                
                // After connecting, immediately join the room
                joinRoom()
            }
            
            /**
             * EVENT_DISCONNECT: Fired when socket disconnects
             * This can happen due to network issues, server restart, etc.
             */
            socket.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "❌ WebSocket Disconnected")
                onConnectionStatusChanged?.invoke(false)
            }
            
            /**
             * EVENT_CONNECT_ERROR: Fired when connection fails
             * This happens if server is unreachable, wrong URL, etc.
             */
            socket.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = args[0] as? Exception
                Log.e(TAG, "❌ Connection Error: ${error?.message}")
                onConnectionStatusChanged?.invoke(false)
            }
            
            /**
             * EVENT_RECONNECT: Fired when socket reconnects after disconnection
             * You need to rejoin the room after reconnection
             */
            socket.on(Socket.EVENT_RECONNECT) { args ->
                val attemptNumber = args[0] as? Int ?: 0
                Log.d(TAG, "🔄 Reconnected after $attemptNumber attempts")
                onConnectionStatusChanged?.invoke(true)
                
                // IMPORTANT: Rejoin room after reconnection
                joinRoom()
            }
            
            // ============================================
            // SERVER MESSAGES
            // ============================================
            
            /**
             * "connected": Server confirms connection
             * This is a custom event from our server
             */
            socket.on("connected") { args ->
                val data = args[0] as? JSONObject
                val message = data?.optString("message", "")
                Log.d(TAG, "Server: $message")
            }
            
            /**
             * "joined_engagement": Server confirms you joined engagement room
             * This means you'll now receive updates for this engagement
             */
            socket.on("joined_engagement") { args ->
                val data = args[0] as? JSONObject
                val engagementId = data?.optString("engagementId", "")
                Log.d(TAG, "✅ Joined engagement room: $engagementId")
            }
            
            /**
             * "joined_session": Server confirms you joined session room
             * Use this only if you're using sessionId instead of engagementId
             */
            socket.on("joined_session") { args ->
                val data = args[0] as? JSONObject
                val sessionId = data?.optString("sessionId", "")
                Log.d(TAG, "✅ Joined session room: $sessionId")
            }
            
            /**
             * "error": Server sends error message
             * Handle errors like invalid engagementId, etc.
             */
            socket.on("error") { args ->
                val data = args[0] as? JSONObject
                val message = data?.optString("message", "Unknown error")
                Log.e(TAG, "❌ Server Error: $message")
            }
            
            // ============================================
            // QUESTION UPDATE EVENTS
            // ============================================
            
            /**
             * "question_update": Main event for all question changes
             * This event is fired when:
             * - New question is created
             * - Question is updated (likes, status, etc.)
             * - Question is answered
             * - Question is deleted
             */
            socket.on("question_update") { args ->
                try {
                    val data = args[0] as? JSONObject
                    val type = data?.optString("type", "")
                    
                    Log.d(TAG, "📨 Question Update: $type")
                    
                    when (type) {
                        "question_created" -> {
                            // New question created
                            val questionData = data?.optJSONObject("data")?.optJSONObject("question")
                            questionData?.let {
                                val question = parseQuestion(it)
                                onQuestionCreated?.invoke(question)
                            }
                        }
                        
                        "question_updated" -> {
                            // Question updated (likes, status, etc.)
                            val questionData = data?.optJSONObject("data")?.optJSONObject("question")
                            questionData?.let {
                                val question = parseQuestion(it)
                                onQuestionUpdated?.invoke(question)
                            }
                        }
                        
                        "question_answered" -> {
                            // Question answered
                            val questionData = data?.optJSONObject("data")?.optJSONObject("question")
                            questionData?.let {
                                val question = parseQuestion(it)
                                onQuestionAnswered?.invoke(question)
                            }
                        }
                        
                        "question_deleted" -> {
                            // Question deleted
                            val questionId = data?.optJSONObject("data")?.optString("questionId", "")
                            questionId?.let {
                                onQuestionDeleted?.invoke(it)
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing question_update", e)
                }
            }
            
            /**
             * "session_update": Session statistics or data changed
             * You can refresh your UI when this event is received
             */
            socket.on("session_update") { args ->
                val data = args[0] as? JSONObject
                val type = data?.optString("type", "")
                Log.d(TAG, "📊 Session Update: $type")
                // Handle session updates if needed
            }
        }
    }
    
    /**
     * Join room using Engagement ID or Session ID
     * This method is called automatically after connection
     */
    private fun joinRoom() {
        socket?.let { socket ->
            if (socket.connected()) {
                // Use Engagement ID (PRIMARY - Recommended)
                engagementId?.let { id ->
                    val data = JSONObject().apply {
                        put("engagementId", id)
                    }
                    socket.emit("join_engagement", data)
                    Log.d(TAG, "Joining engagement room: $id")
                }
                
                // Use Session ID (Fallback only)
                ?: sessionId?.let { id ->
                    val data = JSONObject().apply {
                        put("sessionId", id)
                    }
                    socket.emit("join_session", data)
                    Log.d(TAG, "Joining session room: $id")
                }
            } else {
                Log.w(TAG, "Cannot join room - socket not connected")
            }
        }
    }
    
    /**
     * Leave room before disconnecting
     * Call this when user navigates away or app goes to background
     */
    fun leaveRoom() {
        socket?.let { socket ->
            if (socket.connected()) {
                engagementId?.let { id ->
                    val data = JSONObject().apply {
                        put("engagementId", id)
                    }
                    socket.emit("leave_engagement", data)
                }
                
                sessionId?.let { id ->
                    val data = JSONObject().apply {
                        put("sessionId", id)
                    }
                    socket.emit("leave_session", data)
                }
            }
        }
    }
    
    /**
     * Disconnect from WebSocket
     * Always call this when done (e.g., in onDestroy, onPause)
     */
    fun disconnect() {
        leaveRoom()
        socket?.disconnect()
        socket = null
        Log.d(TAG, "Disconnected from WebSocket")
    }
    
    /**
     * Check if socket is connected
     */
    fun isConnected(): Boolean {
        return socket?.connected() == true
    }
    
    /**
     * Parse JSON question object to Question data class
     */
    private fun parseQuestion(json: JSONObject): Question {
        val askedByJson = json.optJSONObject("askedBy")
        val answeredByJson = json.optJSONObject("answeredBy")
        
        return Question(
            id = json.optString("id", ""),
            question = json.optString("question", ""),
            answer = json.optString("answer", null),
            likesCount = json.optInt("likesCount", 0),
            isPinned = json.optBoolean("isPinned", false),
            status = json.optString("status", "not_answered"),
            askedBy = askedByJson?.let {
                User(
                    id = it.optString("id", ""),
                    firstName = it.optString("firstName", ""),
                    lastName = it.optString("lastName", ""),
                    fullName = it.optString("fullName", "")
                )
            },
            answeredBy = answeredByJson?.let {
                User(
                    id = it.optString("id", ""),
                    firstName = it.optString("firstName", ""),
                    lastName = it.optString("lastName", ""),
                    fullName = it.optString("fullName", "")
                )
            },
            createdAt = json.optString("createdAt", ""),
            answeredAt = json.optString("answeredAt", null)
        )
    }
}

/**
 * Data classes for Question and User
 * These match the JSON structure from server
 */
data class Question(
    val id: String,
    val question: String,
    val answer: String?,
    val likesCount: Int,
    val isPinned: Boolean,
    val status: String,  // "answered", "not_answered", "approved"
    val askedBy: User?,
    val answeredBy: User?,
    val createdAt: String,
    val answeredAt: String?
)

data class User(
    val id: String,
    val firstName: String,
    val lastName: String,
    val fullName: String
)
```

---

## 📡 Step 3: Create API Service for Fetching Existing Questions

Create `QnAApiService.kt`:

```kotlin
package com.yourapp.qna

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * REST API Service for fetching existing questions
 * IMPORTANT: Always fetch existing questions FIRST before connecting WebSocket
 */
interface QnAApiService {
    
    /**
     * Get all questions for an engagement
     * @param engagementId Engagement ID (PRIMARY - Use this)
     * @param status Optional filter: "all", "not_answered", "answered"
     * @param sortBy Optional sort: "likes", "createdAt", "answeredAt"
     */
    @GET("api/engagements/qna/questions")
    suspend fun getQuestions(
        @Query("engagementId") engagementId: String,
        @Query("status") status: String? = null,
        @Query("sortBy") sortBy: String? = null
    ): QuestionsResponse
    
    /**
     * Get all questions for a session (Fallback only)
     * Use this only if you don't have engagementId
     */
    @GET("api/engagements/qna/questions")
    suspend fun getQuestionsBySession(
        @Query("sessionId") sessionId: String,
        @Query("status") status: String? = null,
        @Query("sortBy") sortBy: String? = null
    ): QuestionsResponse
}

/**
 * Response data classes matching server JSON
 */
data class QuestionsResponse(
    val success: Boolean,
    val message: String,
    val data: QuestionsData
)

data class QuestionsData(
    val questions: List<Question>
)

/**
 * Create Retrofit instance
 */
object ApiClient {
    private const val BASE_URL = "https://api.example.com/"  // Change to your API URL
    
    val qnAApiService: QnAApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(QnAApiService::class.java)
    }
}
```

---

## 🎯 Step 4: Use in Activity/Fragment

Example: `QnAActivity.kt`

```kotlin
package com.yourapp.activities

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.yourapp.qna.*
import kotlinx.coroutines.launch

class QnAActivity : AppCompatActivity() {
    
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: QuestionsAdapter
    private val questionsList = mutableListOf<Question>()
    
    private var webSocketManager: QnAWebSocketManager? = null
    private val engagementId = "your-engagement-id-here"  // Get from intent or shared preferences
    private val apiUrl = "https://api.example.com"  // Your API base URL
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_qna)
        
        setupRecyclerView()
        
        // Step 1: Fetch existing questions from API
        fetchExistingQuestions()
    }
    
    /**
     * Step 1: Fetch existing questions via REST API
     * IMPORTANT: Do this BEFORE connecting WebSocket
     */
    private fun fetchExistingQuestions() {
        lifecycleScope.launch {
            try {
                Log.d("QnAActivity", "Fetching existing questions...")
                
                val response = ApiClient.qnAApiService.getQuestions(
                    engagementId = engagementId,
                    status = "all",
                    sortBy = "likes"
                )
                
                if (response.success && response.data.questions.isNotEmpty()) {
                    // Add questions to list
                    questionsList.clear()
                    questionsList.addAll(response.data.questions)
                    adapter.notifyDataSetChanged()
                    
                    Log.d("QnAActivity", "Loaded ${questionsList.size} existing questions")
                    
                    // Step 2: Now connect to WebSocket for real-time updates
                    connectWebSocket()
                } else {
                    Log.d("QnAActivity", "No existing questions found")
                    // Still connect to WebSocket to receive new questions
                    connectWebSocket()
                }
                
            } catch (e: Exception) {
                Log.e("QnAActivity", "Error fetching questions", e)
                // Still try to connect WebSocket
                connectWebSocket()
            }
        }
    }
    
    /**
     * Step 2: Connect to WebSocket for real-time updates
     */
    private fun connectWebSocket() {
        webSocketManager = QnAWebSocketManager(
            apiUrl = apiUrl,
            engagementId = engagementId  // Use Engagement ID (PRIMARY)
        )
        
        // Setup callbacks
        webSocketManager?.onQuestionCreated = { question ->
            // New question created - add to top of list
            runOnUiThread {
                questionsList.add(0, question)
                adapter.notifyItemInserted(0)
                recyclerView.smoothScrollToPosition(0)
                Log.d("QnAActivity", "New question added: ${question.question}")
            }
        }
        
        webSocketManager?.onQuestionUpdated = { question ->
            // Question updated - find and update in list
            runOnUiThread {
                val index = questionsList.indexOfFirst { it.id == question.id }
                if (index != -1) {
                    questionsList[index] = question
                    adapter.notifyItemChanged(index)
                    Log.d("QnAActivity", "Question updated: ${question.question}")
                }
            }
        }
        
        webSocketManager?.onQuestionAnswered = { question ->
            // Question answered - update in list
            runOnUiThread {
                val index = questionsList.indexOfFirst { it.id == question.id }
                if (index != -1) {
                    questionsList[index] = question
                    adapter.notifyItemChanged(index)
                    Log.d("QnAActivity", "Question answered: ${question.question}")
                }
            }
        }
        
        webSocketManager?.onQuestionDeleted = { questionId ->
            // Question deleted - remove from list
            runOnUiThread {
                val index = questionsList.indexOfFirst { it.id == questionId }
                if (index != -1) {
                    questionsList.removeAt(index)
                    adapter.notifyItemRemoved(index)
                    Log.d("QnAActivity", "Question deleted: $questionId")
                }
            }
        }
        
        webSocketManager?.onConnectionStatusChanged = { isConnected ->
            // Update UI based on connection status
            runOnUiThread {
                if (isConnected) {
                    Log.d("QnAActivity", "✅ WebSocket Connected")
                    // Show connected indicator
                } else {
                    Log.d("QnAActivity", "❌ WebSocket Disconnected")
                    // Show disconnected indicator
                }
            }
        }
        
        // Connect to WebSocket
        webSocketManager?.connect()
    }
    
    private fun setupRecyclerView() {
        recyclerView = findViewById(R.id.recyclerView)
        adapter = QuestionsAdapter(questionsList)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }
    
    /**
     * IMPORTANT: Always disconnect WebSocket when activity is destroyed
     */
    override fun onDestroy() {
        super.onDestroy()
        webSocketManager?.disconnect()
        webSocketManager = null
    }
    
    /**
     * Optional: Disconnect when app goes to background
     */
    override fun onPause() {
        super.onPause()
        // You can disconnect here if you want to save battery
        // Or keep connected to receive updates in background
    }
    
    /**
     * Reconnect when app comes to foreground
     */
    override fun onResume() {
        super.onResume()
        if (webSocketManager?.isConnected() != true) {
            connectWebSocket()
        }
    }
}
```

---

## 📋 Step 5: Complete Flow Explanation

### Flow Diagram:

```
┌─────────────────────────────────────────┐
│  1. Activity/Fragment Created          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Fetch Existing Questions (API)     │
│  GET /api/engagements/qna/questions    │
│  ?engagementId={uuid}                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Display Questions in RecyclerView  │
│  Show all fetched questions             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Connect to WebSocket                │
│  QnAWebSocketManager.connect()          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Join Engagement Room                 │
│  emit('join_engagement', {engagementId}) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Listen for Real-time Updates        │
│  - question_created                     │
│  - question_updated                     │
│  - question_answered                    │
│  - question_deleted                     │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Always Fetch API First**
   - WebSocket only sends NEW updates
   - You must fetch existing questions via REST API first
   - Then connect WebSocket for real-time updates

2. **Use Engagement ID (Primary)**
   - Always use `engagementId` when available
   - Only use `sessionId` as fallback

3. **Lifecycle Management**
   - Connect in `onResume()` or `onCreate()`
   - Disconnect in `onDestroy()`
   - Handle reconnection automatically

4. **Thread Safety**
   - WebSocket callbacks run on background thread
   - Always use `runOnUiThread {}` to update UI

5. **Error Handling**
   - WebSocket automatically reconnects
   - Always rejoin room after reconnection
   - Handle network errors gracefully

---

## ✅ Testing Checklist

- [ ] Dependencies added to build.gradle
- [ ] Internet permission added to manifest
- [ ] QnAWebSocketManager class created
- [ ] API service created for fetching questions
- [ ] Activity/Fragment implementation complete
- [ ] Test connection to WebSocket
- [ ] Test receiving question_created events
- [ ] Test receiving question_updated events
- [ ] Test receiving question_answered events
- [ ] Test receiving question_deleted events
- [ ] Test reconnection after network loss
- [ ] Test proper cleanup in onDestroy

---

## 🔧 Troubleshooting

### Connection Issues
- Check API URL is correct
- Verify internet permission in manifest
- Check if server is running
- Look at Logcat for error messages

### Not Receiving Updates
- Verify Engagement ID is correct
- Check if room join was successful (look for "joined_engagement" log)
- Ensure WebSocket is connected (check `isConnected()`)

### App Crashes
- Make sure to call `runOnUiThread {}` for UI updates
- Check null safety for socket object
- Verify JSON parsing is correct

---

## 📞 Support

For questions or issues:
- Check Logcat for detailed error messages
- Verify server WebSocket endpoint is accessible
- Test with Postman or browser WebSocket client first

