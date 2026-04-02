import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  SalesforceTokenResponse,
  SalesforceEventInfoItem,
  SalesforceEventRegistration,
  SalesforcePicklistResponse,
  SalesforceCreateRegistrationDto,
  SalesforceAttendanceDto,
} from './salesforce.dto';

@Injectable()
export class SalesforceService {
  private readonly logger = new Logger(SalesforceService.name);
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private tokenExpiry: number = 0;
  private readonly TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

  constructor(private readonly config: ConfigService) {}

  private getLoginUrl(): string {
    return (
      this.config.get<string>('SALESFORCE_LOGIN_URL_EVENT') ||
      'https://login.salesforce.com'
    ).replace(/\/$/, '');
  }

  private getBaseUrl(): string {
    const url =
      this.config.get<string>('SALESFORCE_BASE_URL_EVENT') ||
      this.config.get<string>('SALESFORCE_BASE_URL');
    if (!url) {
      throw new Error('SALESFORCE_BASE_URL_EVENT is not configured');
    }
    return url.trim().replace(/\/$/, '');
  }

  private getClientId(): string {
    const id = this.config.get<string>('SALESFORCE_CLIENT_ID_EVENT');
    if (!id) throw new Error('SALESFORCE_CLIENT_ID is not configured');
    return id.trim();
  }

  private getClientSecret(): string {
    return (this.config.get<string>('SALESFORCE_CLIENT_SECRET_EVENT') || '').trim();
  }

  private getUsername(): string {
    const u = this.config.get<string>('SALESFORCE_USERNAME_EVENT');
    if (!u) throw new Error('SALESFORCE_USERNAME is not configured');
    return u.trim();
  }

  private getPassword(): string {
    const p = this.config.get<string>('SALESFORCE_PASSWORD_EVENT');
    if (!p) throw new Error('SALESFORCE_PASSWORD is not configured');
    return p.trim();
  }

  /**
   * Get OAuth access token (password grant).
   * Caches token and refreshes when close to expiry.
   */
  async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - this.TOKEN_BUFFER_MS
    ) {
      return this.accessToken;
    }

    const loginUrl = this.getLoginUrl();
    const clientId = this.getClientId();
    const username = this.getUsername();
    let passwordForOAuth = this.getPassword();
    if (passwordForOAuth.includes('%')) {
      try {
        passwordForOAuth = decodeURIComponent(passwordForOAuth);
      } catch {
        // keep raw password if decode fails
      }
    }
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: this.getClientSecret(),
      username,
      password: passwordForOAuth,
    });

    const url = `${loginUrl}/services/oauth2/token`;
    this.logger.log('Salesforce OAuth request started', {
      loginUrl,
      username,
      clientIdPrefix: clientId.slice(0, 8),
      clientIdSuffix: clientId.slice(-6),
    });
    try {
      const response = await axios.post<SalesforceTokenResponse>(
        url,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        },
      );

      const data = response.data;
      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;
      const expiresIn = 7200;
      this.tokenExpiry = Date.now() + expiresIn * 1000;
      this.logger.log('Salesforce OAuth token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      const status = error?.response?.status;
      const body = error?.response?.data;
      this.logger.error('Salesforce OAuth request context', {
        loginUrl,
        username,
        clientIdPrefix: clientId.slice(0, 8),
        clientIdSuffix: clientId.slice(-6),
      });
      this.logger.error('Salesforce OAuth token request failed', {
        loginUrl,
        status,
        body,
      });
      throw error;
    }

  }

  /** Axios client with Bearer token; baseURL = SALESFORCE_BASE_URL for Apex REST */
  private async getAuthenticatedClient(): Promise<AxiosInstance> {
    const token = await this.getAccessToken();
    const baseURL = this.getBaseUrl();
    return axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * GET EventInfo - list of course instances/events from Salesforce
   */
  async getEventInfo(): Promise<SalesforceEventInfoItem[]> {
    const client = await this.getAuthenticatedClient();
    const response = await client.get<SalesforceEventInfoItem[]>(
      '/services/apexrest/EventInfo',
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * GET EventRegistrations by accountId
   */
  async getEventRegistrations(
    accountId: string,
  ): Promise<SalesforceEventRegistration[]> {
    const client = await this.getAuthenticatedClient();
    const response = await client.get<SalesforceEventRegistration[]>(
      `/services/apexrest/EventRegistrations?accountId=${encodeURIComponent(accountId)}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * GET picklist values for Residential_Declaration__c (uses instance_url from token)
   */
  async getResidentialDeclarationPicklist(
    recordTypeId: string = '01228000000useCAAQ',
  ): Promise<SalesforcePicklistResponse> {
    const token = await this.getAccessToken();
    const baseURL = this.instanceUrl || this.getBaseUrl();
    const response = await axios.get<SalesforcePicklistResponse>(
      `${baseURL}/services/data/v60.0/ui-api/object-info/Course_Registration__c/picklist-values/${recordTypeId}/Residential_Declaration__c`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );
    return response.data;
  }

  /**
   * POST CourseRegistrationCreation - create registration in Salesforce
   */
  async createCourseRegistration(
    dto: SalesforceCreateRegistrationDto,
  ): Promise<unknown> {
    const client = await this.getAuthenticatedClient();
    const response = await client.post(
      '/services/apexrest/CourseRegistrationCreation',
      dto,
    );
    return response.data;
  }

  /**
   * POST attendanceForEvent - mark attendance in Salesforce
   */
  async postAttendance(dto: SalesforceAttendanceDto): Promise<unknown> {
    const client = await this.getAuthenticatedClient();
    const response = await client.post(
      '/services/apexrest/attendanceForEvent',
      dto,
    );
    return response.data;
  }

  /** Clear cached token */
  clearToken(): void {
    this.accessToken = null;
    this.instanceUrl = null;
    this.tokenExpiry = 0;
  }
}
