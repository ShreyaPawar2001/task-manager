# Task Manager REST API

A small REST API for managing tasks with Express.js and in-memory storage. Starter tasks are loaded from `task.json` when the server starts. Changes made through the API exist only until the server process stops.

## Technologies

- Node.js 18 or newer
- Express.js
- Tap and Supertest for automated tests

## Installation and Startup

From the project directory, install the dependencies:

```sh
npm install
```

Start the server:

```sh
node app.js
```

The server listens at `http://localhost:3000`. Send JSON request bodies with the `Content-Type: application/json` header.

## Task Schema

The required fields are:

```json
{
  "id": 1,
  "title": "Set up environment",
  "description": "Install Node.js, npm, and git",
  "completed": true
}
```

`id` is assigned by the API and must be a numeric route parameter when addressing a task. `title` and `description` must be nonempty strings. `completed` must be a boolean. The optional `priority` field accepts `low`, `medium`, or `high`.

## Endpoints

### List tasks

`GET /tasks` returns all tasks with status `200`.

```json
[
  {
    "id": 1,
    "title": "Set up environment",
    "description": "Install Node.js, npm, and git",
    "completed": true
  }
]
```

Optional filters and ordering:

- `GET /tasks?completed=true` returns completed tasks.
- `GET /tasks?completed=false` returns incomplete tasks.
- `GET /tasks?sort=asc` or `GET /tasks?sort=desc` sorts by creation order.
- `GET /tasks?sort=createdAt&order=asc` sorts by creation/insertion order, oldest first.
- `GET /tasks?sort=createdAt&order=desc` sorts newest first. `order` defaults to `asc`.

### Get one task

`GET /tasks/:id` returns the task with status `200`. A numeric ID that does not exist returns `404`; a nonnumeric ID returns `400`.

### Create a task

`POST /tasks` requires `title`, `description`, and `completed`; `priority` is optional. It returns status `201` and the created task.

Request:

```json
{
  "title": "Write documentation",
  "description": "Document the task API",
  "completed": false,
  "priority": "medium"
}
```

Response:

```json
{
  "id": 16,
  "title": "Write documentation",
  "description": "Document the task API",
  "completed": false,
  "priority": "medium"
}
```

### Update a task

`PUT /tasks/:id` replaces the task's required fields and returns status `200` with the updated task. It requires a complete valid task body; an existing priority is retained if the update omits it. An unknown numeric ID returns `404`.

Request:

```json
{
  "title": "Write API documentation",
  "description": "Document endpoints and examples",
  "completed": true,
  "priority": "high"
}
```

### Delete a task

`DELETE /tasks/:id` deletes the task and returns status `200`.

```json
{
  "message": "Task deleted successfully."
}
```

An unknown numeric ID returns `404`.

### Filter by priority

`GET /tasks/priority/:level` returns matching tasks with status `200`. `:level` must be `low`, `medium`, or `high`; another value returns `400`.

## Validation and Errors

- Create and update requests require a nonempty string `title`, a nonempty string `description`, and boolean `completed`.
- Optional `priority` must be `low`, `medium`, or `high`.
- Invalid fields, filters, sort options, priorities, and nonnumeric task IDs return status `400` with a JSON `error` message.
- A numeric task ID that does not exist returns status `404` with a JSON `error` message.
- Malformed JSON request bodies return status `400`.

## Automated Tests

Run the test suite with:

```sh
npm run test
```

The tests use Tap and Supertest against the Express application.
