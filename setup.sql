
-- make sure the websiteuser account is set up and has the correct privileges
CREATE USER IF NOT EXISTS websiteuser IDENTIFIED BY 'websitepassword';
GRANT INSERT, SELECT, UPDATE, DELETE ON website.* TO websiteuser;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE IF NOT EXISTS roles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(25) NOT NULL,
  description VARCHAR(140)
);

INSERT INTO roles(name, description) VALUES("user", "user who can add game and reviews");
INSERT INTO roles(name, description) VALUES("guest", "user who has no access");

CREATE TABLE IF NOT EXISTS users (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(25) UNIQUE NOT NULL,
  password VARCHAR(70) NOT NULL,
  email VARCHAR(70),
  profile VARCHAR(140),
  role_id MEDIUMINT UNSIGNED,
  constraint FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users(username, password, profile, role_id)
	VALUES("user1", "$2a$10$efukeAAxezJijmTu7zmP7OTnLlBcR6KrpdHNvhT.RD6ARGIgQa51e", "/spa/uploads.profile/profile.jpg", 1);

INSERT INTO users(username, password, profile, role_id)
	VALUES("user2", "$2a$10$efukeAAxezJijmTu7zmP7OTnLlBcR6KrpdHNvhT.RD6ARGIgQa51e", "/spa/uploads.profile/profile.jpg", 1);

INSERT INTO users(username, password, profile, role_id)
	VALUES("user3", "$2a$10$efukeAAxezJijmTu7zmP7OTnLlBcR6KrpdHNvhT.RD6ARGIgQa51e", "/spa/uploads.profile/profile.jpg", 1);

INSERT INTO users(username, password, profile, role_id)
	VALUES("user4", "$2a$10$efukeAAxezJijmTu7zmP7OTnLlBcR6KrpdHNvhT.RD6ARGIgQa51e", "/spa/uploads.profile/profile.jpg", 2);

CREATE TABLE IF NOT EXISTS games (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(25) UNIQUE NOT NULL,
  publisher VARCHAR(70) NOT NULL,
  year VARCHAR(4) NOT NULL,
  add_date DATE NOT NULL,
  description VARCHAR(140),
  cover VARCHAR(140),
  user MEDIUMINT UNSIGNED,
  constraint FOREIGN KEY (user) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content VARCHAR(140) NOT NULL,
  date DATE NOT NULL,
  score TINYINT,
  country VARCHAR(70) NOT NULL,
  region VARCHAR(70) NOT NULL,

  user MEDIUMINT UNSIGNED,
  game MEDIUMINT UNSIGNED,

  constraint FOREIGN KEY (user) REFERENCES users(id),
  constraint FOREIGN KEY (game) REFERENCES games(id)
)
