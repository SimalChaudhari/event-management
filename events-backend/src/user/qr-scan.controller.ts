//qr-scan.controller.ts
import {
  Controller,
  HttpStatus,
  Param,
  Get,
  Res,
} from '@nestjs/common';

import { Response } from 'express';
import { UserService } from './users.service';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Controller('')
export class QrScanController {
  constructor(
    private readonly userService: UserService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Get user profile page by ID (for QR code scanning)
   * - Public endpoint that doesn't require authentication
   * - Returns HTML profile page when QR code is scanned
   * - Route: GET /:id
   */
  @Get(':id')
  async scanQRCode(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      // Verify user exists
      const userInfo = await this.userService.getUserInfoFromQRCode(id);
      
      // Get the HTML template
      const htmlTemplate = this.getUserProfileTemplate();
      
      // Set content type to HTML
      response.setHeader('Content-Type', 'text/html');
      return response.status(HttpStatus.OK).send(htmlTemplate);
      
    } catch (error) {
      this.errorHandler.logError(error, 'QR code scanning', undefined);
      
      // Return error page
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1 class="error">User Not Found</h1>
          <p>The user profile you're looking for doesn't exist or has been removed.</p>
        </body>
        </html>
      `;
      
      response.setHeader('Content-Type', 'text/html');
      return response.status(HttpStatus.NOT_FOUND).send(errorHtml);
    }
  }

  private getUserProfileTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Profile</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .back-arrow {
            width: 24px;
            height: 24px;
            margin-bottom: 20px;
            cursor: pointer;
        }

        .profile-picture {
            width: 120px;
            height: 120px;
            border-radius: 60px;
            background: #e0e0e0;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #999;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
            background-size: 60px;
            background-repeat: no-repeat;
            background-position: center;
        }

        .profile-picture img {
            width: 100%;
            height: 100%;
            border-radius: 60px;
            object-fit: cover;
        }

        .action-buttons {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
        }

        .btn {
            flex: 1;
            padding: 12px 20px;
            border: 2px solid #20B2AA;
            border-radius: 25px;
            background: transparent;
            color: #20B2AA;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn:hover {
            background: #20B2AA;
            color: white;
        }

        .profile-details {
            text-align: left;
        }

        .detail-item {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
        }

        .detail-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .detail-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .detail-value {
            font-size: 16px;
            color: #333;
            font-weight: 400;
        }

        .linkedin-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 10px;
        }

        .linkedin-link {
            color: #20B2AA;
            text-decoration: none;
            font-size: 14px;
            flex: 1;
        }

        .connect-btn {
            padding: 8px 16px;
            border: 2px solid #20B2AA;
            border-radius: 20px;
            background: transparent;
            color: #20B2AA;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .connect-btn:hover {
            background: #20B2AA;
            color: white;
        }

        .role-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #20B2AA;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
            margin-top: 5px;
        }

        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }

        .error {
            text-align: center;
            padding: 50px;
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="back-arrow" onclick="goBack()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        </div>

        <div id="loading" class="loading">
            Loading user profile...
        </div>

        <div id="error" class="error" style="display: none;">
            User not found or error loading profile.
        </div>

        <div id="profile" style="display: none;">
            <div class="profile-picture" id="profilePicture">
                <!-- Profile picture will be inserted here -->
            </div>

            <div class="action-buttons">
                <button class="btn" onclick="bookmarkUser()">Bookmark</button>
                <button class="btn" onclick="chatNow()">Chat now</button>
            </div>

            <div class="profile-details">
                <div class="detail-item">
                    <div class="detail-label">Name</div>
                    <div class="detail-value" id="userName"></div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Company</div>
                    <div class="detail-value" id="userCompany">Not specified</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Mobile Number</div>
                    <div class="detail-value" id="userMobile"></div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Email Address</div>
                    <div class="detail-value" id="userEmail"></div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Industry</div>
                    <div class="detail-value" id="userIndustry">Not specified</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">
                        <span class="role-badge" id="userRole"></span>
                    </div>
                </div>

                <div class="detail-item" id="linkedinSection" style="display: none;">
                    <div class="detail-label">LinkedIn Account</div>
                    <div class="linkedin-section">
                        <a href="#" class="linkedin-link" id="linkedinLink" target="_blank"></a>
                        <button class="connect-btn" onclick="connectLinkedIn()">Connect</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Get user ID from URL
        const userId = window.location.pathname.split('/').pop();
        
        // Load user profile
        async function loadUserProfile() {
            try {
                const response = await fetch(\`/api/users/get/\${userId}\`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    displayUserProfile(result.data);
                } else {
                    showError();
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                showError();
            }
        }

        function displayUserProfile(userData) {
            // Hide loading, show profile
            document.getElementById('loading').style.display = 'none';
            document.getElementById('profile').style.display = 'block';

            // Set profile picture
            const profilePicture = document.getElementById('profilePicture');
            if (userData.profilePicture) {
                profilePicture.innerHTML = \`<img src="\${userData.profilePicture}" alt="Profile Picture">\`;
            }

            // Set user details
            document.getElementById('userName').textContent = \`\${userData.firstName} \${userData.lastName}\`;
            document.getElementById('userMobile').textContent = userData.mobile || 'Not provided';
            document.getElementById('userEmail').textContent = userData.email;
            document.getElementById('userRole').textContent = userData.role;

            // Show LinkedIn if available
            if (userData.linkedinProfile) {
                document.getElementById('linkedinSection').style.display = 'block';
                document.getElementById('linkedinLink').textContent = userData.linkedinProfile;
                document.getElementById('linkedinLink').href = userData.linkedinProfile;
            }

            // Store user data for actions
            window.userData = userData;
        }

        function showError() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
        }

        function goBack() {
            window.history.back();
        }

        function bookmarkUser() {
            if (window.userData) {
                // Implement bookmark functionality
                alert(\`Bookmarked \${window.userData.firstName} \${window.userData.lastName}\`);
            }
        }

        function chatNow() {
            if (window.userData) {
                // Implement chat functionality
                alert(\`Starting chat with \${window.userData.firstName} \${window.userData.lastName}\`);
            }
        }

        function connectLinkedIn() {
            if (window.userData && window.userData.linkedinProfile) {
                window.open(window.userData.linkedinProfile, '_blank');
            }
        }

        // Load profile when page loads
        document.addEventListener('DOMContentLoaded', loadUserProfile);
    </script>
</body>
</html>`;
  }
}
