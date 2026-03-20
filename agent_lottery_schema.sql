CREATE TABLE agent_lottery_prizes (
    id SERIAL PRIMARY KEY,
    prize_description TEXT NOT NULL,
    num_winners INTEGER NOT NULL,
    lottery_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE agent_lottery_winners (
    id SERIAL PRIMARY KEY,
    prize_id INTEGER REFERENCES agent_lottery_prizes(id),
    agent_id TEXT NOT NULL, 
    winner_user_id TEXT NOT NULL,
    won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
