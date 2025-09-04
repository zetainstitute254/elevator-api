
# **Elevator API** 🏢

### **Project Description** 📝

This project provides a robust, well-documented API for a simulated elevator system. It is built using Node.js, Express, and a SQLite database. The API allows for asynchronous elevator movement, real-time status tracking, and comprehensive event logging.

The solution is designed with a clear **Separation of Concerns**, making it scalable and easy for a team to maintain.

-----

### **Features** ✨

  * **Asynchronous Movement:** Elevators operate independently, with all actions logged in real-time.
  * **Two Primary Endpoints:**
      * `POST /api/elevator/call`: To call an elevator from one floor to another.
      * `GET /api/elevator/status`: To retrieve the real-time location, state, and direction of all elevators.
  * **Event Logging:** All elevator actions (movement, door operations, etc.) are logged with timestamps and details.
  * **SQL Query Auditing:** Every database query is tracked with information on where and what initiated the call.
  * **Persistent Storage:** All data (elevator state and logs) is stored in a SQLite database.
  * **Comprehensive Unit Tests:** The API includes unit tests to ensure reliability and correct functionality.

-----

### **Prerequisites** 🛠️

Before you begin, ensure you have the following software installed on your system:

  * **Node.js**: Version 14 or higher.
  * **npm**: The Node Package Manager, which comes bundled with Node.js.

-----

### **Installation** 💻

1.  **Clone the repository:**

    ```bash
    git clone  https://github.com/iProjects/elevator-api.git
    cd elevator-api
    ```

2.  **Install project dependencies:**
    This command will read the `package.json` file and install all necessary packages.

    ```bash
    npm install
    ```

-----

### **Configuration** ⚙️

The application uses an `.env` file for configuration. This file is not included in the repository for security reasons.

1.  **Create a `.env` file** in the root directory of the project:

    ```bash
    touch .env
    ```

2.  **Add the following content** to the newly created `.env` file. You can adjust the values to fit your needs.

    ```
    # Application Port
    PORT=3000

    # SQLite Database Path
    DB_PATH=./elevator.db

    # Elevator System Configuration
    NUM_ELEVATORS=5
    MAX_FLOORS=20
    FLOOR_TRAVEL_TIME_MS=5000
    DOOR_ACTION_TIME_MS=2000
    ```

-----

### **Running the Application** ▶️

To start the API server, use the following command:

```bash
npm start
```

You should see a message in your terminal confirming that the server is running on the specified port, and that the database and elevators have been initialized.

```
Connected to the SQLite database.
Initialized 5 elevators.
Elevator API server listening on port 3000
```

-----

### **API Endpoints** 🌐

Once the server is running, you can use tools like `curl`, Postman, or VS Code's REST Client to interact with the API.

#### **1. Call an Elevator** 📞

  * **URL:** `http://localhost:3000/api/elevator/call`
  * **Method:** `POST`
  * **Headers:** `Content-Type: application/json`
  * **Body:**
    ```json
    {
      "start_floor": 1,
      "end_floor": 10
    }
    ```
  * **Example Response (202 Accepted):**
    ```json
    {
      "success": true,
      "jobId": "c1f7b8a-9d2e-4f6c-8a1a-7e5f9c4d3b2a",
      "message": "Elevator dispatched.",
      "elevator_id": 1,
      "status": "Moving"
    }
    ```

#### **2. Get Elevator Status** 📊

  * **URL:** `http://localhost:3000/api/elevator/status`
  * **Method:** `GET`
  * **Optional Query Parameter:** `?elevator_id=<number>` (e.g., `?elevator_id=1`)
  * **Example Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "current_floor": 5,
        "state": "Moving",
        "direction": "Up"
      },
      {
        "id": 2,
        "current_floor": 1,
        "state": "Idle",
        "direction": "None"
      }
    ]
    ```

-----

### **Running Tests** ✅

Unit tests are included to ensure the API's reliability. To run the tests, execute the following command:

```bash
npm test
```

The output will display the results for each test suite, showing which tests passed and which, if any, failed.

```
PASS  tests/elevator.test.js
  Elevator API Endpoints
    ... (test results) ...

Test Suites: 1 passed, 1 total
Tests:      4 passed, 4 total
Time:        ...
```

### **Live API Link** 🌐🔗

https://elevator-api-33fb.onrender.com






