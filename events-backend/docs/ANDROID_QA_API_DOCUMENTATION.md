# Android Q&A API Implementation Guide

## 📱 Complete Android Developer Documentation

**Server URL:** `http://events.isca.org.sg:5000` (or your API URL)  
**Socket URL:** `ws://events.isca.org.sg:5000/qna`  
**Authentication:** JWT Token Required (for creating questions)

---

## 🚀 Quick Setup

### 1. Add Dependencies

Add these dependencies to your `build.gradle (Module: app)`:

```gradle
dependencies {
    // Socket.IO for real-time Q&A updates
    implementation 'io.socket:socket.io-client:2.1.0'
    
    // HTTP requests
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.9.0'
    
    // JSON parsing
    implementation 'com.google.code.gson:gson:2.8.9'
    
    // UI components
    implementation 'androidx.recyclerview:recyclerview:1.3.0'
    implementation 'androidx.cardview:cardview:1.0.0'
}
```

### 2. Add Internet Permission

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 🔧 Implementation

### 1. Create Q&A API Service

```java
// QnAApiService.java
import retrofit2.Call;
import retrofit2.http.*;

public interface QnAApiService {
    
    /**
     * Get all questions for an engagement
     * IMPORTANT: Call this FIRST to load existing questions
     */
    @GET("api/engagements/qna/questions")
    Call<QuestionsResponse> getQuestions(
        @Header("Authorization") String token,
        @Query("engagementId") String engagementId,
        @Query("status") String status,  // Optional: "all", "not_answered", "answered"
        @Query("sortBy") String sortBy   // Optional: "likes", "createdAt", "answeredAt"
    );
    
    /**
     * Create a new question
     * Requires: User must be registered for the event
     */
    @POST("api/engagements/qna")
    Call<CreateQuestionResponse> createQuestion(
        @Header("Authorization") String token,
        @Body CreateQuestionRequest request
    );
}
```

### 2. Create Data Models

```java
// Question.java
public class Question {
    private String id;
    private String question;
    private String answer;
    private String engagementId;
    private String sessionId;
    private User askedBy;
    private User answeredBy;
    private int likesCount;
    private boolean isPinned;
    private boolean isActive;
    private String status;  // "answered", "not_answered", "approved"
    private String createdAt;
    private String answeredAt;
    private String updatedAt;

    // Constructors, getters, and setters
    public Question() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getEngagementId() { return engagementId; }
    public void setEngagementId(String engagementId) { this.engagementId = engagementId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public User getAskedBy() { return askedBy; }
    public void setAskedBy(User askedBy) { this.askedBy = askedBy; }

    public User getAnsweredBy() { return answeredBy; }
    public void setAnsweredBy(User answeredBy) { this.answeredBy = answeredBy; }

    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }

    public boolean isPinned() { return isPinned; }
    public void setPinned(boolean pinned) { isPinned = pinned; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(String answeredAt) { this.answeredAt = answeredAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}

// User.java
public class User {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String fullName;

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}

// CreateQuestionRequest.java
public class CreateQuestionRequest {
    private String engagementId;
    private String sessionId;
    private String question;

    public CreateQuestionRequest(String engagementId, String sessionId, String question) {
        this.engagementId = engagementId;
        this.sessionId = sessionId;
        this.question = question;
    }

    public String getEngagementId() { return engagementId; }
    public void setEngagementId(String engagementId) { this.engagementId = engagementId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}

// QuestionsResponse.java
public class QuestionsResponse {
    private boolean success;
    private String message;
    private QuestionsData data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public QuestionsData getData() { return data; }
    public void setData(QuestionsData data) { this.data = data; }
}

// QuestionsData.java
public class QuestionsData {
    private List<Question> questions;

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
}

// CreateQuestionResponse.java
public class CreateQuestionResponse {
    private boolean success;
    private String message;
    private Question data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Question getData() { return data; }
    public void setData(Question data) { this.data = data; }
}
```

### 3. Create Q&A WebSocket Manager Class

```java
// QnAWebSocketManager.java
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import java.net.URISyntaxException;

/**
 * WebSocket Manager for Q&A Real-time Updates
 * 
 * This class handles:
 * - Connection to WebSocket server
 * - Joining engagement room
 * - Listening to real-time question updates
 * - Automatic reconnection
 */
public class QnAWebSocketManager {
    private static final String SERVER_URL = "http://events.isca.org.sg:5000";
    private Socket socket;
    private String engagementId;
    private QnAListener qnAListener;

    public interface QnAListener {
        void onConnected();
        void onDisconnected();
        void onConnectionError(String error);
        void onQuestionCreated(Question question);      // New question created
        void onQuestionUpdated(Question question);       // Question updated (likes, status, etc.)
        void onQuestionAnswered(Question question);      // Question answered
        void onQuestionDeleted(String questionId);      // Question deleted
    }

    public QnAWebSocketManager(String engagementId, QnAListener listener) {
        this.engagementId = engagementId;
        this.qnAListener = listener;
        initializeSocket();
    }

    private void initializeSocket() {
        try {
            IO.Options options = new IO.Options();
            options.forceNew = false;
            options.reconnection = true;
            options.reconnectionDelay = 1000;
            options.reconnectionAttempts = 5;
            options.timeout = 5000;
            options.transports = new String[]{"websocket", "polling"};
            
            // Connect to /qna namespace (NO authentication required)
            socket = IO.socket(SERVER_URL + "/qna", options);
            setupSocketListeners();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    private void setupSocketListeners() {
        // ============================================
        // CONNECTION EVENTS
        // ============================================
        
        /**
         * EVENT_CONNECT: Fired when socket successfully connects
         */
        socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                if (qnAListener != null) {
                    qnAListener.onConnected();
                }
                // After connecting, immediately join the room
                joinRoom();
            }
        });

        /**
         * "connected": Server confirms connection
         */
        socket.on("connected", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                // Server confirms connection
            }
        });

        /**
         * EVENT_DISCONNECT: Fired when socket disconnects
         */
        socket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                if (qnAListener != null) {
                    qnAListener.onDisconnected();
                }
            }
        });

        /**
         * EVENT_CONNECT_ERROR: Fired when connection fails
         */
        socket.on(Socket.EVENT_CONNECT_ERROR, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                if (qnAListener != null) {
                    qnAListener.onConnectionError("Connection failed");
                }
            }
        });

        /**
         * EVENT_RECONNECT: Fired when socket reconnects
         * IMPORTANT: Rejoin room after reconnection
         */
        socket.on(Socket.EVENT_RECONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                if (qnAListener != null) {
                    qnAListener.onConnected();
                }
                // Rejoin room after reconnection
                joinRoom();
            }
        });

        // ============================================
        // ROOM JOIN EVENTS
        // ============================================
        
        /**
         * "joined_engagement": Server confirms you joined engagement room
         * Now you'll receive real-time updates for this engagement
         */
        socket.on("joined_engagement", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                try {
                    JSONObject data = (JSONObject) args[0];
                    String engagementId = data.optString("engagementId", "");
                    android.util.Log.d("QnAWebSocket", "✅ Joined engagement room: " + engagementId);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        // ============================================
        // QUESTION UPDATE EVENTS
        // ============================================
        
        /**
         * "question_update": Main event for all question changes
         * This fires when:
         * - New question is created (question_created)
         * - Question is updated (question_updated) - likes, status, etc.
         * - Question is answered (question_answered)
         * - Question is deleted (question_deleted)
         */
        socket.on("question_update", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                try {
                    JSONObject data = (JSONObject) args[0];
                    String type = data.optString("type", "");
                    
                    android.util.Log.d("QnAWebSocket", "📨 Question Update: " + type);
                    
                    if (type.equals("question_created")) {
                        // New question created - add to list
                        JSONObject questionData = data.optJSONObject("data").optJSONObject("question");
                        Question question = parseQuestion(questionData);
                        if (qnAListener != null) {
                            qnAListener.onQuestionCreated(question);
                        }
                    } 
                    else if (type.equals("question_updated")) {
                        // Question updated (likes, status, etc.) - update in list
                        JSONObject questionData = data.optJSONObject("data").optJSONObject("question");
                        Question question = parseQuestion(questionData);
                        if (qnAListener != null) {
                            qnAListener.onQuestionUpdated(question);
                        }
                    } 
                    else if (type.equals("question_answered")) {
                        // Question answered - update in list
                        JSONObject questionData = data.optJSONObject("data").optJSONObject("question");
                        Question question = parseQuestion(questionData);
                        if (qnAListener != null) {
                            qnAListener.onQuestionAnswered(question);
                        }
                    } 
                    else if (type.equals("question_deleted")) {
                        // Question deleted - remove from list
                        String questionId = data.optJSONObject("data").optString("questionId", "");
                        if (qnAListener != null) {
                            qnAListener.onQuestionDeleted(questionId);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        /**
         * "error": Server sends error message
         */
        socket.on("error", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                try {
                    JSONObject data = (JSONObject) args[0];
                    String message = data.optString("message", "Unknown error");
                    android.util.Log.e("QnAWebSocket", "❌ Server Error: " + message);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    /**
     * Join engagement room
     * This is called automatically after connection
     */
    private void joinRoom() {
        if (socket != null && socket.connected() && engagementId != null) {
            try {
                JSONObject data = new JSONObject();
                data.put("engagementId", engagementId);
                socket.emit("join_engagement", data);
                android.util.Log.d("QnAWebSocket", "Joining engagement room: " + engagementId);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Parse JSON question object to Question model
     */
    private Question parseQuestion(JSONObject json) throws Exception {
        Question question = new Question();
        question.setId(json.optString("id", ""));
        question.setQuestion(json.optString("question", ""));
        question.setAnswer(json.optString("answer", null));
        question.setEngagementId(json.optString("engagementId", ""));
        question.setSessionId(json.optString("sessionId", ""));
        question.setLikesCount(json.optInt("likesCount", 0));
        question.setPinned(json.optBoolean("isPinned", false));
        question.setActive(json.optBoolean("isActive", true));
        question.setStatus(json.optString("status", "not_answered"));
        question.setCreatedAt(json.optString("createdAt", ""));
        question.setAnsweredAt(json.optString("answeredAt", null));
        question.setUpdatedAt(json.optString("updatedAt", ""));

        // Parse askedBy user
        if (json.has("askedBy") && !json.isNull("askedBy")) {
            JSONObject askedByJson = json.getJSONObject("askedBy");
            User askedBy = new User();
            askedBy.setId(askedByJson.optString("id", ""));
            askedBy.setFirstName(askedByJson.optString("firstName", ""));
            askedBy.setLastName(askedByJson.optString("lastName", ""));
            askedBy.setFullName(askedByJson.optString("fullName", ""));
            question.setAskedBy(askedBy);
        }

        // Parse answeredBy user
        if (json.has("answeredBy") && !json.isNull("answeredBy")) {
            JSONObject answeredByJson = json.getJSONObject("answeredBy");
            User answeredBy = new User();
            answeredBy.setId(answeredByJson.optString("id", ""));
            answeredBy.setFirstName(answeredByJson.optString("firstName", ""));
            answeredBy.setLastName(answeredByJson.optString("lastName", ""));
            answeredBy.setFullName(answeredByJson.optString("fullName", ""));
            question.setAnsweredBy(answeredBy);
        }

        return question;
    }

    // Public methods
    public void connect() {
        if (socket != null) {
            socket.connect();
        }
    }

    public void disconnect() {
        if (socket != null) {
            socket.disconnect();
        }
    }

    public boolean isConnected() {
        return socket != null && socket.connected();
    }
}
```

---

## 📱 Activity Implementation Example

### QnAActivity.java

```java
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class QnAActivity extends AppCompatActivity implements QnAWebSocketManager.QnAListener {
    
    private RecyclerView recyclerView;
    private QuestionAdapter questionAdapter;
    private EditText questionInput;
    private Button sendButton;
    private List<Question> questionList;
    
    private QnAWebSocketManager webSocketManager;
    private QnAApiService apiService;
    private String engagementId;
    private String sessionId;
    private String jwtToken;
    private static final String BASE_URL = "http://events.isca.org.sg:5000/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qna);

        initializeViews();
        setupRecyclerView();
        
        // Get data from intent
        engagementId = getIntent().getStringExtra("engagementId");
        sessionId = getIntent().getStringExtra("sessionId");
        jwtToken = getSharedPreferences("app_prefs", MODE_PRIVATE)
                .getString("jwt_token", "");

        // Initialize API service
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(QnAApiService.class);

        // Step 1: Load existing questions from API FIRST
        loadQuestions();

        // Setup send button
        sendButton.setOnClickListener(v -> createQuestion());
    }

    private void initializeViews() {
        recyclerView = findViewById(R.id.recyclerView);
        questionInput = findViewById(R.id.questionInput);
        sendButton = findViewById(R.id.sendButton);
        questionList = new ArrayList<>();
    }

    private void setupRecyclerView() {
        questionAdapter = new QuestionAdapter(questionList);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(questionAdapter);
    }

    /**
     * Step 1: Load existing questions from API
     * IMPORTANT: Do this BEFORE connecting WebSocket
     */
    private void loadQuestions() {
        Call<QuestionsResponse> call = apiService.getQuestions(
                "Bearer " + jwtToken,
                engagementId,
                "all",      // status: "all", "not_answered", "answered"
                "likes"     // sortBy: "likes", "createdAt", "answeredAt"
        );

        call.enqueue(new Callback<QuestionsResponse>() {
            @Override
            public void onResponse(Call<QuestionsResponse> call, Response<QuestionsResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    QuestionsResponse questionsResponse = response.body();
                    if (questionsResponse.isSuccess() && questionsResponse.getData() != null) {
                        // Add all existing questions to list
                        questionList.clear();
                        questionList.addAll(questionsResponse.getData().getQuestions());
                        questionAdapter.notifyDataSetChanged();
                        
                        // Step 2: Now connect to WebSocket for real-time updates
                        connectWebSocket();
                    }
                } else {
                    Toast.makeText(QnAActivity.this, "Failed to load questions", Toast.LENGTH_SHORT).show();
                    // Still try to connect WebSocket
                    connectWebSocket();
                }
            }

            @Override
            public void onFailure(Call<QuestionsResponse> call, Throwable t) {
                Toast.makeText(QnAActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                // Still try to connect WebSocket
                connectWebSocket();
            }
        });
    }

    /**
     * Step 2: Connect to WebSocket for real-time updates
     */
    private void connectWebSocket() {
        webSocketManager = new QnAWebSocketManager(engagementId, this);
        webSocketManager.connect();
    }

    /**
     * Create a new question
     */
    private void createQuestion() {
        String questionText = questionInput.getText().toString().trim();
        if (questionText.isEmpty()) {
            Toast.makeText(this, "Please enter a question", Toast.LENGTH_SHORT).show();
            return;
        }

        // Disable button while sending
        sendButton.setEnabled(false);

        CreateQuestionRequest request = new CreateQuestionRequest(
                engagementId,
                sessionId,
                questionText
        );

        Call<CreateQuestionResponse> call = apiService.createQuestion(
                "Bearer " + jwtToken,
                request
        );

        call.enqueue(new Callback<CreateQuestionResponse>() {
            @Override
            public void onResponse(Call<CreateQuestionResponse> call, Response<CreateQuestionResponse> response) {
                sendButton.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    CreateQuestionResponse createResponse = response.body();
                    if (createResponse.isSuccess()) {
                        // Clear input
                        questionInput.setText("");
                        Toast.makeText(QnAActivity.this, "Question posted!", Toast.LENGTH_SHORT).show();
                        // Note: The question will appear automatically via WebSocket (question_created event)
                    } else {
                        Toast.makeText(QnAActivity.this, createResponse.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(QnAActivity.this, "Failed to create question", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<CreateQuestionResponse> call, Throwable t) {
                sendButton.setEnabled(true);
                Toast.makeText(QnAActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ============================================
    // WebSocket Listener Implementations
    // ============================================

    @Override
    public void onConnected() {
        runOnUiThread(() -> {
            android.util.Log.d("QnAActivity", "✅ WebSocket Connected");
            // You can show connection indicator if needed
        });
    }

    @Override
    public void onDisconnected() {
        runOnUiThread(() -> {
            android.util.Log.d("QnAActivity", "❌ WebSocket Disconnected");
            // You can show disconnection indicator if needed
        });
    }

    @Override
    public void onConnectionError(String error) {
        runOnUiThread(() -> {
            android.util.Log.e("QnAActivity", "Connection error: " + error);
        });
    }

    /**
     * New question created - add to top of list
     * This fires when ANYONE creates a question (including yourself)
     */
    @Override
    public void onQuestionCreated(Question question) {
        runOnUiThread(() -> {
            // Add new question to top of list
            questionList.add(0, question);
            questionAdapter.notifyItemInserted(0);
            recyclerView.smoothScrollToPosition(0);
            android.util.Log.d("QnAActivity", "New question added: " + question.getQuestion());
        });
    }

    /**
     * Question updated - update in list
     * This fires when question is updated (likes, status, etc.)
     */
    @Override
    public void onQuestionUpdated(Question question) {
        runOnUiThread(() -> {
            // Find and update question in list
            for (int i = 0; i < questionList.size(); i++) {
                if (questionList.get(i).getId().equals(question.getId())) {
                    questionList.set(i, question);
                    questionAdapter.notifyItemChanged(i);
                    android.util.Log.d("QnAActivity", "Question updated: " + question.getQuestion());
                    break;
                }
            }
        });
    }

    /**
     * Question answered - update in list
     * This fires when question is answered
     */
    @Override
    public void onQuestionAnswered(Question question) {
        runOnUiThread(() -> {
            // Find and update question in list
            for (int i = 0; i < questionList.size(); i++) {
                if (questionList.get(i).getId().equals(question.getId())) {
                    questionList.set(i, question);
                    questionAdapter.notifyItemChanged(i);
                    android.util.Log.d("QnAActivity", "Question answered: " + question.getQuestion());
                    break;
                }
            }
        });
    }

    /**
     * Question deleted - remove from list
     * This fires when question is deleted
     */
    @Override
    public void onQuestionDeleted(String questionId) {
        runOnUiThread(() -> {
            // Find and remove question from list
            for (int i = 0; i < questionList.size(); i++) {
                if (questionList.get(i).getId().equals(questionId)) {
                    questionList.remove(i);
                    questionAdapter.notifyItemRemoved(i);
                    android.util.Log.d("QnAActivity", "Question deleted: " + questionId);
                    break;
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webSocketManager != null) {
            webSocketManager.disconnect();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Optional: Disconnect to save battery
        // Or keep connected to receive updates in background
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Reconnect if disconnected
        if (webSocketManager != null && !webSocketManager.isConnected()) {
            connectWebSocket();
        }
    }
}
```

---

## 🎨 UI Layout Example

### activity_qna.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <!-- Questions list -->
    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/recyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:padding="8dp" />

    <!-- Question input -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="8dp"
        android:background="@color/light_gray">

        <EditText
            android:id="@+id/questionInput"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:hint="Ask a question..."
            android:padding="12dp"
            android:background="@drawable/question_input_background" />

        <Button
            android:id="@+id/sendButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Post"
            android:layout_marginStart="8dp" />

    </LinearLayout>

</LinearLayout>
```

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/engagements/qna/questions?engagementId={uuid}` | Get all questions |
| POST | `/api/engagements/qna` | Create a new question |

### Headers Required:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Create Question Request Body:
```json
{
  "engagementId": "uuid",
  "sessionId": "uuid",
  "question": "Your question text here"
}
```

---

## 🔧 Socket Events Reference

### Events to Emit (Send to Server):

| Event | Data | Description |
|-------|------|-------------|
| `join_engagement` | `{engagementId}` | Join engagement room for real-time updates |

### Events to Listen (Receive from Server):

| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{message}` | Connection confirmed |
| `joined_engagement` | `{engagementId}` | Successfully joined room |
| `question_update` | `{type, data}` | Question update (created/updated/answered/deleted) |

**Question Update Types:**
- `question_created` - New question created
- `question_updated` - Question updated (likes, status, etc.)
- `question_answered` - Question answered
- `question_deleted` - Question deleted

---

## ⚡ Complete Flow

```
┌─────────────────────────────────────────┐
│  1. Activity Created                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Load Existing Questions (API)      │
│  GET /api/engagements/qna/questions     │
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
│  4. Connect to WebSocket                 │
│  ws://server/qna                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Join Engagement Room                │
│  emit('join_engagement', {engagementId})│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Listen for Real-time Updates        │
│  - question_created (add to list)        │
│  - question_updated (update in list)     │
│  - question_answered (update in list)    │
│  - question_deleted (remove from list)  │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **API First, WebSocket Second**
   - Always fetch existing questions via API FIRST
   - WebSocket only sends NEW updates, not existing data

2. **No Authentication for WebSocket**
   - WebSocket connection is public (no JWT token needed)
   - Only API calls require JWT token

3. **Use Engagement ID (Primary)**
   - Always use `engagementId` when available
   - This is the primary identifier for mobile apps

4. **Real-time Updates**
   - When ANYONE creates/updates/answers/deletes a question, ALL connected clients receive the update
   - Your UI will automatically refresh when updates arrive

5. **Thread Safety**
   - WebSocket callbacks run on background thread
   - Always use `runOnUiThread()` to update UI

---

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Check internet connection
   - Verify server URL is correct
   - Check if server is running

2. **Questions Not Loading**
   - Verify JWT token is valid
   - Check engagementId is correct
   - Look at Logcat for error messages

3. **Not Receiving Updates**
   - Verify WebSocket is connected
   - Check if room join was successful (look for "joined_engagement" log)
   - Ensure engagementId is correct

4. **App Crashes**
   - Make sure to call `runOnUiThread {}` for UI updates
   - Check null safety for socket object
   - Verify JSON parsing is correct

---

## 📞 Support

For technical support:
- Server URL: `http://events.isca.org.sg:5000`
- Socket URL: `ws://events.isca.org.sg:5000/qna`
- Check API documentation for latest updates

**Remember:** Always handle network operations on background threads and update UI on the main thread!

