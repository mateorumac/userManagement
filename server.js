const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const filePath = path.join(__dirname, 'db.json');

// Helper functions 
const getUsers = () => {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};

const getNextId = () => {
  const users = getUsers();
  return users.length > 0 ? Math.max(users.map(user => user.id)) + 1 : 0;
};

// CRUD routes
app.get('/users', (req, res) => {
    const users = getUsers();
    const sort = req.query.sort ? JSON.parse(req.query.sort) : [];
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || users.length;

    if (sort.length) {
        users.sort((a, b) => {
            for (const { selector, desc } of sort) {
                if (a[selector] < b[selector]) return desc ? 1 : -1;
                if (a[selector] > b[selector]) return desc ? -1 : 1;
            }
            return 0;
        });
    }
    const paginatedUsers = users.slice(skip, skip + take);
    res.json({
        items: paginatedUsers,
        totalCount: users.length
    });
});

app.post('/users', (req, res) => {
  const users = getUsers();
  const newUser = { id: getNextId(), ...req.body };
  users.push(newUser);
  saveUsers(users);
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id == req.params.id);
  if (userIndex === -1) {
    return res.status(404).send('User not found');
  }
  users[userIndex] = { ...users[userIndex], ...req.body };
  saveUsers(users);
  res.json(users[userIndex]);
});

app.delete('/users/:id', (req, res) => {
  const users = getUsers();
  const updatedUsers = users.filter((u) => u.id != req.params.id);
  saveUsers(updatedUsers);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
