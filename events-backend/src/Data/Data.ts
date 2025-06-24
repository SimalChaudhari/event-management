export const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google & Facebook Sign-In</title>
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

    #fb-login-button {
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign In</h1>

    <!-- Google Sign-In -->
    <div id="g_id_onload"
         data-client_id="${process.env.GOOGLE_CLIENT_ID}"
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

    <!-- Facebook Sign-In -->
    <div id="fb-login-button">
      <fb:login-button scope="public_profile,email" onlogin="checkLoginState();">
      </fb:login-button>
    </div>

    <!-- Token Display -->
    <div id="token-display" class="token-display">
      <h3>🔐 Token Received!</h3>
      <p>OAuth Token:</p>
      <textarea id="id-token" readonly></textarea>
      <div style="margin-top: 15px;">
        <button class="btn btn-success" onclick="copyToken()">📋 Copy Token</button>
        <button class="btn" onclick="clearAll()">🗑️ Clear</button>
      </div>
    </div>

    <!-- Result Display -->
    <div id="result" class="result"></div>
  </div>

  <!-- Google SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <!-- Facebook SDK -->
  <div id="fb-root"></div>
  <script async defer crossorigin="anonymous"
    src="https://connect.facebook.net/en_US/sdk.js"></script>
  <script>
    window.fbAsyncInit = function() {
      FB.init({
        appId: '${process.env.FB_APP_ID}',  // replace with your FB App ID
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });

      FB.AppEvents.logPageView();
    };

    function checkLoginState() {
      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          const accessToken = response.authResponse.accessToken;
          document.getElementById('id-token').value = accessToken;
          document.getElementById('token-display').style.display = 'block';
          showResult('success', '✅ Facebook Sign-In Successful!\\n\\nAccess token received.');
        } else {
          showResult('error', '❌ Facebook Sign-In failed or cancelled.');
        }
      });
    }

    function handleGoogleResponse(response) {
      const idToken = response.credential;
      document.getElementById('id-token').value = idToken;
      document.getElementById('token-display').style.display = 'block';
      showResult('success', '✅ Google Sign-In Successful!\\n\\nToken received.');
    }

    function copyToken() {
      const token = document.getElementById('id-token').value;
      navigator.clipboard.writeText(token);
      showResult('success', '📋 Token copied to clipboard!');
    }

    function clearAll() {
      document.getElementById('token-display').style.display = 'none';
      document.getElementById('result').style.display = 'none';
      document.getElementById('id-token').value = '';
    }

    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
    }
  </script>
</body>
</html>
`;
