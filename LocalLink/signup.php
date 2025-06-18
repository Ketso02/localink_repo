<?php

// Include your database connection file
require "db_connect.php";

// Initialize variables to store potential error messages
$username_err = $email_err = $password_err = "";
$signup_success = "";

// Check if the form was submitted using the POST method
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 1. Input Validation and Sanitization (Crucial for Security)

    // Validate Username
    if (empty(trim($_POST["username"]))) {
        $username_err = "Please enter a username.";
    } else {
        // You might want to add more validation, e.g., check for length, allowed characters.
        // Also, check if the username already exists in the database.
        $username = trim($_POST["username"]);

        // Example: Check if username already exists
        $sql_check_username = "SELECT id FROM users WHERE username = ?";
        if ($stmt = mysqli_prepare($conn, $sql_check_username)) {
            mysqli_stmt_bind_param($stmt, "s", $param_username);
            $param_username = $username;
            if (mysqli_stmt_execute($stmt)) {
                mysqli_stmt_store_result($stmt);
                if (mysqli_stmt_num_rows($stmt) == 1) {
                    $username_err = "This username is already taken.";
                }
            } else {
                echo "Oops! Something went wrong. Please try again later.";
            }
            mysqli_stmt_close($stmt);
        }
    }

    // Validate Email
    if (empty(trim($_POST["email"]))) {
        $email_err = "Please enter an email address.";
    } elseif (!filter_var(trim($_POST["email"]), FILTER_VALIDATE_EMAIL)) {
        $email_err = "Please enter a valid email address.";
    } else {
        $email = trim($_POST["email"]);

        // Example: Check if email already exists
        $sql_check_email = "SELECT id FROM users WHERE email = ?";
        if ($stmt = mysqli_prepare($conn, $sql_check_email)) {
            mysqli_stmt_bind_param($stmt, "s", $param_email);
            $param_email = $email;
            if (mysqli_stmt_execute($stmt)) {
                mysqli_stmt_store_result($stmt);
                if (mysqli_stmt_num_rows($stmt) == 1) {
                    $email_err = "This email is already registered.";
                }
            } else {
                echo "Oops! Something went wrong. Please try again later.";
            }
            mysqli_stmt_close($stmt);
        }
    }

    // Validate Password
    if (empty(trim($_POST["password"]))) {
        $password_err = "Please enter a password.";
    } elseif (strlen(trim($_POST["password"])) < 6) {
        $password_err = "Password must have at least 6 characters.";
    } else {
        // Hash the password using password_hash() for security
        $password = password_hash(trim($_POST["password"]), PASSWORD_DEFAULT);
    }

    // 2. Insert into Database if no errors
    if (empty($username_err) && empty($email_err) && empty($password_err)) {
        // Prepare an INSERT statement for security (prevents SQL injection)
        $sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

        if ($stmt = mysqli_prepare($conn, $sql)) {
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "sss", $param_username, $param_email, $param_password);

            // Set parameters
            $param_username = $username;
            $param_email = $email;
            $param_password = $password;

            // Attempt to execute the prepared statement
            if (mysqli_stmt_execute($stmt)) {
                $signup_success = "Sign-up successful! You can now log in.";
                // Optionally redirect to a login page: header("location: login.php");
            } else {
                echo "Something went wrong. Please try again later. Error: " . mysqli_error($conn);
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }

    // Close connection outside the if block to ensure it always closes
    mysqli_close($conn);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
    <style>
        /* Basic styling for better readability of error messages */
        .error {
            color: red;
            font-size: 0.9em;
        }
        .success {
            color: green;
            font-size: 1em;
            font-weight: bold;
        }
    </style>
</head>
<body>

<form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
  <label for="username">Username:</label><br>
  <input name="username" placeholder="Username" required value="<?php echo isset($username) ? htmlspecialchars($username) : ''; ?>"><br>
  <span class="error"><?php echo $username_err; ?></span><br><br>

  <label for="email">Email:</label><br>
  <input name="email" placeholder="Email" required value="<?php echo isset($email) ? htmlspecialchars($email) : ''; ?>"><br>
  <span class="error"><?php echo $email_err; ?></span><br><br>

  <label for="password">Password:</label><br>
  <input name="password" type="password" placeholder="Password" required><br>
  <span class="error"><?php echo $password_err; ?></span><br><br>

  <button name="signup">Sign-Up</button>

  <?php if (!empty($signup_success)) : ?>
      <p class="success"><?php echo $signup_success; ?></p>
  <?php endif; ?>
</form>

</body>
</html>