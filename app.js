const express = require('express');
const app = express();
const port = 3000;
const tasks = require('./task.json').tasks;
const priorities = new Set(['low', 'medium', 'high']);
const createdAtById = new Map(tasks.map((task, index) => [task.id, index]));
let nextCreationOrder = tasks.length;
let nextTaskId = Math.max(0, ...tasks.map((task) => task.id)) + 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isValidTask(task) {
    return typeof task.title === 'string' && task.title.trim().length > 0
        && typeof task.description === 'string' && task.description.trim().length > 0
        && typeof task.completed === 'boolean'
        && (task.priority === undefined || priorities.has(task.priority));
}

function parseTaskId(id) {
    if (!/^\d+$/.test(id)) {
        return null;
    }
    return Number(id);
}

app.get('/tasks/priority/:level', (req, res) => {
    const { level } = req.params;
    if (!priorities.has(level)) {
        return res.status(400).json({ error: 'Priority must be low, medium, or high.' });
    }
    return res.status(200).json(tasks.filter((task) => task.priority === level));
});

app.get('/tasks', (req, res) => {
    let result = [...tasks];

    if (req.query.completed !== undefined) {
        if (req.query.completed !== 'true' && req.query.completed !== 'false') {
            return res.status(400).json({ error: 'The completed filter must be true or false.' });
        }
        const completed = req.query.completed === 'true';
        result = result.filter((task) => task.completed === completed);
    }

    if (req.query.sort !== undefined) {
        const sortByOrder = req.query.sort === 'asc' || req.query.sort === 'desc';
        if (req.query.sort !== 'createdAt' && !sortByOrder) {
            return res.status(400).json({ error: 'Sort must be createdAt, asc, or desc.' });
        }
        const order = req.query.order || (sortByOrder ? req.query.sort : 'asc');
        if (order !== 'asc' && order !== 'desc') {
            return res.status(400).json({ error: 'Sort order must be asc or desc.' });
        }
        result.sort((first, second) => {
            const difference = createdAtById.get(first.id) - createdAtById.get(second.id);
            return order === 'asc' ? difference : -difference;
        });
    }

    return res.status(200).json(result);
});

app.get('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'Task ID must be a number.' });
    }
    const task = tasks.find((item) => item.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
    }
    return res.status(200).json(task);
});

app.post('/tasks', (req, res) => {
    if (!isValidTask(req.body || {})) {
        return res.status(400).json({
            error: 'A nonempty title and description, a boolean completed value, and a valid optional priority are required.',
        });
    }

    const task = {
        id: nextTaskId++,
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        completed: req.body.completed,
    };
    if (req.body.priority !== undefined) {
        task.priority = req.body.priority;
    }
    tasks.push(task);
    createdAtById.set(task.id, nextCreationOrder++);
    return res.status(201).json(task);
});

app.put('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'Task ID must be a number.' });
    }
    const taskIndex = tasks.findIndex((item) => item.id === id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }
    if (!isValidTask(req.body || {})) {
        return res.status(400).json({
            error: 'A nonempty title and description, a boolean completed value, and a valid optional priority are required.',
        });
    }

    const updatedTask = {
        id,
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        completed: req.body.completed,
    };
    if (req.body.priority !== undefined) {
        updatedTask.priority = req.body.priority;
    } else if (tasks[taskIndex].priority !== undefined) {
        updatedTask.priority = tasks[taskIndex].priority;
    }
    tasks[taskIndex] = updatedTask;
    return res.status(200).json(updatedTask);
});

app.delete('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'Task ID must be a number.' });
    }
    const taskIndex = tasks.findIndex((item) => item.id === id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }
    tasks.splice(taskIndex, 1);
    createdAtById.delete(id);
    return res.status(200).json({ message: 'Task deleted successfully.' });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ error: 'Request body must contain valid JSON.' });
    }
    return next(error);
});

if (require.main === module) {
    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
    });
}

module.exports = app;