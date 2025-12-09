# Backend Scripts

## Create Admin User

This script creates an admin user in the database for testing and development purposes.

### Usage

```bash
npm run create-admin
```

### Default Admin Credentials

- **Phone:** +79991234567
- **Email:** admin@studmi.ru
- **Password:** admin123
- **Role:** admin
- **Balance:** 10000 RUB

### Requirements

- MongoDB must be running and accessible
- Environment variable `MONGO_URI` should be set in `.env` file
- If not set, defaults to `mongodb://localhost:27017/stolovaya`

### What the script does

1. Connects to MongoDB
2. Checks if an admin user already exists with the same email
3. If exists, displays the existing admin information
4. If not exists, creates a new admin user with the credentials above
5. Displays the login credentials

### Note

⚠️ **Security Warning:** This script is for development purposes only. In production, use a secure process for creating admin accounts with strong passwords.

### Example Output

```
Connected to MongoDB
Admin user created successfully:
{
  id: '507f1f77bcf86cd799439011',
  email: 'admin@studmi.ru',
  phone: '+79991234567',
  role: 'admin',
  balance: 10000
}

Login credentials:
Phone: +79991234567
Password: admin123

Disconnected from MongoDB
```
