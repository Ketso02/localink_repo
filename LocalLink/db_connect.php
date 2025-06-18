<?php
$host = 'localhost';
$db_name = 'locallink_db';
$username = 'root';
$password = 'root'; 

$conn = new mysqli($host, $username, $password, $db_name);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
