import axios from "axios";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Her isteğe token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: 401 hatalarında oturumu kapat
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authService = {
  login: (email, password) => api.post("/login", { email, password }),
  register: (userData) => api.post("/users/", userData),
  getMe: () => api.get("/me"),
  updateProfile: (data) => api.patch("/update-profile", data),
  updateSettings: (data) => api.patch("/update-settings", data),
};

export const eventService = {
  getEvents: (params) => api.get("/events", { params }),
  createEvent: (eventData) => api.post("/events", eventData),
  autoFetch: (count = 5) => api.post(`/events/auto-fetch?count=${count}`),
  fetchExternal: (location = "İstanbul") => api.get(`/events/fetch-external?location=${location}`),
  getFeed: () => api.get("/feed"),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
};

export const intelligenceService = {
  getRecommendations: () => api.get("/intelligence/recommendations"),
  getMatchSuggestions: () => api.get("/intelligence/match-suggestions"),
  moderateContent: (text) => api.post("/intelligence/moderate", null, { params: { text } })
};

export const marketplaceService = {
  getItems: (category) => api.get("/marketplace/items", { params: { category } }),
  createItem: (data) => api.post("/marketplace/items", data),
  deleteItem: (itemId) => api.delete(`/marketplace/items/${itemId}`),
  buyItem: (itemId) => api.post(`/marketplace/items/${itemId}/buy`)
};

export const searchService = {
  globalSearch: (query) => api.get("/search/", { params: { q: query } }),
};

export const feedService = {
  getHomeFeed: () => api.get("/feed/home")
};

export const chatService = {
  sendMessage: (receiverId, content) => api.post("/chat/send", { receiver_id: receiverId, content }),
  getHistory: (otherUserId) => api.get(`/chat/history/${otherUserId}`),
};

export const walletService = {
    getBalance: () => api.get("/wallet/balance"),
    topUp: (amount) => api.post(`/wallet/top-up?amount=${amount}`),
    withdraw: (amount) => api.post(`/wallet/withdraw?amount=${amount}`)
};

export const reportService = {
    reportUser: (reportedId, reason, details) => api.post(`/reports/report-user`, null, { params: { reported_id: reportedId, reason, details } }),
    getMyReports: () => api.get("/reports/my-reports")
};

export const gamificationService = {
    getAllBadges: () => api.get("/gamification/badges"),
    getMyBadges: () => api.get("/gamification/my-badges"),
    checkAchievements: () => api.post("/gamification/check-achievements")
};



export const activityService = {
  getHistory: () => api.get("/activity/history"),
  likeEvent: (eventId) => api.post(`/activity/like/${eventId}`),
  getLikedEvents: () => api.get("/activity/liked-events")
};

export const supportService = {
  createTicket: (subject, message) => api.post("/support/tickets", { subject, message }),
  getMyTickets: () => api.get("/support/tickets"),
  getRules: () => api.get("/support/rules")
};

export const reviewService = {
  createReview: (reviewData) => api.post("/reviews", reviewData),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  getAverageRating: (userId) => api.get(`/reviews/average/${userId}`)
};

export const paymentService = {
  initialize3DS: (amount, cardInfo) => api.post("/payments/initialize-3ds", { amount, ...cardInfo }),
  getTransactions: () => api.get("/payments/transactions")
};

export const venueService = {
  getVenues: () => api.get("/venues"),
  createVenue: (venueData) => api.post("/venues", venueData)
};

export const interactionService = {
  getIcebreaker: (eventId) => api.get(`/interact/icebreaker/${eventId}`),
  getGeneralIcebreaker: () => api.get("/interact/icebreaker/general"),
  getVoiceRoom: (eventId) => api.get(`/interact/voice-room/${eventId}`)
};



export const participantService = {
  joinEvent: (eventId) => api.post(`/participants/join/${eventId}`),
  leaveEvent: (eventId) => api.delete(`/participants/leave/${eventId}`),
  getMyEvents: () => api.get("/participants/my-events"),
  getTicket: (eventId) => api.get(`/participants/ticket/${eventId}`),
  scanQR: (eventId, sessionToken) => api.post(`/participants/scan-qr/${eventId}?session_token=${sessionToken}`),
  validateTicket: (eventId, accessKey) => api.post("/participants/validate-ticket", null, { params: { event_id: eventId, access_key: accessKey } })
};

export const mediaService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const userService = {
  getProfile: () => api.get("/me"),
  updateProfile: (data) => api.patch("/update-profile", data),
  updateSettings: (data) => api.patch("/update-settings", data),
  changePassword: (data) => api.post("/change-password", data),
  createSupportTicket: (ticketData) => api.post("/support-ticket", ticketData),
  uploadProfileImage: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/users/upload-profile", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  deleteAccount: () => api.delete("/users/me")
};

export const verificationService = {
  verifyIdentity: (data) => api.post("/users/verify/identity", data),
  uploadIdCard: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/users/verify/id-card", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  verifyStudent: (data) => api.post("/users/verify/student-document", data),
  sendEmailOtp: () => api.post("/verify/send-email-otp"),
  verifyEmail: (code) => api.post("/verify/email", { code }),
  sendPhoneOtp: () => api.post("/verify/send-phone-otp"),
  verifyPhone: (code) => api.post("/verify/phone", { code })
};

export const notificationService = {
  getNotifications: () => api.get("/notifications/"),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`)
};

export const securityService = {
  changePassword: (data) => api.post("/security/change-password", data),
  getLoginDevices: () => api.get("/security/devices"),
  logoutDevice: (deviceId) => api.delete(`/security/devices/${deviceId}`)
};

export const clubService = {
  getClubs: () => api.get("/clubs/"),
  createClub: (data) => api.post("/clubs/", data),
  joinClub: (clubId) => api.post(`/clubs/${clubId}/join`),
  getMembers: (clubId) => api.get(`/clubs/${clubId}/members`)
};

export const socialService = {
  sendFriendRequest: (friendId) => api.post("/social/friends/request", { friend_id: friendId }),
  acceptFriendRequest: (friendId) => api.post("/social/friends/accept", null, { params: { friend_id: friendId } }),
  createMoment: (data) => api.post("/social/moments", data),
  getMomentsFeed: () => api.get("/social/moments/feed")
};

export const adminService = {
  getStats: () => api.get("/admin-api/system-stats"),
  verifyUser: (userId) => api.post(`/admin-api/verify-user/${userId}`),
  banUser: (userId, reason) => api.post(`/admin-api/ban-user/${userId}`, null, { params: { reason } }),
  getReports: () => api.get("/admin-api/reports"),
  resolveReport: (reportId, status) => api.post(`/admin-api/reports/${reportId}/resolve`, null, { params: { status } }),
  getPendingVerifications: () => api.get("/admin-api/pending-verifications"),
  rejectVerification: (userId, reason) => api.post(`/admin-api/reject-verification/${userId}`, null, { params: { reason } }),
  getUsers: () => api.get("/admin-api/users")
};

export default api;
