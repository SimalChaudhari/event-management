export const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google & Facebook Sign-In</title>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 { color: #333; margin-bottom: 30px; }
    .result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      display: none;
    }
    .success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    .error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    .token-display {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      display: none;
    }
    textarea {
      width: 100%;
      height: 80px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      margin: 10px 0;
      resize: vertical;
    }
    .btn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 0 5px;
      font-size: 14px;
    }
    .btn:hover { background-color: #0056b3; }
    .btn-success {
      background-color: #28a745;
    }
    .btn-success:hover { background-color: #218838; }
    .manual-login-btn {
      background-color: #1877f2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px 0;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .manual-login-btn:hover {
      background-color: #166fe5;
    }
    .manual-login-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .loading {
      display: none;
      margin: 10px 0;
    }
    .loading::after {
      content: '';
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .https-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Social Login</h1>

    <div id="https-warning" class="https-warning" style="display: none;">
      ⚠️ Facebook Login requires HTTPS. Please use HTTPS for full functionality.
    </div>

    <!-- Google Sign-In -->
    <div id="google-section">
      <h3>Google Login</h3>
      <div id="g_id_onload"
           data-client_id="YOUR_GOOGLE_CLIENT_ID"
           data-callback="handleGoogleResponse"
           data-auto_prompt="false">
      </div>
      <div class="g_id_signin"
           data-type="standard"
           data-size="large"
           data-theme="outline"
           data-text="sign_in_with"
           data-shape="rectangular"
           data-logo_alignment="left">
      </div>
    </div>

    <div style="margin: 20px 0; color: #666;">OR</div>

    <!-- Facebook Manual Login -->
    <div id="facebook-section">
      <h3>Facebook Login</h3>
      <button id="manual-fb-btn" class="manual-login-btn" onclick="manualFacebookLogin()" disabled>
        Login with Facebook
      </button>
    </div>

    <!-- Token Display -->
    <div id="token-display" class="token-display">
      <h3>🔐 Access Token</h3>
      <textarea id="id-token" readonly></textarea>
      <button class="btn btn-success" onclick="copyToken()">📋 Copy Token</button>
    </div>

    <div id="result" class="result"></div>
    <div id="loading" class="loading"></div>
  </div>

  <!-- Google SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <!-- Facebook SDK -->
  <div id="fb-root"></div>
  <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

  <script>
    // HTTPS Check
    function checkHTTPS() {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('https-warning').style.display = 'block';
        document.getElementById('facebook-section').style.opacity = '0.5';
        document.getElementById('manual-fb-btn').disabled = true;
        return false;
      }
      return true;
    }

    // Facebook Init
    window.fbAsyncInit = function () {
      if (!checkHTTPS()) return;

      FB.init({
        appId: '1235957981373454',
        cookie: true,
        xfbml: false,
        version: 'v18.0'
      });

      FB.AppEvents.logPageView();
      document.getElementById('manual-fb-btn').disabled = false;
    };

    function manualFacebookLogin() {
      FB.login(function (response) {
        if (response.authResponse) {
          const token = response.authResponse.accessToken;
          document.getElementById('id-token').value = token;
          document.getElementById('token-display').style.display = 'block';
          showResult('success', '✅ Facebook Login Successful');
        } else {
          showResult('error', '❌ Facebook Login Failed');
        }
      }, { scope: 'public_profile,email' });
    }

    function handleGoogleResponse(response) {
      const idToken = response.credential;
      document.getElementById('id-token').value = idToken;
      document.getElementById('token-display').style.display = 'block';
      showResult('success', '✅ Google Login Successful');
    }

    function copyToken() {
      const token = document.getElementById('id-token').value;
      navigator.clipboard.writeText(token).then(() => {
        showResult('success', '📋 Token copied to clipboard!');
      }).catch(() => {
        showResult('error', '❌ Failed to copy token.');
      });
    }

    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
      if (type === 'success') {
        setTimeout(() => resultDiv.style.display = 'none', 5000);
      }
    }

    document.addEventListener('DOMContentLoaded', checkHTTPS);
  </script>
</body>
</html>
`;



export const facebookTokenHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Facebook Access Token</title>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #1877f2, #42a5f5);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 { 
      color: #1877f2; 
      margin-bottom: 20px; 
      font-size: 24px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .fb-btn {
      background: #1877f2;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      margin: 10px 0;
      transition: background 0.3s;
    }
    .fb-btn:hover {
      background: #166fe5;
    }
    .fb-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .token-display {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      display: none;
    }
    textarea {
      width: 100%;
      height: 100px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      margin: 10px 0;
      resize: vertical;
    }
    .copy-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .copy-btn:hover {
      background: #218838;
    }
    .result {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      display: none;
    }
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Facebook Access Token</h1>
    
    <div id="https-warning" class="warning" style="display: none;">
      ⚠️ <strong>HTTPS Required:</strong> Facebook login requires HTTPS. 
      Please use ngrok or HTTPS setup for testing.
    </div>
    
    <button id="fb-login-btn" class="fb-btn" onclick="getFacebookToken()" disabled>
      Get Facebook Access Token
    </button>

    <div id="token-display" class="token-display">
      <h3>Access Token:</h3>
      <textarea id="access-token" readonly></textarea>
      <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
    </div>

    <div id="result" class="result"></div>
  </div>

  <!-- Facebook SDK -->
  <div id="fb-root"></div>
  <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

  <script>
    // Check HTTPS requirement
    function checkHTTPS() {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('https-warning').style.display = 'block';
        document.getElementById('fb-login-btn').disabled = true;
        showResult('error', '❌ HTTPS is required for Facebook login');
        return false;
      }
      return true;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      if (!checkHTTPS()) return;

      FB.init({
        appId: '1235957981373454', // Replace with your Facebook App ID
        cookie: true,
        xfbml: false,
        version: 'v18.0'
      });

      FB.AppEvents.logPageView();
      document.getElementById('fb-login-btn').disabled = false;
    };

    // Get Facebook Access Token
    function getFacebookToken() {
      if (!checkHTTPS()) {
        showResult('error', '❌ Please use HTTPS for Facebook login');
        return;
      }

      FB.login(function (response) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          
          // Display token
          document.getElementById('access-token').value = accessToken;
          document.getElementById('token-display').style.display = 'block';
          
          showResult('success', '✅ Access Token received successfully!');
        } else {
          showResult('error', '❌ Facebook login failed or was cancelled');
        }
      }, { scope: 'public_profile' }); // Removed 'email' from scope
    }

    // Copy token to clipboard
    function copyToken() {
      const token = document.getElementById('access-token').value;
      navigator.clipboard.writeText(token).then(() => {
        showResult('success', '📋 Token copied to clipboard!');
      }).catch(() => {
        showResult('error', '❌ Failed to copy token');
      });
    }

    // Show result message
    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(() => resultDiv.style.display = 'none', 3000);
      }
    }

    // Check HTTPS on page load
    document.addEventListener('DOMContentLoaded', checkHTTPS);
  </script>
</body>
</html>
`;

export const appleTokenHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Apple Sign In - Identity Token</title>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #000000, #333333);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 { 
      color: #000000; 
      margin-bottom: 20px; 
      font-size: 24px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .apple-btn {
      background: #000000;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      margin: 10px 0;
      transition: background 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .apple-btn:hover {
      background: #333333;
    }
    .apple-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .token-display {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      display: none;
    }
    textarea {
      width: 100%;
      height: 100px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      margin: 10px 0;
      resize: vertical;
    }
    .copy-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .copy-btn:hover {
      background: #218838;
    }
    .result {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      display: none;
    }
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    .manual-input {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
    }
    .manual-input input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 10px 0;
      font-family: monospace;
      font-size: 12px;
    }
    .test-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    .test-btn:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍎 Apple Sign In</h1>
    
    <div id="https-warning" class="warning" style="display: none;">
      ⚠️ <strong>HTTPS Required:</strong> Apple Sign In requires HTTPS. 
      Please use ngrok or HTTPS setup for testing.
    </div>
    
    <button id="apple-login-btn" class="apple-btn" onclick="getAppleToken()" disabled>
      Sign in with Apple
    </button>

    <div id="token-display" class="token-display">
      <h3>Identity Token:</h3>
      <textarea id="identity-token" readonly></textarea>
      <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
    </div>

    <!-- Manual Token Input for Testing -->
    <div class="manual-input">
      <h3>Manual Testing</h3>
      <p>For testing purposes, you can manually enter an Apple identity token:</p>
      <input type="text" id="manual-token" placeholder="Enter Apple identity token here..." />
      <button class="test-btn" onclick="testManualToken()">Test Token</button>
    </div>

    <div id="result" class="result"></div>
  </div>

  <!-- Apple Sign In SDK -->
  <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>

  <script>
    // Check HTTPS requirement
    function checkHTTPS() {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('https-warning').style.display = 'block';
        document.getElementById('apple-login-btn').disabled = true;
        showResult('error', '❌ HTTPS is required for Apple Sign In');
        return false;
      }
      return true;
    }

    // Initialize Apple Sign In
    function initAppleSignIn() {
      if (!checkHTTPS()) return;

      AppleID.auth.init({
        clientId: 'com.yourapp.example', // Replace with your Apple Client ID
        scope: 'name email',
        redirectURI: window.location.origin + '/api/auth/apple-callback',
        state: 'origin:web'
      });

      document.getElementById('apple-login-btn').disabled = false;
    }

    // Get Apple Identity Token
    function getAppleToken() {
      if (!checkHTTPS()) {
        showResult('error', '❌ Please use HTTPS for Apple Sign In');
        return;
      }

      AppleID.auth.signIn().then(function(response) {
        if (response.authorization && response.authorization.id_token) {
          const identityToken = response.authorization.id_token;
          
          // Display token
          document.getElementById('identity-token').value = identityToken;
          document.getElementById('token-display').style.display = 'block';
          
          showResult('success', '✅ Apple Identity Token received successfully!');
        } else {
          showResult('error', '❌ Apple Sign In failed or was cancelled');
        }
      }).catch(function(error) {
        console.error('Apple Sign In Error:', error);
        showResult('error', '❌ Apple Sign In failed: ' + error.error);
      });
    }

    // Test manual token
    function testManualToken() {
      const token = document.getElementById('manual-token').value.trim();
      
      if (!token) {
        showResult('error', '❌ Please enter a token to test');
        return;
      }

      // Test the token with your backend
      fetch('/api/auth/apple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: token
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showResult('success', '✅ Token is valid! User logged in successfully.');
          console.log('Login Response:', data);
        } else {
          showResult('error', '❌ Token validation failed: ' + data.message);
        }
      })
      .catch(error => {
        showResult('error', '❌ API call failed: ' + error.message);
      });
    }

    // Copy token to clipboard
    function copyToken() {
      const token = document.getElementById('identity-token').value;
      navigator.clipboard.writeText(token).then(() => {
        showResult('success', '📋 Token copied to clipboard!');
      }).catch(() => {
        showResult('error', '❌ Failed to copy token');
      });
    }

    // Show result message
    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(() => resultDiv.style.display = 'none', 5000);
      }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      checkHTTPS();
      // Initialize Apple Sign In after a short delay
      setTimeout(initAppleSignIn, 1000);
    });
  </script>
</body>
</html>
`;

export const linkedinTokenHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>LinkedIn Sign In - OAuth Flow</title>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #0077b5, #00a0dc);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 { 
      color: #0077b5; 
      margin-bottom: 20px; 
      font-size: 24px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .linkedin-btn {
      background: #0077b5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      margin: 10px 0;
      transition: background 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .linkedin-btn:hover {
      background: #005885;
    }
    .linkedin-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .token-display {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      display: none;
    }
    textarea {
      width: 100%;
      height: 100px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      margin: 10px 0;
      resize: vertical;
    }
    .copy-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .copy-btn:hover {
      background: #218838;
    }
    .result {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      display: none;
    }
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    .manual-input {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
    }
    .manual-input input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 10px 0;
      font-family: monospace;
      font-size: 12px;
    }
    .test-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    .test-btn:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 LinkedIn Sign In</h1>
    
    <div id="https-warning" class="warning" style="display: none;">
      ⚠️ <strong>HTTPS Required:</strong> LinkedIn login requires HTTPS. 
      Please use ngrok or HTTPS setup for testing.
    </div>
    
    <button id="linkedin-login-btn" class="linkedin-btn" onclick="startLinkedInOAuth()" disabled>
      🔗 Sign in with LinkedIn
    </button>

    <div id="token-display" class="token-display">
      <h3>Access Token:</h3>
      <textarea id="access-token" readonly></textarea>
      <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
    </div>

    <!-- Manual Token Input for Testing -->
    <div class="manual-input">
      <h3>Manual Testing</h3>
      <p>For testing purposes, you can manually enter a LinkedIn access token:</p>
      <input type="text" id="manual-token" placeholder="Enter LinkedIn access token here..." />
      <button class="test-btn" onclick="testManualToken()">Test Token</button>
    </div>

    <div id="result" class="result"></div>
  </div>

  <script>
    // Check HTTPS requirement
    function checkHTTPS() {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        document.getElementById('https-warning').style.display = 'block';
        document.getElementById('linkedin-login-btn').disabled = true;
        showResult('error', '❌ HTTPS is required for LinkedIn login');
        return false;
      }
      return true;
    }

    // Initialize LinkedIn
    function initLinkedIn() {
      if (!checkHTTPS()) return;
      document.getElementById('linkedin-login-btn').disabled = false;
    }

    // Start LinkedIn OAuth Flow
    function startLinkedInOAuth() {
      if (!checkHTTPS()) {
        showResult('error', '❌ Please use HTTPS for LinkedIn login');
        return;
      }

      const clientId = '7731wous76ey71'; // Replace with actual Client ID
      const redirectUri = encodeURIComponent('http://localhost:5000/auth/linkedin/callback');
      const scope = encodeURIComponent('r_liteprofile r_emailaddress');
      const state = 'linkedin_oauth_state';
      
      const authUrl = \`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=\${clientId}&redirect_uri=\${redirectUri}&scope=\${scope}&state=\${state}\`;
      
      console.log('LinkedIn OAuth URL:', authUrl); // Debug log
      
      // Open LinkedIn OAuth in popup
      const popup = window.open(authUrl, 'linkedin_oauth', 'width=500,height=600');
      
      // Check for popup blocker
      if (!popup) {
        showResult('error', '❌ Popup blocked! Please allow popups and try again.');
        return;
      }
      
      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          showResult('info', 'ℹ️ LinkedIn login window closed. Check the popup for your access token.');
        }
      }, 1000);
    }

    // Test manual token
    function testManualToken() {
      const token = document.getElementById('manual-token').value.trim();
      
      if (!token) {
        showResult('error', '❌ Please enter a token to test');
        return;
      }

      // Test the token with your backend
      fetch('/api/auth/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: token
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showResult('success', '✅ Token is valid! User logged in successfully.');
          console.log('Login Response:', data);
        } else {
          showResult('error', '❌ Token validation failed: ' + data.message);
        }
      })
      .catch(error => {
        showResult('error', '❌ API call failed: ' + error.message);
      });
    }

    // Copy token to clipboard
    function copyToken() {
      const token = document.getElementById('access-token').value;
      navigator.clipboard.writeText(token).then(() => {
        showResult('success', '📋 Token copied to clipboard!');
      }).catch(() => {
        showResult('error', '❌ Failed to copy token');
      });
    }

    // Show result message
    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(() => resultDiv.style.display = 'none', 5000);
      }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      checkHTTPS();
      setTimeout(initLinkedIn, 1000);
    });
  </script>
</body>
</html>
`;

