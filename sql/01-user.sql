CREATE USER 'toxic'@'127.0.0.1' IDENTIFIED BY 'toxic';
GRANT ALL PRIVILEGES ON toxic.* TO 'toxic'@'127.0.0.1';
ALTER USER 'toxic'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'toxic';