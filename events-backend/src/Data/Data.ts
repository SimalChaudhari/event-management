export const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Social Login - Google, Facebook, LinkedIn, Apple</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }

    h1 {
      color: #333;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #666;
      font-size: 16px;
      margin-bottom: 40px;
    }

    .login-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .login-card {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 15px;
      padding: 25px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .login-card:hover {
      border-color: #007bff;
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,123,255,0.15);
    }

    .login-card h3 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .google-btn {
      background: #4285f4;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .google-btn:hover {
      background: #3367d6;
      transform: translateY(-2px);
    }

    .facebook-btn {
      background: #1877f2;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .facebook-btn:hover {
      background: #166fe5;
      transform: translateY(-2px);
    }

    .facebook-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .apple-btn {
      background: #000000;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .apple-btn:hover {
      background: #333333;
      transform: translateY(-2px);
    }

    .apple-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .linkedin-btn {
      background: #0077b5;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .linkedin-btn:hover {
      background: #005885;
      transform: translateY(-2px);
    }

    .linkedin-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .token-section {
      margin-top: 30px;
      padding: 25px;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 15px;
      display: none;
    }

    .token-section h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 18px;
    }

    .token-textarea {
      width: 100%;
      height: 120px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 15px 0;
      resize: vertical;
      background: white;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .copy-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .copy-btn:hover {
      background: #218838;
      transform: translateY(-2px);
    }

    .test-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .test-btn:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .manual-section {
      margin-top: 30px;
      padding: 25px;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 15px;
    }

    .manual-section h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 18px;
    }

    .manual-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 15px 0;
    }

    .manual-test-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .manual-test-btn:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    .result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
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

    .info {
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
    }

    .platform-icon {
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }
      
      .login-grid {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>�� Social Login</h1>
    <p class="subtitle">Choose your preferred login method</p>

    <div id="https-warning" class="warning" style="display: none;">
      ⚠️ <strong>HTTPS Required:</strong> Some social logins require HTTPS for full functionality.
    </div>

    <div class="login-grid">
      <!-- Google Login -->
      <div class="login-card">
        <h3>🍎 Google</h3>
      <div id="g_id_onload"
           data-client_id="228913853292-k6a5fut1gfmg5kjkgorcph25356c0r5b.apps.googleusercontent.com"
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

      <!-- Facebook Login -->
      <div class="login-card">
        <h3>📘 Facebook</h3>
        <button id="facebook-btn" class="facebook-btn" onclick="handleFacebookLogin()" disabled>
          <span class="platform-icon">📘</span>
        Login with Facebook
      </button>
    </div>

      <!-- Apple Login -->
      <div class="login-card">
        <h3>🍎 Apple</h3>
        <button id="apple-btn" class="apple-btn" onclick="handleAppleLogin()" disabled>
          <span class="platform-icon">🍎</span>
          Sign in with Apple
        </button>
      </div>

      <!-- LinkedIn Login -->
      <div class="login-card">
        <h3>🔗 LinkedIn</h3>
        <button id="linkedin-btn" class="linkedin-btn" onclick="handleLinkedInLogin()" disabled>
          <span class="platform-icon">🔗</span>
          Sign in with LinkedIn
        </button>
      </div>
    </div>

    <!-- Token Display Section -->
    <div id="token-section" class="token-section">
      <h3>🔐 Access Token</h3>
      <textarea id="access-token" class="token-textarea" readonly placeholder="Token will appear here after successful login..."></textarea>
      <div class="action-buttons">
        <button class="copy-btn" onclick="copyToken()">
          📋 Copy Token
        </button>
        <button class="test-btn" onclick="testToken()">
          🔄 Test Token
        </button>
      </div>
    </div>

    <!-- Manual Testing Section -->
    <div class="manual-section">
      <h3>Manual Testing</h3>
      <p>For testing purposes, you can manually enter a token:</p>
      <input type="text" id="manual-token" class="manual-input" placeholder="Enter token here..." />
      <button class="manual-test-btn" onclick="testManualToken()">Test Manual Token</button>
    </div>

    <div id="result" class="result"></div>
  </div>

  <!-- Google SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <!-- Facebook SDK -->
  <div id="fb-root"></div>
  <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

  <!-- Apple Sign In SDK -->
  <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>

  <script>
    let currentPlatform = '';
    let currentToken = '';

    // Check HTTPS requirement
    function checkHTTPS() {
      const allowedDomains = ['localhost', 'events.isca.org.sg'];
      const currentHostname = location.hostname;
      const isAllowedDomain = allowedDomains.some(domain => 
        currentHostname === domain || currentHostname.endsWith('.' + domain)
      );
      
      if (location.protocol !== 'https:' && !isAllowedDomain) {
        document.getElementById('https-warning').style.display = 'block';
        document.getElementById('facebook-btn').disabled = true;
        document.getElementById('apple-btn').disabled = true;
        document.getElementById('linkedin-btn').disabled = true;
        return false;
      }
      return true;
    }

    // Initialize all platforms
    function initializePlatforms() {
      checkHTTPS();
      
      // Enable LinkedIn (no SDK needed for OAuth flow)
      document.getElementById('linkedin-btn').disabled = false;
    }

    // Google Login Handler
    function handleGoogleResponse(response) {
      currentPlatform = 'Google';
      currentToken = response.credential;
      displayToken(currentToken);
      showResult('success', '✅ Google Login Successful!');
    }

    // Facebook Login Handler
    function handleFacebookLogin() {
      if (!checkHTTPS()) {
        showResult('error', '❌ HTTPS is required for Facebook login');
        return;
      }

      FB.login(function (response) {
        if (response.authResponse) {
          currentPlatform = 'Facebook';
          currentToken = response.authResponse.accessToken;
          displayToken(currentToken);
          showResult('success', '✅ Facebook Login Successful!');
        } else {
          showResult('error', '❌ Facebook Login Failed');
        }
      }, { scope: 'public_profile' });
    }

    // Apple Login Handler
    function handleAppleLogin() {
      if (!checkHTTPS()) {
        showResult('error', '❌ HTTPS is required for Apple Sign In');
        return;
      }

      AppleID.auth.signIn().then(function(response) {
        if (response.authorization && response.authorization.id_token) {
          currentPlatform = 'Apple';
          currentToken = response.authorization.id_token;
          displayToken(currentToken);
          showResult('success', '✅ Apple Sign In Successful!');
        } else {
          showResult('error', '❌ Apple Sign In Failed');
        }
      }).catch(function(error) {
        console.error('Apple Sign In Error:', error);
        showResult('error', '❌ Apple Sign In failed: ' + error.error);
      });
    }

    // LinkedIn Login Handler
    function handleLinkedInLogin() {
      if (!checkHTTPS()) {
        showResult('error', '❌ HTTPS is required for LinkedIn login');
        return;
      }

      const clientId = '7731wous76ey71';
      const redirectUri = encodeURIComponent('https://abc123.ngrok.io/auth/linkedin/callback');
      const scope = encodeURIComponent('r_liteprofile r_emailaddress');
      const state = 'linkedin_oauth_state';
      
      const authUrl = \`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=\${clientId}&redirect_uri=\${redirectUri}&scope=\${scope}&state=\${state}\`;
      
      const popup = window.open(authUrl, 'linkedin_oauth', 'width=500,height=600');
      
      if (!popup) {
        showResult('error', '❌ Popup blocked! Please allow popups and try again.');
        return;
      }
      
      showResult('info', 'ℹ️ LinkedIn login window opened. Please complete the login in the popup.');
    }

    // Display token
    function displayToken(token) {
      document.getElementById('access-token').value = token;
      document.getElementById('token-section').style.display = 'block';
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

    // Test current token
    function testToken() {
      if (!currentToken) {
        showResult('error', '❌ No token available to test');
        return;
      }
      testTokenWithBackend(currentToken, currentPlatform);
    }

    // Test manual token
    function testManualToken() {
      const token = document.getElementById('manual-token').value.trim();
      
      if (!token) {
        showResult('error', '❌ Please enter a token to test');
        return;
      }

      testTokenWithBackend(token, 'Manual');
    }

    // Test token with backend
    function testTokenWithBackend(token, platform) {
      const endpoints = {
        'Google': '/api/auth/google',
        'Facebook': '/api/auth/facebook',
        'Apple': '/api/auth/apple',
        'LinkedIn': '/api/auth/linkedin',
        'Manual': '/api/auth/verify'
      };

      const endpoint = endpoints[platform] || '/api/auth/verify';
      const payload = {
        token: token,
        platform: platform
      };

      showResult('info', '🔄 Testing token with backend...');

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showResult('success', \`✅ \${platform} token is valid! User logged in successfully.\`);
          console.log('Login Response:', data);
        } else {
          showResult('error', \`❌ \${platform} token validation failed: \${data.message}\`);
        }
      })
      .catch(error => {
        showResult('error', \`❌ API call failed: \${error.message}\`);
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
      setTimeout(initializePlatforms, 1000);
    });

    // Facebook SDK initialization
    window.fbAsyncInit = function () {
      if (checkHTTPS()) {
        FB.init({
          appId: '1235957981373454',
          cookie: true,
          xfbml: false,
          version: 'v18.0'
        });
        FB.AppEvents.logPageView();
        document.getElementById('facebook-btn').disabled = false;
      }
    };

    // Apple Sign In initialization
    function initAppleSignIn() {
      if (checkHTTPS() && typeof AppleID !== 'undefined') {
        AppleID.auth.init({
          clientId: 'com.yourapp.example',
          scope: 'name email',
          redirectURI: window.location.origin + '/api/auth/apple-callback',
          state: 'origin:web'
        });
        document.getElementById('apple-btn').disabled = false;
      }
    }

    // Initialize Apple Sign In after a delay
    setTimeout(initAppleSignIn, 2000);
  </script>
</body>
</html>
`;



