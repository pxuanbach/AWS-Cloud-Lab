// Utility functions for Group3 Blog

class BlogAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Blog methods
    async getAllBlogs() {
        return this.request('/blogs');
    }

    async getMyBlogs() {
        return this.request('/my-blogs');
    }

    async createBlog(formData) {
        // For FormData, don't set Content-Type header
        return this.request('/blogs', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            body: formData
        });
    }

    async deleteBlog(blogId) {
        return this.request(`/blogs/${blogId}`, {
            method: 'DELETE'
        });
    }

    // Get presigned URL for image
    async getImageUrl(fileName, expires = 3600) {
        if (!fileName) return null;
        try {
            const response = await this.request(`/image-url/${encodeURIComponent(fileName)}?expires=${expires}`);
            return response.url;
        } catch (error) {
            console.error('Error getting image URL:', error);
            return null;
        }
    }
}

// Utility functions
const Utils = {
    // Show alert message
    showAlert(message, type = 'info', containerId = 'alertContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        container.innerHTML = alertHTML;

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Truncate text
    truncateText(text, maxLength = 150) {
        // Replace line breaks with spaces for preview
        const cleanText = text.replace(/\n/g, ' ').replace(/\\n/g, ' ');
        if (cleanText.length <= maxLength) return cleanText;
        return cleanText.substring(0, maxLength) + '...';
    },

    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Redirect with delay
    redirectTo(url, delay = 2000) {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    }
};

// Initialize API instance
const api = new BlogAPI();
