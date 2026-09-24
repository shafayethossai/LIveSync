# LiveSync Backend Guide

This file explains how the backend starts, how one request moves through the system, and why the project is structured the way it is.

## Big Picture

The backend is built as a layered Go application:

1. `main.go` starts the app.
2. `cmd.Serve()` loads configuration.
3. The database connection is created.
4. SQL migrations are applied.
5. Middleware, repositories, handlers, and websocket components are wired together.
6. The HTTP server starts and waits for requests.

The main idea is: each layer has one job.

- Config layer: read environment values.
- DB layer: connect and migrate.
- Repo layer: talk to the database.
- Handler layer: handle HTTP requests and responses.
- Middleware layer: handle shared request logic like CORS and JWT auth.
- Server layer: register routes and run the HTTP server.
- Socket layer: manage realtime websocket connections.

## Startup Flow

### 1. `main.go`

The entry point is very small:

```go
func main() {
    cmd.Serve()
}
```

This means `main.go` does not contain business logic. It only delegates startup to `cmd.Serve()`.

Why this is good:

- keeps the entrypoint clean
- makes startup logic easier to read
- allows the project to grow without turning `main.go` into a mess

### 2. `cmd.Serve()`

This is the real bootstrap function. It creates the full backend stack in this order:

```go
cnf := config.GetConfig()
dbCon, err := db.NewConnection(cnf.ConnectionString)
err = db.MigrateDB(dbCon, "./migrations")
middleware := middlewares.NewMiddleware(cnf)
userRepo := repo.NewUserRepo(dbCon)
adminRepo := repo.NewAdminRepo(dbCon)
postRepo := repo.NewPostRepo(dbCon)
messageRepo := repo.NewMessageRepo(dbCon)
socketManager := socket.GetManager()
socketHandler := socket.NewHandler(cnf, socketManager)
userHandler := userHandler.NewHandler(cnf, userRepo, middleware, dbCon)
adminHandler := adminHandler.NewHandler(cnf, adminRepo, userRepo, postRepo, middleware, dbCon)
postHandler := postHandler.NewHandler(cnf, postRepo, middleware)
messageHandler := messageHandler.NewHandler(cnf, messageRepo, middleware, socketManager)
server := rest.NewServer(...)
server.Start()
```

Think of this function as the wiring room of the application. Nothing user-facing happens here. It only prepares every dependency and connects them.

## Config Loading

### `config.GetConfig()`

The config package uses a package-level variable called `configuration`.

```go
func GetConfig() *Config {
    if configuration == nil {
        loadConfig()
    }
    return configuration
}
```

This behaves like a lazy singleton:

- the config is loaded only once
- later calls return the same struct
- all parts of the app share one source of truth

### `loadConfig()`

`loadConfig()` does two jobs:

1. loads variables from `.env` using `godotenv.Load()`
2. reads environment values and fills the `Config` struct

It validates required values like:

- `VERSION`
- `SERVICENAME`
- `HTTPPORT`
- `SECRETKEY`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENABLE_SSL_MODE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- `DB_STRING`

If one required value is missing, the app exits immediately.

Why this matters:

- the app fails early if configuration is broken
- you avoid starting a server that cannot connect to the database
- runtime errors become startup errors, which are easier to debug

## Database Connection

### `db.NewConnection()`

The database connection is created with the connection string from config:

```go
dbCon, err := db.NewConnection(cnf.ConnectionString)
```

Inside `NewConnection()`:

- `sqlx.Connect("pgx", connectionString)` opens the PostgreSQL connection
- `sync.Once` makes sure the connection is created only once
- connection pool settings are configured

The `sync.Once` part is important because it turns the DB connection into a shared instance.

Why use one shared database connection object:

- opening a DB connection is expensive
- a shared pool is safer and faster
- repositories can all reuse the same connection pool

If you did not do this, the app could keep opening new DB connections and waste resources.

## Migration Step

### `db.MigrateDB()`

After connecting, the app runs migrations:

```go
err = db.MigrateDB(dbCon, "./migrations")
```

This uses `sql-migrate` to apply all pending `up` migration files from the `migrations` folder.

Why this happens before serving requests:

- the code expects the tables and columns to exist
- migrations guarantee the schema is ready
- the app can start with the right database structure every time

If migrations were skipped, repository queries could fail because tables or columns might not exist yet.

## Middleware Layer

### `middlewares.NewMiddleware(cnf)`

This creates a middleware object that stores config:

```go
type Middleware struct {
    cnf *config.Config
}
```

This is useful because authentication middleware needs access to `SecretKey` from config.

Why keep config inside middleware:

- JWT verification needs the secret key
- middleware becomes reusable and does not depend on global variables
- different middleware methods can share the same config object

### Why a struct instead of a plain function

If middleware did not have a struct:

- every function would need config passed separately
- shared state would be harder to manage
- future middleware features would be harder to add

The struct gives the middleware package a place to store shared dependencies.

## Repository Layer

The repositories are the database access layer.

They are responsible for:

- creating SQL queries
- reading rows from PostgreSQL
- writing rows to PostgreSQL
- converting database results into Go structs

They are not responsible for HTTP logic.

### Why repositories exist

Without repositories, SQL would be spread across handlers.

That would cause:

- duplicated query code
- hard-to-test handlers
- messy and tightly coupled business logic
- difficult future changes when tables or queries change

Repositories solve this by centralizing database work.

### Interface + struct pattern

Example:

```go
type UserRepo interface {
    Create(user User) (*User, error)
    FindByEmail(email string, password string) (*User, error)
    FindByID(id string) (*User, error)
}

type userRepo struct {
    db *sqlx.DB
}

func NewUserRepo(db *sqlx.DB) UserRepo {
    return &userRepo{db: db}
}
```

What this means:

- `UserRepo` is the contract
- `userRepo` is the real implementation
- `NewUserRepo()` returns the interface, not the concrete type

Why this is useful:

- handlers depend on behavior, not implementation details
- easier unit testing because you can swap in a mock repo
- easier to change the database implementation later

This is dependency injection in practice.

### Why the repo struct stores `db *sqlx.DB`

That database connection is needed inside every repository method.

So `NewUserRepo(dbCon)` means:

- the repo gets access to the shared connection pool
- the repo can execute queries whenever a handler asks it to
- the handler does not talk directly to PostgreSQL

## Singleton Pattern in This Project

You used singleton-style access in a few places:

- `config.GetConfig()` returns one shared config instance
- `db.NewConnection()` uses `sync.Once` to create one DB connection pool
- `socket.GetManager()` uses `sync.Once` to create one websocket manager

Why singleton-style sharing helps:

- avoids creating duplicates
- keeps application state consistent
- reduces memory and connection overhead
- matches the idea that these objects represent shared system resources

For example, there should be only one DB pool and one websocket manager for the whole server.

## Websocket Manager

### `socket.GetManager()`

This returns the shared websocket manager.

The manager keeps track of active websocket connections by user ID.

Think of it like a live address book:

- user 12 can have one or more active websocket connections
- when a message arrives, the manager can broadcast to the right user
- when a connection closes, it is removed from the map

### Why it exists

If you did not use a manager:

- every websocket connection would be isolated
- broadcasting to a specific user would be difficult
- tracking online users would be messy

The manager solves connection tracking and live message delivery.

## Handler Layer

Handlers are the HTTP controllers of the project.

They receive:

- `w http.ResponseWriter`
- `r *http.Request`

They are responsible for:

- reading the request body
- validating input
- calling the repository
- sending response data back to the client

### Why handlers are structs

Example:

```go
type Handler struct {
    cnf         *config.Config
    userRepo    repo.UserRepo
    middlewares *middlewares.Middleware
}
```

This lets the handler carry the dependencies it needs.

Why this is better than global functions:

- easier to test
- easier to extend
- less global state
- clearer dependency flow

The handler becomes a focused unit that knows which repo and config it should use.

## HTTP Server Layer

### `rest.NewServer()`

The server struct stores all handlers and config in one place:

```go
server := rest.NewServer(
    cnf,
    userHandler,
    adminHandler,
    postHandler,
    messageHandler,
    socketHandler,
)
```

This is the final assembly step before starting the app.

### Why the server struct exists

It gives the app one object that knows about all route groups.

That means:

- route registration is centralized
- the HTTP startup code stays organized
- the server can add future features in one place

## Route Registration

### `server.Start()`

This is where the request handling pipeline is built.

The sequence is:

1. create a middleware manager
2. add global middlewares like CORS, preflight, logger
3. create `http.NewServeMux()`
4. wrap the mux with global middlewares
5. register all handler routes
6. register websocket route
7. start the HTTP server

### Why wrap the mux

`WrapMux()` makes the whole router pass through the global middlewares first.

That means every request gets the shared behavior:

- CORS headers
- preflight handling
- logging

before it reaches a specific route.

### Why use both global and route-level middleware

Global middleware:

- applies to every request
- good for shared concerns like CORS

Route-level middleware:

- applies only to selected endpoints
- good for JWT auth on protected routes

So public routes stay public, while protected routes require authentication.

## How A Request Moves Through The App

Here is the full request path in simple words.

```mermaid
flowchart TD
    A[main.go] --> B[cmd.Serve()]
    B --> C[Load config from .env]
    C --> D[Create DB connection]
    D --> E[Run migrations]
    E --> F[Create middleware manager]
    F --> G[Create repositories]
    G --> H[Create handlers]
    H --> I[Create server]
    I --> J[Start HTTP server]
    J --> K[Request enters global middleware]
    K --> L[Route matching in ServeMux]
    L --> M[Route-level middleware like JWT]
    M --> N[Handler]
    N --> O[Repository]
    O --> P[Database]
    P --> O
    O --> N
    N --> Q[SendData or SendError]
    Q --> R[JSON response to client]
```

### Example: create user request

Suppose the client sends a `POST /api/users` request.

The flow is:

1. request reaches the server
2. global middleware runs first
3. ServeMux finds the matching route
4. `h.CreateUser` is called
5. JSON body is decoded into a request struct
6. required fields are validated
7. default role is set if missing
8. `h.userRepo.Create(...)` is called
9. repository hashes the password and inserts the row
10. repository returns the created user
11. handler sends a JSON response using `SendData`

## Create User Handler Explained

### Request struct

```go
type CreateUserRequest struct {
    Name     string `json:"name"`
    Email    string `json:"email"`
    Password string `json:"password"`
    Phone    string `json:"phone,omitempty"`
    Role     string `json:"role,omitempty"`
}
```

This struct acts like a template for the incoming JSON body.

Why use a struct:

- it maps JSON keys into Go fields
- it makes validation easier
- it makes the expected request shape obvious

### JSON decoding

```go
decoder := json.NewDecoder(r.Body)
err := decoder.Decode(&req)
```

This reads the raw request body and copies the JSON values into the struct.

Visualize it like this:

- request body arrives as raw JSON text
- decoder reads that text
- the values are placed into `req`

### Validation

The handler checks required fields:

- `Name`
- `Email`
- `Password`

If anything is missing, it returns a bad request response.

This is important because it protects the repository from invalid input.

### Calling the repository

```go
user, err := h.userRepo.Create(repo.User{...})
```

At this point the handler stops caring about SQL details.

It only says:

- here is the user data
- please store it in the database

The repository handles the database-specific work.

## Repository Create Function Explained

Example from `userRepo.Create()`:

```go
func (r *userRepo) Create(user User) (*User, error) {
    if user.PasswordHash != "" {
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
        if err != nil {
            return nil, err
        }
        user.PasswordHash = string(hashedPassword)
    }

    query := `INSERT INTO users ... RETURNING id, created_at`
    row := r.db.QueryRow(query, ...)
    err := row.Scan(&user.ID, &user.CreatedAt)
    ...
}
```

What happens here:

- the plain password is hashed before saving
- SQL `INSERT` stores the data in PostgreSQL
- `RETURNING` gives back generated values like ID and created time
- duplicate email errors are mapped to a friendly error

Why hashing is required:

- passwords should never be stored as plain text
- bcrypt makes the password safe to store

Why the repo returns the created user:

- the handler can confirm success
- the client gets useful response data
- the app can show the created record immediately

## `SendData` and `SendError`

These helpers standardize API responses.

### `SendData`

```go
func SendData(w http.ResponseWriter, statusCode int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(data)
}
```

This:

- sets the response type to JSON
- sends the HTTP status code
- serializes the response data into JSON

### `SendError`

```go
func SendError(w http.ResponseWriter, statusCode int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(map[string]string{"error": message})
}
```

This sends errors in one consistent shape:

```json
{"error":"Invalid req body"}
```

Why this helper is useful:

- every API response stays consistent
- frontend code becomes easier to write
- error handling is repeated less often

## Middleware Manager

The `Manager` type is used to combine middleware functions.

```go
type Middlewares func(http.Handler) http.Handler
```

This means every middleware takes a handler and returns a new handler.

### `Use()`

Adds global middleware to the app.

### `With()`

Applies middleware to one route.

### `WrapMux()`

Wraps the entire router with shared middleware.

### Why this pattern works

It lets you build a chain:

- middleware 1
- middleware 2
- actual handler

Each middleware can inspect or modify the request before passing it along.

## JWT Authentication Middleware

`AuthenticateJWT()` reads the `Authorization` header.

Flow:

1. read token from header
2. split `Bearer <token>`
3. verify token with secret key
4. put user information into request context
5. call next handler

Why context is used:

- the handler can later read the authenticated user ID
- the request carries identity data without global variables

If this middleware is not used on protected routes:

- anyone could call private endpoints
- the app would not know who the current user is

## Websocket Flow

The websocket route is:

```go
mux.Handle("GET /ws/messages", http.HandlerFunc(server.socketHandler.ServeWS))
```

### What happens in `ServeWS()`

1. read token from query or authorization header
2. verify JWT
3. upgrade HTTP to websocket
4. register the connection in the shared manager
5. keep the connection open until it closes

### Why websocket is used

HTTP is request/response only.

Websocket gives you a permanent connection, which is better for realtime chat.

That is why messages can be pushed instantly to a connected user.

## Why This Architecture Is Good

### Separation of concerns

Each layer has a single responsibility.

- handlers manage HTTP
- repos manage database access
- middleware manages cross-cutting request logic
- config manages environment values
- socket manager manages realtime connections

### Easier testing

Because handlers depend on interfaces, you can replace real repos with mocks in tests.

### Easier maintenance

If the database schema changes, most changes stay inside the repo layer.

If auth logic changes, most changes stay inside middleware.

### Easier scaling of the codebase

When the project grows, the code stays organized instead of turning into one large file.

## Short Interview Answer Version

If someone asks you to explain the project quickly, you can say:

> `main.go` calls `cmd.Serve()`. `Serve()` loads config from `.env`, connects to PostgreSQL, runs migrations, builds shared middleware and repositories, creates handlers, then starts the HTTP server. Incoming requests first pass through global middleware like CORS and preflight, then route-level middleware like JWT auth, then the handler. The handler validates the request, calls the repository, and the repository runs SQL against the database. Responses are returned as JSON using `SendData` and `SendError`. Websocket connections are managed by a singleton socket manager for realtime chat.

## Mental Model

Remember it like this:

- `main.go` is the switch
- `cmd.Serve()` is the engine startup
- config is the fuel source
- DB connection is the road to storage
- migrations prepare the road
- middleware is the checkpoint
- handlers are the front desk
- repositories are the workers that access the database
- socket manager is the live chat desk
- server is the building that ties everything together

Once you see it this way, the project is much easier to remember.