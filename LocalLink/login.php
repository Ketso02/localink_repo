<?php
session_start(); // Start the session at the very beginning of the script

// Include your database connection file
require "db_connect.php";

// Initialize variables for error messages
$email_err = $password_err = "";
$login_success = "";

// Check if the form was submitted using POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 1. Input Validation and Sanitization

    // Validate Email
    if (empty(trim($_POST["email"]))) {
        $email_err = "Please enter your email address.";
    } else {
        $email = trim($_POST["email"]);
    }

    // Validate Password
    if (empty(trim($_POST["password"]))) {
        $password_err = "Please enter your password.";
    } else {
        $password = trim($_POST["password"]);
    }

    // 2. Authenticate User if no validation errors
    if (empty($email_err) && empty($password_err)) {
        // Prepare a SELECT statement
        $sql = "SELECT id, username, password FROM users WHERE email = ?";

        if ($stmt = mysqli_prepare($conn, $sql)) {
            // Bind parameters
            mysqli_stmt_bind_param($stmt, "s", $param_email);

            // Set parameters
            $param_email = $email;

            // Attempt to execute the prepared statement
            if (mysqli_stmt_execute($stmt)) {
                // Store result
                mysqli_stmt_store_result($stmt);

                // Check if email exists, if yes then verify password
                if (mysqli_stmt_num_rows($stmt) == 1) {
                    // Bind result variables
                    mysqli_stmt_bind_result($stmt, $id, $username, $hashed_password);
                    if (mysqli_stmt_fetch($stmt)) {
                        // Verify the hashed password with the submitted password
                        if (password_verify($password, $hashed_password)) {
                            // Password is correct, start a new session
                            // session_start(); // Already started at the top

                            // Store data in session variables
                            $_SESSION["loggedin"] = true;
                            $_SESSION["id"] = $id;
                            $_SESSION["username"] = $username;

                            $login_success = "Login successful! Welcome, " . htmlspecialchars($username) . "!";
                            // Redirect user to the welcome page or dashboard
                            header("location: index.html"); // Or a dashboard page like 'welcome.php'
                            exit(); // Important to exit after header redirect
                        } else {
                            // Password is not valid
                            $password_err = "The password you entered was not valid.";
                        }
                    }
                } else {
                    // Email doesn't exist
                    $email_err = "No account found with that email address.";
                }
            } else {
                echo "Oops! Something went wrong. Please try again later.";
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }

    // Close connection (ensure it closes whether login was successful or not)
    mysqli_close($conn);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <style>
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
  <label for="email">Email:</label><br>
  <input name="email" type="email" placeholder="Email" required value="<?php echo isset($email) ? htmlspecialchars($email) : ''; ?>"><br>
  <span class="error"><?php echo $email_err; ?></span><br><br>

  <label for="password">Password:</label><br>
  <input name="password" type="password" placeholder="Password" required><br>
  <span class="error"><?php echo $password_err; ?></span><br><br>

  <button name="login_submit">Login</button>

  <?php if (!empty($login_success)) : ?>
      <p class="success"><?php echo $login_success; ?></p>
  <?php endif; ?>

  <p>Don't have an account? <a href="signup.php">Sign Up</a></p>
</form>

</body>
</html>