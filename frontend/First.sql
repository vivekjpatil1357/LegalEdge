CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL CHECK (
    role IN ('individual', 'business', 'lawyer', 'admin')
  ),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  business_name VARCHAR(255),
  -- For business users
  business_industry VARCHAR(255),
  -- For business users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  preferences JSONB
);
CREATE TABLE lawyers (
  lawyer_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  profile_bio TEXT,
  specialization TEXT [],
  credentials_verified BOOLEAN DEFAULT FALSE,
  verification_document_url VARCHAR(255),
  rating NUMERIC(2, 1) CHECK (
    rating >= 0
    AND rating <= 5
  ),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chats (
  chat_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  -- Initiating user
  lawyer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  -- Lawyer
  status VARCHAR(50) NOT NULL CHECK (
    status IN ('pending', 'accepted', 'rejected', 'closed')
  ),
  -- Chat status (When requested)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_different_users CHECK (user_id <> lawyer_id)
);
CREATE TABLE chat_messages (
  message_id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  -- User or Lawyer
  message_text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  CONSTRAINT check_chat_participants CHECK (
    sender_id IN (
      (
        SELECT user_id
        FROM chats
        WHERE chat_id = chat_messages.chat_id
      ),
      (
        SELECT lawyer_id
        FROM chats
        WHERE chat_id = chat_messages.chat_id
      )
    )
  )
);
CREATE TABLE documents (
  document_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  document_title VARCHAR(255) NOT NULL,
  file_url VARCHAR(255),
  -- Never will be used
  analysis_outline JSONB,
  -- AI-generated outline/summary
  key_clauses JSONB,
  -- AI-extracted key clauses
  key_points JSONB,
  -- AI-identified key points
  risk_assessment JSONB,
  -- AI-generated risk assessment
  beneficial_points JSONB,
  -- AI-identified beneficial points
  original_filename VARCHAR(255),
  -- Original name of uploaded file
  file_type VARCHAR(50),
  stored BOOLEAN DEFAULT FALSE,
  -- Just in case
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ai_chats (
  chat_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(document_id) ON DELETE
  SET NULL,
    -- Optional: Linked document context
    session_id UUID NOT NULL,
    -- To group messages in a single chat session
    user_message TEXT NOT NULL,
    ai_response TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE legal_articles (
  article_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  -- Store the article content
  source_url VARCHAR(255),
  -- URL of the news sources
  published_date DATE,
  category VARCHAR(100),
  tags TEXT [],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE legal_education_resources (
  resource_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_url VARCHAR(255) NOT NULL,
  -- Allow for many resources?
  resource_type VARCHAR(50),
  topic VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE consultation_notes (
  note_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lawyer_id INTEGER REFERENCES lawyers(lawyer_id) ON DELETE
  SET NULL,
    -- Optional: Lawyer involved
    title VARCHAR(255) NOT NULL,
    content TEXT,
    related_document_id INTEGER REFERENCES documents(document_id) ON DELETE
  SET NULL,
    -- Optional: Link to a document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE lawyer_ratings (
  rating_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lawyer_id INTEGER NOT NULL REFERENCES lawyers(lawyer_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (
    rating >= 1
    AND rating <= 5
  ),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Function to update lawyer's average rating and rating count (Trigger after insert/update on lawyer_ratings)
CREATE OR REPLACE FUNCTION update_lawyer_rating() RETURNS TRIGGER AS $$ BEGIN
UPDATE lawyers
SET rating = (
    SELECT AVG(rating)
    FROM lawyer_ratings
    WHERE lawyer_id = NEW.lawyer_id
  ),
  rating_count = (
    SELECT COUNT(*)
    FROM lawyer_ratings
    WHERE lawyer_id = NEW.lawyer_id
  )
WHERE lawyer_id = NEW.lawyer_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER lawyer_rating_trigger
AFTER
INSERT
  OR
UPDATE ON lawyer_ratings FOR EACH ROW EXECUTE FUNCTION update_lawyer_rating();
CREATE TABLE admin_reports (
  report_id SERIAL PRIMARY KEY,
  reported_by_user_id INTEGER REFERENCES users(user_id) ON DELETE
  SET NULL,
    -- User who reported
    reported_item_type VARCHAR(50) NOT NULL CHECK (
      reported_item_type IN (
        'document',
        'article',
        'template',
        'chat_message',
        'other'
      )
    ),
    reported_item_id INTEGER,
    -- ID of the reported item (can be document_id, article_id, etc.)
    report_reason TEXT,
    report_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'resolved', 'rejected'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_lawyer_id ON chats(lawyer_id);