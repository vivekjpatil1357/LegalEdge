**I. Authentication and User Management Routes:**

*   **`/api/lawyers/auth/register` (POST):** Register a new user (individual, business, or lawyer).
    *   Request Body: `first_name`, `last_name`, `email`, `password`,`firebaseId` 
    *   Response:  User data (excluding password).
    *   Authentication: None (public route).

*   **`/api/users/:userId` (GET):** Get a specific user's profile.
    *   Authentication: Required (JWT).  Authorization: Admin, or the user themselves.
    *   Parameter: `userId` (integer).

*   **`/api/users/:userId` (PUT):** Update a user's profile.
    *   Request Body: (Partial) `first_name`, `last_name`, `email`, `phone_number`, `business_name`, `business_industry`, `preferences`.  *Do not allow updating `role` or `password` through this route.*
    *   Authentication: Required (JWT).  Authorization: Admin, or the user themselves.
    *   Parameter: `userId` (integer).

*   **`/api/users/:userId/password` (PUT):** Change a user's password.
    *   Request Body: `oldPassword`, `newPassword`.
    *   Authentication: Required (JWT). Authorization: User themselves.
    *   Parameter: `userId` (integer).
    *   Note: Should include robust password validation and hashing.

**II. Lawyer-Specific Routes:**

*   **`/api/lawyers` (GET):** Get a list of lawyers (with optional filtering/pagination).
    *   Query Parameters: `specialization` (optional, for filtering by specialization), `page`, `limit`.
    *   Response: Array of lawyer profiles (basic user info + lawyer-specific data).
    *   Authentication: Optional (can be public or require JWT).

*   **`/api/lawyers/:lawyerId` (GET):** Get a specific lawyer's profile.
    *   Response: Lawyer profile (basic user info + lawyer-specific data).
    *   Authentication: Optional (can be public or require JWT).
    *   Parameter: `lawyerId` (integer).

*   **`/api/lawyers/:lawyerId` (PUT):** Update a lawyer's profile (lawyer-specific details).
    *   Request Body: `profile_bio`, `specialization`, `verification_document_url` (if updating verification document).
    *   Authentication: Required (JWT).  Authorization:  The lawyer themselves, or Admin.
    *   Parameter: `lawyerId` (integer).

**III. Document Management Routes:**

*   **`/api/document` (POST):** Upload and analyze a new document.
    *   Request Body:  `document_title`, `file` (multipart/form-data for file upload), `stored` (boolean, optional, defaults to true).
    *   Response:  Document data, including AI analysis results.
    *   Authentication: Required (JWT).
*   **`/api/document/:documentId/analysis`** (GET)
*   

**IV. AI Chatbot Routes:**

*   **`/api/ai-chats` (POST):**  Send a message to the AI chatbot.
    *   Request Body:  `user_message`, `session_id` (UUID), `document_id` (optional, if related to a document).
    *   Response: AI response, updated `session_id`.
    *   Authentication: Required (JWT).

*   **`/api/ai-chats/:sessionId` (GET):** Get chat history for a specific session.
    *   Authentication: Required (JWT).  Authorization: User who owns the session.
    *   Parameter: `sessionId` (UUID).

**V. Lawyer-User Chat Routes:**

*   **`/api/chats/:chatId/accept` (PUT):** Lawyer accepts a chat request.
    *   Authentication: Required (JWT). Authorization: The requested lawyer.
    *   Parameter: `chatId` (integer).
    *   Updates chat `status` to 'accepted'.
      
*   **`/api/chats/:uid` (GET):** Get a list of chats for the current user (both sent and received).
    *   Authentication: Required (JWT).
    *   Query Parameters: `status` (optional, filter by chat status), `page`, `limit`.

*   **`/api/chats/messages/:chatId` (GET):** Get messages for a specific chat.
    *   Authentication: Required (JWT). Authorization: User or Lawyer in the chat.
    *   Parameter: `chatId` (integer).

*   **`/api/chats/messages/:chatId` (POST):** Send a message in a chat.
    *   Request Body: `message_text` `receiverId`.
    *   Authentication: Required (JWT). Authorization: User or Lawyer in the chat.
    *   Parameter: `chatId` (integer).
*    **`/api/chats/:chatId/messages/:messageId` (PATCH):** To change is_read to true
     *  Authentication: Required (JWT). Authorization: User or Lawyer in the chat.
     * Parameters: `chatId` and `messageId`

**VI. Content Routes (Templates, Articles, Education):**

*   **`/api/articles` (GET):** Get legal articles (with filtering/pagination).
    *   Query Parameters: `category`, `tags`, `published_date` (optional, for filtering), `page`, `limit`.
    *   Authentication: Optional (can be public).

*   **`/api/education` (GET):** Get legal education resources (with filtering/pagination).
    *   Query Parameters: `topic`, `resource_type` (optional, for filtering), `page`, `limit`.
    *   Authentication: Optional (can be public).

**VII. Consultation Notes Routes:**

*   **`/api/notes` (POST):** Create a new consultation note.
    *   Request Body: `title`, `content`, `lawyer_id` (optional), `related_document_id` (optional).
    *   Authentication: Required (JWT).

*   **`/api/notes` (GET):** Get a list of the user's consultation notes.
    *   Authentication: Required (JWT).

*   **`/api/notes/:noteId` (GET):** Get a specific consultation note.
    *   Authentication: Required (JWT).  Authorization: Owner of the note, or Admin.
    *   Parameter: `noteId` (integer).

*   **`/api/notes/:noteId` (PUT):** Update a consultation note.
    *   Request Body:  `title`, `content`.
    *   Authentication: Required (JWT).  Authorization: Owner of the note.
    *   Parameter: `noteId` (integer).

*   **`/api/notes/:noteId` (DELETE):** Delete a consultation note.
    *   Authentication: Required (JWT).  Authorization: Owner of the note, or Admin.
    *   Parameter: `noteId` (integer).

**VIII. Lawyer Rating Routes:**

*   **`/api/ratings` (POST):** Submit a rating for a lawyer.
    *   Request Body: `lawyer_id`, `rating`, `comment` (optional).
    *   Authentication: Required (JWT).

*   **`/api/ratings/:lawyerId` (GET):** Get ratings for a specific lawyer.
    *   Authentication: Optional (can be public).
    *    Parameter: `lawyerId` (integer).

**IX. Admin Routes:**

*   **`/api/admin/reports` (GET):** Get all admin reports (with filtering/pagination).
    *   Authentication: Required (JWT).  Authorization: Admin.

*   **`/api/admin/reports/:reportId` (GET):** Get a specific admin report.
    *   Authentication: Required (JWT).  Authorization: Admin.
    *   Parameter: `reportId` (integer).

*   **`/api/admin/reports/:reportId` (PUT):** Update an admin report (e.g., change status, add notes).
    *   Request Body: `report_status`, `admin_notes`.
    *   Authentication: Required (JWT).  Authorization: Admin.
    *   Parameter: `reportId` (integer).

*   **`/api/admin/analytics` (GET):**  Get application analytics (user counts, document uploads, etc. - specific data to be determined).
    *   Authentication: Required (JWT).  Authorization: Admin.
