<?php
// logout.php
session_start(); // Start the session
session_unset(); // Unset all session variables
session_destroy(); // Destroy the session

// Redirect to your main index.html page
header('Location: index.html');
exit();
?>