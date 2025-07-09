import axiosInstance from '../configs/axiosInstance';

class DashboardService {
    // Get dashboard statistics
    async getDashboardStats() {
        try {
            const response = await axiosInstance.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    // Get user statistics
    async getUserStats() {
        try {
            const response = await axiosInstance.get('/users');
            return response.data;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }

    // Get event statistics
    async getEventStats() {
        try {
            const response = await axiosInstance.get('/events');
            return response.data;
        } catch (error) {
            console.error('Error fetching event stats:', error);
            throw error;
        }
    }

    // Get order statistics
    async getOrderStats() {
        try {
            const response = await axiosInstance.get('/orders');
            return response.data;
        } catch (error) {
            console.error('Error fetching order stats:', error);
            throw error;
        }
    }

    // Get recent activities
    async getRecentActivities() {
        try {
            const response = await axiosInstance.get('/dashboard/activities');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            throw error;
        }
    }

    // Get top performing events
    async getTopEvents() {
        try {
            const response = await axiosInstance.get('/events?sort=revenue&limit=5');
            return response.data;
        } catch (error) {
            console.error('Error fetching top events:', error);
            throw error;
        }
    }

    // Get system health
    async getSystemHealth() {
        try {
            const response = await axiosInstance.get('/dashboard/health');
            return response.data;
        } catch (error) {
            console.error('Error fetching system health:', error);
            throw error;
        }
    }
}

export default new DashboardService();