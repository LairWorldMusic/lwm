// Authentication system for Lair World Music
(function() {
  'use strict';

  const API_BASE = '';
  const STORAGE_KEY = 'lwm_auth';

  class Auth {
    constructor() {
      this.user = this.loadUser();
    }

    // Load user from localStorage
    loadUser() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Check if session is still valid (24 hours)
          if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            return data.user;
          }
          this.clearUser();
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
      return null;
    }

    // Save user to localStorage
    saveUser(user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          user,
          timestamp: Date.now()
        }));
        this.user = user;
      } catch (e) {
        console.error('Error saving user:', e);
      }
    }

    // Clear user from localStorage
    clearUser() {
      localStorage.removeItem(STORAGE_KEY);
      this.user = null;
    }

    // Login with access code
    async login(accessCode) {
      try {
        const response = await fetch(`${API_BASE}api/auth.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accessCode })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Неверный код доступа');
        }

        const data = await response.json();
        this.saveUser(data.user);
        return { success: true, user: data.user };
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
    }

    // Logout
    logout() {
      this.clearUser();
      window.location.href = 'index.html';
    }

    // Get current user
    getCurrentUser() {
      return this.user;
    }

    // Check if user is authenticated
    isAuthenticated() {
      return this.user !== null;
    }
  }

  // Create global instance
  window.Auth = new Auth();

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const accessCode = document.getElementById('accessCode').value.trim();
      
      if (!accessCode) {
        errorMessage.textContent = 'Пожалуйста, введите код доступа';
        errorMessage.classList.add('show');
        return;
      }

      // Hide previous messages
      errorMessage.classList.remove('show');
      successMessage.classList.remove('show');

      // Disable button
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Вход...';

      // Attempt login
      const result = await window.Auth.login(accessCode);

      if (result.success) {
        successMessage.classList.add('show');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      } else {
        errorMessage.textContent = result.error || 'Неверный код доступа';
        errorMessage.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="ri-login-box-line"></i> Войти';
      }
    });
  }
})();

